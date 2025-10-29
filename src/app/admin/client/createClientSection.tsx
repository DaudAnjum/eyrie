"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { createClient, getNextMembershipNumber } from "./clientFunctions";
import { FaUserPlus } from "react-icons/fa";

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
    address: "",
    email: "",
    contact_number: "",
    next_of_kin: "",
    apartment_id: "",
    installment_plan: "Monthly Plan",
    discount: "0",
    amount_payable: "",
    agent_name: "",
    status: "Active",
  });

  const [floorIds, setFloorIds] = useState<string[]>([]);
  const [apartments, setApartments] = useState<any[]>([]);
  const [selectedFloor, setSelectedFloor] = useState("");
  const [selectedApartment, setSelectedApartment] = useState("");
  const [basePrice, setBasePrice] = useState<number | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // 🧩 Fetch floors in order
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
                .filter((id): id is string => id !== null)
            )
          );
          const desiredOrder = [
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
        .eq("floor_id", selectedFloor);
      if (error) throw error;
      setApartments(data || []);
    };
    fetchApartments();
  }, [selectedFloor]);

  // 🧮 Fetch base price when apartment changes
  useEffect(() => {
    const selectedApt = apartments.find((a) => a.number === selectedApartment);
    if (selectedApt) {
      setFormData((prev: any) => ({
        ...prev,
        apartment_id: selectedApt.id,
      }));
      setBasePrice(selectedApt.price);
    }
  }, [selectedApartment]);

  // 🧮 Calculate amount payable (discount logic)
  useEffect(() => {
    const discountValue =
      formData.discount && !isNaN(Number(formData.discount))
        ? Number(formData.discount)
        : 0;
    if (basePrice != null) {
      const finalPrice = basePrice - (basePrice * discountValue) / 100;
      setFormData((prev: any) => ({
        ...prev,
        amount_payable: Math.round(finalPrice),
      }));
    }
  }, [basePrice, formData.discount]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setErrors({});
    setGeneralError(null);

    const newErrors: Record<string, string> = {};

    // ✅ Required field validation
    const requiredFields = [
      "membership_number",
      "client_name",
      "CNIC",
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
    if (!selectedApartment)
      newErrors.apartment_id = "Please select an apartment.";

    // ✅ Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      newErrors.email = "Please enter a valid email address.";
    }

    // ✅ If any validation fails, display inline errors
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // ✅ Prepare final data to send
    const dataToSend = {
      ...formData,
      floor_id: selectedFloor,
      apartment_number: selectedApartment,
    };

    try {
      const result = await createClient(dataToSend);

      if (result.success) {
        // 🧹 Reset form fields without reload
        setFormData({
          membership_number: "",
          client_name: "",
          CNIC: "",
          address: "",
          email: "",
          contact_number: "",
          next_of_kin: "",
          apartment_id: "",
          discount: "0",
          amount_payable: "",
          agent_name: "",
          status: "Active",
          installment_plan: "Monthly Plan",
        });
        setSelectedFloor("");
        setSelectedApartment("");
        setErrors({});
        setGeneralError(null);

        // 🧩 Optionally refresh the next membership number (if you generate them)
        const nextNumber = await getNextMembershipNumber();
        setFormData((prev: any) => ({
          ...prev,
          membership_number: nextNumber,
        }));

        // 🕒 Success message
        setSuccessMessage("✅ Client created successfully!");

        if (onClientCreated) await onClientCreated();

        // 🕐 Close modal after short delay
        setTimeout(() => {
          onClose?.();
        }, 1500);
      } else {
        setGeneralError(result.error || "An unexpected error occurred.");
        console.error("Error form data:", dataToSend);
      }
    } catch (err: any) {
      console.error(err);
      setGeneralError("Something went wrong while creating the client.");
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
          { label: "Email", name: "email" },
          { label: "Contact Number", name: "contact_number" },
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
            className="border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-[#98786d]"
          />
        </div>

        {/* Floor Dropdown */}
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

        {/* Apartment Dropdown */}
        <div className="flex flex-col">
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
        </div>

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
        </div>

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
      </div>

      <div className="md:col-span-2 flex flex-col items-center space-y-2 mt-4">
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
          className="mt-4 bg-[#98786d] text-white px-4 py-2 rounded-md hover:bg-[#7d645b] transition"
        >
          Save Client
        </button>
      </div>
    </form>
  );
}
