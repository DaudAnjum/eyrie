"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  createClient,
  getNextMembershipNumber,
  uploadFile,
  uploadMultipleFiles,
} from "./clientFunctions";
import { FaUserPlus } from "react-icons/fa";
import { Client } from "@/types";

interface CreateClientSectionProps {
  onClose?: () => void;
  onClientCreated?: () => void;
}

export default function CreateClientSection({
  onClose,
  onClientCreated,
}: CreateClientSectionProps) {
  const [formData, setFormData] = useState<any>({
    membership_number: "",
    client_name: "",
    CNIC: "",
    passport_number: "",
    address: "",
    email: "",
    contact_number: "",
    other_contact: "",
    next_of_kin: "",
    apartment_ids: "",
    installment_plan: "Monthly Plan",
    discount: "0",
    amount_payable: "",
    agent_name: "",
    status: "Active",
    client_image: null as File | null,
    documents: [] as File[],
    relevent_notice: [] as File[],
    notes: "",
  });

  const [floorIds, setFloorIds] = useState<string[]>([]);
  const [apartments, setApartments] = useState<any[]>([]);
  const [selectedFloor, setSelectedFloor] = useState("");
  const [selectedApartment, setSelectedApartment] = useState("");
  const [selectedApartments, setSelectedApartments] = useState<any[]>([]); // 🆕 store multiple apartments
  const [basePrice, setBasePrice] = useState<number | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // 🧩 Fetch floors (exclude basement)
  useEffect(() => {
    const fetchFloors = async () => {
      try {
        const { data, error } = await supabase
          .from("apartments")
          .select("floor_id")
          .order("floor_id", { ascending: true });

        if (error) throw error;
        if (data) {
          const uniqueFloors = Array.from(
            new Set(
              data
                .map((apt) => apt.floor_id)
                .filter(
                  (id): id is string =>
                    id !== null && id.toLowerCase() !== "basement"
                )
            )
          );
          const desiredOrder = [
            "lower-ground",
            "ground",
            "first",
            "second",
            "third",
            "fourth",
            "fifth",
            "sixth",
            "seventh",
            "eighth",
            "ninth",
          ];
          const orderedFloors = desiredOrder.filter((f) =>
            uniqueFloors.includes(f)
          );
          setFloorIds(orderedFloors);
        }
      } catch (err: any) {
        console.error("fetchFloors error:", err?.message ?? err);
      }
    };
    fetchFloors();
  }, []);

  // 🏢 Fetch apartments when floor changes
  useEffect(() => {
    const fetchApartments = async () => {
      if (!selectedFloor) return;
      const { data, error } = await supabase
        .from("apartments")
        .select("*")
        .eq("floor_id", selectedFloor)
        .eq("status", "available"); // 🆕 Only show available apartments
      if (error) throw error;
      setApartments(data || []);
    };
    fetchApartments();
  }, [selectedFloor]);

  // 🏢 Add selected apartment (multiple support)
  useEffect(() => {
    if (!selectedApartment) return;

    const selectedApt = apartments.find((a) => a.number === selectedApartment);
    if (selectedApt) {
      setSelectedApartments((prev) => {
        // prevent duplicates
        if (prev.find((apt) => apt.id === selectedApt.id)) return prev;
        return [...prev, selectedApt];
      });
      setSelectedApartment(""); // reset dropdown for next selection
    }
  }, [selectedApartment]);

  // 🔄 Update formData.apartment_ids whenever selectedApartments changes
  useEffect(() => {
    setFormData((prev: any) => ({
      ...prev,
      apartment_ids: selectedApartments.map((apt) => apt.id),
    }));
  }, [selectedApartments]);

  // // 🧩 Fetch floors in order
  // useEffect(() => {
  //   const fetchFloors = async () => {
  //     try {
  //       const { data, error } = await supabase
  //         .from("apartments")
  //         .select("floor_id")
  //         .order("floor_id", { ascending: true });

  //       if (error) throw error;
  //       if (data) {
  //         const uniqueFloors = Array.from(
  //           new Set(
  //             data
  //               .map((apt) => apt.floor_id)
  //               .filter(
  //                 (id): id is string =>
  //                   id !== null && id.toLowerCase() !== "basement"
  //               )
  //           )
  //         );
  //         const desiredOrder = [
  //           "lower-ground",
  //           "ground",
  //           "first",
  //           "second",
  //           "third",
  //           "fourth",
  //           "fifth",
  //           "sixth",
  //           "seventh",
  //           "eighth",
  //           "ninth",
  //         ];
  //         const orderedFloors = desiredOrder.filter((f) =>
  //           uniqueFloors.includes(f)
  //         );
  //         setFloorIds(orderedFloors);
  //       }
  //     } catch (err: any) {
  //       console.error("fetchFloors error:", err?.message ?? err);
  //     }
  //   };
  //   fetchFloors();
  // }, []);

  // // 🏢 Fetch apartments when floor changes
  // useEffect(() => {
  //   const fetchApartments = async () => {
  //     if (!selectedFloor) return;
  //     const { data, error } = await supabase
  //       .from("apartments")
  //       .select("*")
  //       .eq("floor_id", selectedFloor);
  //     if (error) throw error;
  //     setApartments(data || []);
  //   };
  //   fetchApartments();
  // }, [selectedFloor]);

  // // 🧮 Fetch base price when apartment changes
  // useEffect(() => {
  //   const selectedApt = apartments.find((a) => a.number === selectedApartment);
  //   if (selectedApt) {
  //     setFormData((prev: any) => ({
  //       ...prev,
  //       apartment_ids: [...(prev.apartment_ids || []), selectedApt.id],
  //     }));
  //     setBasePrice(selectedApt.price);
  //   }
  // }, [selectedApartment]);

  // 🧮 Calculate amount payable (discount logic)
  // useEffect(() => {
  //   const discountValue =
  //     formData.discount && !isNaN(Number(formData.discount))
  //       ? Number(formData.discount)
  //       : 0;
  //   if (basePrice != null) {
  //     const finalPrice = basePrice - (basePrice * discountValue) / 100;
  //     setFormData((prev: any) => ({
  //       ...prev,
  //       amount_payable: Math.round(finalPrice),
  //     }));
  //   }
  // }, [basePrice, formData.discount]);

  // 🧮 Calculate and display amount payable (for multiple apartments)
  useEffect(() => {
    const discountValue =
      formData.discount && !isNaN(Number(formData.discount))
        ? Number(formData.discount)
        : 0;

    // 🟢 Gather all selected apartments' prices
    const totalBasePrice = selectedApartments.reduce(
      (sum, apt) => sum + (Number(apt.price) || 0),
      0
    );

    // 🟢 Prepare a readable breakdown (e.g., "500000 + 650000")
    const breakdown = selectedApartments
      .map((apt) => (apt.price ? Number(apt.price).toLocaleString() : "0"))
      .join(" + ");

    // 🧮 Apply discount to total
    const discountedTotal =
      totalBasePrice - (totalBasePrice * discountValue) / 100;

    // 🟢 Store total numeric value in formData.amount_payable
    setFormData((prev: any) => ({
      ...prev,
      amount_payable: Math.round(discountedTotal),
      amount_breakdown: breakdown, // 🆕 store visual breakdown (not saved to DB)
    }));
  }, [selectedApartments, formData.discount]);

  // 🧮 Generate membership number
  useEffect(() => {
    const fetchMembershipNumber = async () => {
      const number = await getNextMembershipNumber();
      setFormData((prev: any) => ({ ...prev, membership_number: number }));
    };
    fetchMembershipNumber();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: "client_image" | "documents" | "relevent_notice"
  ) => {
    const files = e.target.files;
    if (!files) return;

    setFormData((prev: Client) => ({
      ...prev,
      ...(field === "client_image"
        ? { client_image: files[0] }
        : field === "documents"
        ? { documents: Array.from(files) }
        : { relevent_notice: Array.from(files) }),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true); // 🟢 Start loader immediately
    setErrors({});
    setGeneralError(null);

    const newErrors: Record<string, string> = {};
    console.log("Form Data on Submit:", formData);

    // ✅ Required field validation
    const requiredFields = [
      "membership_number",
      "client_name",
      "CNIC",
      "passport_number",
      "address",
      "email",
      "contact_number",
      "next_of_kin",
      "agent_name",
      "discount",
      "status",
      "installment_plan",
    ];

    requiredFields.forEach((field) => {
      const value = (formData as any)[field];
      if (!value || String(value).trim() === "") {
        newErrors[field] = "This field is required.";
      }
    });

    // ✅ Ensure floor and apartment are selected
    if (!selectedFloor) newErrors.floor_id = "Please select a floor.";
    if (
      !formData.apartment_ids ||
      !Array.isArray(formData.apartment_ids) ||
      formData.apartment_ids.length === 0
    ) {
      newErrors.apartment_ids = "Please select at least one apartment.";
    }

    // ✅ Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      newErrors.email = "Please enter a valid email address.";
    }

    // ✅ If any validation fails, stop loader & display inline errors
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsLoading(false); // 🔴 stop loader on validation failure
      return;
    }

    try {
      // 🟣 Uploads — now includes Relevent Notice Documents
      const [clientImageUrl, documentUrls, releventNoticeUrls] =
        await Promise.all([
          formData.client_image
            ? uploadFile("client-images", formData.client_image)
            : Promise.resolve(null),

          formData.documents && formData.documents.length > 0
            ? uploadMultipleFiles("client-documents", formData.documents)
            : Promise.resolve([]),

          formData.relevent_notice && formData.relevent_notice.length > 0
            ? uploadMultipleFiles(
                "relevent-documents",
                formData.relevent_notice
              )
            : Promise.resolve([]),
        ]);

      // ✅ Prepare final data to send
      const dataToSend = {
        ...formData,
        apartments: selectedApartments.map((apt) => ({
          floor_id: apt.floor_id,
          apartment_number: apt.number,
        })), // 🆕 multiple apartments support
        // floor_id: selectedFloor,
        // apartment_number: selectedApartment,
        client_image: clientImageUrl,
        documents: documentUrls,
        relevent_notice: releventNoticeUrls,
      };

      const result = await createClient(dataToSend);

      if (result.success) {
        // 🧹 Reset form fields without reload
        setFormData({
          membership_number: "",
          client_name: "",
          CNIC: "",
          passport_number: "",
          address: "",
          email: "",
          contact_number: "",
          other_contact: "",
          next_of_kin: "",
          apartment_ids: "",
          discount: "0",
          amount_payable: "",
          agent_name: "",
          status: "Active",
          installment_plan: "Monthly Plan",
          notes: "",
          client_image: null,
          documents: [],
          relevent_notice: [],
        });
        setSelectedFloor("");
        setSelectedApartment("");
        setSelectedApartments([]);
        setErrors({});
        setGeneralError(null);

        const nextNumber = await getNextMembershipNumber();
        setFormData((prev: any) => ({
          ...prev,
          membership_number: nextNumber,
        }));

        setSuccessMessage("✅ Client created successfully!");

        if (onClientCreated) await onClientCreated();

        // 🕐 Close modal after short delay
        setTimeout(() => {
          onClose?.();
        }, 1000);
      } else {
        setGeneralError(result.error || "An unexpected error occurred.");
        console.error("Error form data:", dataToSend);
      }
    } catch (err: any) {
      console.error(err);
      setGeneralError("Something went wrong while creating the client.");
    } finally {
      setIsLoading(false); // 🔴 Stop loader in all cases
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 bg-white p-6 rounded-lg shadow max-h-[80vh] overflow-y-auto"
    >
      <div className="flex items-center justify-between border-b pb-3">
        <h3 className="text-2xl font-semibold text-[#98786d] flex items-center gap-2">
          <FaUserPlus className="text-[#98786d]" /> Create New Client
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 📸 Client Image Upload */}
        <div className="flex flex-col">
          <label className="text-sm font-medium text-[#98786d] mb-1">
            Client Image
          </label>
          <input
            type="file"
            accept="image/*"
            name="client_image"
            onChange={(e) => handleFileChange(e, "client_image")}
            className="border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-[#98786d]"
          />
        </div>

        {/* Membership Number */}
        <div className="flex flex-col">
          <label className="text-sm font-medium text-[#98786d] mb-1">
            Membership Number
          </label>
          <input
            type="text"
            name="membership_number"
            value={formData.membership_number}
            readOnly
            className="border border-gray-300 rounded-md p-2 bg-gray-100 text-gray-700 cursor-not-allowed"
          />
        </div>

        {/* Client Fields */}
        {[
          { label: "Client Name", name: "client_name" },
          { label: "CNIC", name: "CNIC" },
          { label: "Passport Number", name: "passport_number" },
          { label: "Email", name: "email" },
          { label: "Contact Number", name: "contact_number" },
          { label: "Other Contact Number", name: "other_contact" },
          { label: "Next of Kin", name: "next_of_kin" },
        ].map((field) => (
          <div key={field.name} className="flex flex-col">
            <label className="text-sm font-medium text-[#98786d] mb-1">
              {field.label}
            </label>

            <input
              type="text"
              name={field.name}
              value={formData[field.name] || ""}
              onChange={handleChange}
              className={`border rounded-md p-2 focus:ring-2 focus:ring-[#98786d] ${
                errors[field.name] ? "border-red-400" : "border-gray-300"
              }`}
            />
            {/* 🔴 Inline error display */}
            {errors[field.name] && (
              <span className="text-red-500 text-sm mb-1">
                ⚠ {errors[field.name]}
              </span>
            )}
          </div>
        ))}

        {/* 🏠 Address Field (Full Width) */}
        <div className="flex flex-col md:col-span-2">
          <label className="text-sm font-medium text-[#98786d] mb-1">
            Address
          </label>
          <input
            type="text"
            name="address"
            value={formData.address || ""}
            onChange={handleChange}
            className={
              "border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-[#98786d]"
            }
          />
          {errors.address && (
            <span className="text-red-500 text-sm mb-1">
              ⚠ {errors.address}
            </span>
          )}
        </div>

        {/* 📚 Documents Upload (Multiple) */}
        <div className="flex flex-col">
          <label className="text-sm font-medium text-[#98786d] mb-1">
            Documents
          </label>
          <input
            type="file"
            accept="image/*"
            name="documents"
            multiple
            onChange={(e) => handleFileChange(e, "documents")}
            className="border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-[#98786d]"
          />
        </div>

        {/* 📚 Relevent Notice Documents Upload (Multiple) */}
        <div className="flex flex-col">
          <label className="text-sm font-medium text-[#98786d] mb-1">
            Relevent Notice Documents
          </label>
          <input
            type="file"
            accept="image/*"
            name="relevent_notice"
            multiple
            onChange={(e) => handleFileChange(e, "relevent_notice")}
            className="border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-[#98786d]"
          />
        </div>

        {/* 🏢 Apartment Selection Section */}
        <div className="col-span-full bg-gray-50 p-4 rounded-lg border border-gray-200">
          <label className="block text-[#98786d] font-medium mb-2">
            Apartment Selection
          </label>

          {/* Dropdowns Row */}
          <div className="flex flex-col md:flex-row gap-3">
            {/* Floor Dropdown */}
            <div className="flex-1">
              <select
                value={selectedFloor}
                onChange={(e) => setSelectedFloor(e.target.value)}
                className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-[#98786d]"
              >
                <option value="">Select Floor</option>
                {floorIds.map((floor) => (
                  <option key={floor} value={floor}>
                    {floor.charAt(0).toUpperCase() + floor.slice(1)} Floor
                  </option>
                ))}
              </select>
              {errors.floor_id && (
                <span className="text-red-500 text-sm mt-1 block">
                  ⚠ {errors.floor_id}
                </span>
              )}
            </div>

            {/* Apartment Dropdown */}
            <div className="flex-1">
              <select
                value={selectedApartment}
                onChange={(e) => setSelectedApartment(e.target.value)}
                disabled={!selectedFloor}
                className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-[#98786d] disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">Select Apartment</option>
                {apartments.map((apt) => (
                  <option key={apt.id} value={apt.number}>
                    {`${apt.number} • ${apt.type} • ${apt.area} sq.ft`}
                  </option>
                ))}
              </select>
              {errors.apartment_ids && (
                <span className="text-red-500 text-sm mt-1 block">
                  ⚠ {errors.apartment_ids}
                </span>
              )}
            </div>

            {/* Add Apartment Button */}
            {/* <button
              type="button"
              onClick={() => {
                if (!selectedApartment || !selectedFloor) return;
                const apt = apartments.find(
                  (a) => a.number === selectedApartment
                );
                if (apt) {
                  setSelectedApartments((prev) => {
                    if (prev.find((p) => p.id === apt.id)) return prev; // avoid duplicates
                    return [...prev, apt];
                  });
                  setSelectedApartment("");
                }
              }}
              className="bg-[#98786d] text-white px-4 py-2 rounded-md hover:bg-[#7d645b] transition disabled:bg-gray-300 disabled:cursor-not-allowed"
              disabled={!selectedApartment}
            >
              Add
            </button> */}
          </div>

          {/* Selected Apartments List */}
          {selectedApartments.length > 0 && (
            <div className="mt-4 bg-white p-3 rounded-md border border-gray-200">
              <p className="text-sm font-medium text-[#98786d] mb-2">
                Selected Apartments:
              </p>
              <ul className="space-y-1">
                {selectedApartments.map((apt) => (
                  <li
                    key={apt.id}
                    className="flex justify-between items-center text-sm text-gray-700 border-b last:border-none pb-1"
                  >
                    <span>
                      <strong>{apt.number}</strong> • {apt.floor_id} •{" "}
                      {apt.type} • {apt.area} sq.ft
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedApartments((prev) =>
                          prev.filter((a) => a.id !== apt.id)
                        )
                      }
                      className="text-red-500 hover:text-red-700 text-xs ml-2"
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Floor Dropdown
        <div className="flex flex-col">
          <label className="text-sm font-medium text-[#98786d] mb-1">
            Floor
          </label>
          <select
            value={selectedFloor}
            onChange={(e) => setSelectedFloor(e.target.value)}
            className="border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-[#98786d]"
          >
            <option value="">Select Floor</option>
            {floorIds.map((floor) => (
              <option key={floor} value={floor}>
                {floor.charAt(0).toUpperCase() + floor.slice(1)} Floor
              </option>
            ))}
          </select>
          {errors.floor_id && (
            <span className="text-red-500 text-sm mb-1">
              ⚠ {errors.floor_id}
            </span>
          )}
        </div>

        // {/* Apartment Dropdown */}
        {/* <div className="flex flex-col">
          <label className="text-sm font-medium text-[#98786d] mb-1">
            Apartment
          </label>
          <select
            value={selectedApartment}
            onChange={(e) => setSelectedApartment(e.target.value)}
            disabled={!selectedFloor}
            className="border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-[#98786d] disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <option value="">Select Apartment</option>
            {apartments.map((apt) => (
              <option key={apt.id} value={apt.number}>
                {`${apt.number}  •  ${apt.type}  •  ${apt.area} (sq.ft)`}
              </option>
            ))}
          </select>
          {errors.apartment_id && (
            <span className="text-red-500 text-sm mb-1">
              ⚠ {errors.apartment_id}
            </span>
          )}
        </div> */}

        {/* Installment Plan Dropdown */}
        <div className="flex flex-col">
          <label className="text-sm font-medium text-[#98786d] mb-1">
            Installment Plan
          </label>
          <select
            name="installment_plan"
            value={formData.installment_plan || ""}
            onChange={handleChange}
            className="border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-[#98786d]"
          >
            <option value="Monthly Plan">Monthly Plan</option>
            <option value="Half-Yearly Plan">Half-Yearly Plan</option>
            <option value="Yearly Plan">Yearly Plan</option>
          </select>
          {errors.installment_plan && (
            <span className="text-red-500 text-sm mb-1">
              ⚠ {errors.installment_plan}
            </span>
          )}
        </div>

        {/* Discount */}
        <div className="flex flex-col">
          <label className="text-sm font-medium text-[#98786d] mb-1">
            Discount (%)
          </label>
          <input
            type="number"
            name="discount"
            value={formData.discount || "0"}
            onChange={handleChange}
            min="0"
            max="100"
            className="border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-[#98786d]"
          />
        </div>

        {/* Amount Payable */}
        <div className="flex flex-col">
          <label className="text-sm font-medium text-[#98786d] mb-1">
            Amount Payable
          </label>

          {/* Show the breakdown in the input (read-only) */}
          <input
            type="text"
            value={formData.amount_breakdown || ""}
            readOnly
            placeholder="0"
            className="border border-gray-300 rounded-md p-2 bg-gray-100 text-gray-800"
          />

          {/* Show total below */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
            <div className="text-sm text-gray-700 mt-1">
              <span className="font-semibold">Total:</span>{" "}
              {formData.amount_payable
                ? new Intl.NumberFormat("en-PK", {
                    style: "currency",
                    currency: "PKR",
                    maximumFractionDigits: 0,
                  }).format(formData.amount_payable)
                : "Rs. 0"}
            </div>
            <div className="text-xs text-gray-500 mt-1 italic">
              <p>(after {formData.discount}% discount)</p>
            </div>
          </div>
        </div>

        {/* <div className="flex flex-col">
          <label className="text-sm font-medium text-[#98786d] mb-1">
            Amount Payable
          </label>
          <input
            name="amount_payable"
            value={
              formData.amount_payable
                ? `Rs. ${Number(formData.amount_payable).toLocaleString(
                    "en-PK",
                    {
                      maximumFractionDigits: 0,
                    }
                  )}`
                : "Rs. 0"
            }
            readOnly
            className="border border-gray-300 rounded-md p-2 bg-gray-100 cursor-not-allowed text-gray-700"
          />
        </div> */}

        {/* Agent Name */}
        <div className="flex flex-col">
          <label className="text-sm font-medium text-[#98786d] mb-1">
            Agent Name
          </label>
          <input
            type="text"
            name="agent_name"
            value={formData.agent_name || ""}
            onChange={handleChange}
            className="border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-[#98786d]"
          />
          {errors.address && (
            <span className="text-red-500 text-sm mb-1">
              ⚠ {errors.address}
            </span>
          )}
        </div>

        {/* Status Dropdown */}
        <div className="flex flex-col">
          <label className="text-sm font-medium text-[#98786d] mb-1">
            Status
          </label>
          <select
            name="status"
            value={formData.status || "Active"}
            onChange={handleChange}
            className="border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-[#98786d]"
          >
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
          {errors.status && (
            <span className="text-red-500 text-sm mb-1">⚠ {errors.status}</span>
          )}
        </div>

        {/* Notes */}
        <div className="flex flex-col md:col-span-2">
          <label className="text-sm font-medium text-[#98786d] mb-1">
            Notes
          </label>
          <input
            type="text"
            name="notes"
            value={formData.notes || ""}
            onChange={handleChange}
            className="border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-[#98786d]"
          />
        </div>
      </div>

      <div className="md:col-span-2 flex flex-col items-center space-y-2 mt-4">
        {Object.keys(errors).length > 0 && (
          <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded mb-3 text-center w-full max-w-md">
            <p className="font-semibold">⚠ Please fix the errors above before submitting</p>
            <p className="text-sm mt-1">Scroll up to review {Object.keys(errors).length} field error{Object.keys(errors).length > 1 ? 's' : ''}</p>
          </div>
        )}

        {generalError && (
          <p className="text-red-500 text-sm mb-2 text-center">
            ⚠ {generalError}
          </p>
        )}

        {successMessage && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-2 rounded mb-3 text-center">
            {successMessage}
          </div>
        )}
        <button
          type="submit"
          disabled={isLoading}
          className={`bg-[#98786d] text-white px-6 py-2 rounded-md disabled:opacity-60 ${
            isLoading
              ? "opacity-70 cursor-not-allowed"
              : "hover:bg-[#7d645b] cursor-pointer"
          }`}
        >
          {isLoading ? (
            <div className="flex items-center justify-center gap-2">
              <svg
                className="animate-spin h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                ></path>
              </svg>
              <span>Saving...</span>
            </div>
          ) : (
            "Save Client"
          )}
        </button>
      </div>
    </form>
  );
}
