"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { updateClient } from "./clientFunctions";
import { FaUserEdit } from "react-icons/fa";
import { FaTimes } from "react-icons/fa";

interface EditClientSectionProps {
  client: any;
  onClose?: () => void;
  onClientUpdated?: (updatedClient: any) => void;
}

export default function EditClientSection({
  client,
  onClose,
  onClientUpdated,
}: EditClientSectionProps) {
  const [formData, setFormData] = useState<any>({
    membership_number: "",
    client_name: "",
    CNIC: "",
    address: "",
    email: "",
    contact_number: "",
    next_of_kin: "",
    apartment_id: "",
    apartment_number: "",
    installment_plan: "Monthly Plan",
    discount: "0",
    amount_payable: "",
    agent_name: "",
    status: "Active",
  });

  // floor / apartment related state
  const [floorIds, setFloorIds] = useState<string[]>([]);
  const [apartments, setApartments] = useState<any[]>([]);
  const [allApartments, setAllApartments] = useState<any[]>([]);
  const [selectedFloor, setSelectedFloor] = useState<string>("");
  const [selectedApartment, setSelectedApartment] = useState<string>("");
  const [basePrice, setBasePrice] = useState<number | null>(null);

  // validation & UI states
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Populate formData when client prop changes
  useEffect(() => {
    if (!client) return;

    setFormData((prev: any) => ({
      ...prev,
      membership_number: client.membership_number ?? "",
      client_name: client.client_name ?? "",
      CNIC: client.CNIC ?? "",
      address: client.address ?? "",
      email: client.email ?? "",
      contact_number: client.contact_number ?? "",
      next_of_kin: client.next_of_kin ?? "",
      apartment_id: client.apartment_id ?? "",
      apartment_number: client.apartment_number ?? "",
      installment_plan: client.installment_plan ?? "Monthly Plan",
      discount: client.discount ?? "0",
      amount_payable:
        client.amount_payable !== undefined && client.amount_payable !== null
          ? client.amount_payable
          : "",
      agent_name: client.agent_name ?? "",
      status: client.status ?? "Active",
    }));

    // If client has apartment_id, fetch that apartment to get floor & number & price
    (async () => {
      try {
        if (client.apartment_id) {
          const { data: aptRow, error: aptErr } = await supabase
            .from("apartments")
            .select("id, number, floor_id, price, type, area")
            .eq("id", client.apartment_id)
            .single();

          if (!aptErr && aptRow) {
            setSelectedFloor(aptRow.floor_id ?? "");
            setSelectedApartment(aptRow.number ?? "");
            setBasePrice(aptRow.price ?? null);
          }
        } else if (client.apartment_number && client.floor_id) {
          // fallback when apartment_id absent but floor & number present
          setSelectedFloor(client.floor_id);
          setSelectedApartment(client.apartment_number);
        }
      } catch (err) {
        // non-fatal
        console.error("Error fetching apartment for client:", err);
      }
    })();

    // reset messages / errors
    setErrors({});
    setGeneralError(null);
    setSuccessMessage(null);
  }, [client]);

  // Fetch floors (ordered third -> ninth)
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
                .map((apt: any) => apt.floor_id)
                .filter((id: any) => id !== null && id !== undefined)
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

  // Fetch apartments when selectedFloor changes (and sort by numeric part of number like Unit-01)
  useEffect(() => {
    const fetchApartments = async () => {
      if (!selectedFloor) {
        setApartments([]);
        return;
      }
      try {
        const { data, error } = await supabase
          .from("apartments")
          .select("id, number, type, area, price, floor_id")
          .eq("floor_id", selectedFloor);

        if (error) throw error;
        if (data) {
          const sorted = [...data].sort((a: any, b: any) => {
            const numA =
              parseInt(String(a.number || "").replace(/[^0-9]/g, ""), 10) || 0;
            const numB =
              parseInt(String(b.number || "").replace(/[^0-9]/g, ""), 10) || 0;
            return numA - numB;
          });
          setApartments(sorted);

          // if we already have selectedApartment and it's in this floor, keep it; otherwise clear selection
          if (selectedApartment) {
            const found = sorted.find(
              (s: any) => s.number === selectedApartment
            );
            if (!found) setSelectedApartment("");
          }
        } else {
          setApartments([]);
        }
      } catch (err: any) {
        console.error("fetchApartments error:", err?.message ?? err);
        setApartments([]);
      }
    };
    fetchApartments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFloor]);

  // Update apartment_id and basePrice when selectedApartment changes
  const [floorCache, setFloorCache] = useState<{ [key: string]: any[] }>({});

  useEffect(() => {
    const fetchApartments = async () => {
      if (!selectedFloor) {
        setApartments([]);
        return;
      }

      // ✅ Check if cached
      if (floorCache[selectedFloor]) {
        setApartments(floorCache[selectedFloor]);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("apartments")
          .select("id, number, type, area, price, floor_id")
          .eq("floor_id", selectedFloor);

        if (error) throw error;

        const sorted = [...(data || [])].sort((a, b) => {
          const numA =
            parseInt(String(a.number || "").replace(/[^0-9]/g, ""), 10) || 0;
          const numB =
            parseInt(String(b.number || "").replace(/[^0-9]/g, ""), 10) || 0;
          return numA - numB;
        });

        // ✅ Store in cache
        setFloorCache((prev) => ({ ...prev, [selectedFloor]: sorted }));
        setApartments(sorted);
      } catch (err) {
        console.error("fetchApartments error:", err);
        setApartments([]);
      }
    };
    fetchApartments();
  }, [selectedFloor]);

  // Calculate amount_payable whenever basePrice or discount changes
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [basePrice, formData.discount]);

  // -- handlers --

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    // discount: sanitize + clamp 0..100
    if (name === "discount") {
      const numericValue = String(value).replace(/[^\d.]/g, "");
      let num = parseFloat(numericValue);
      if (isNaN(num)) num = 0;
      if (num < 0) num = 0;
      if (num > 100) num = 100;
      setFormData((prev: any) => ({ ...prev, discount: String(num) }));
      setErrors((prev) => ({ ...prev, discount: "" }));
      return;
    }

    setFormData((prev: any) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  // Validation (similar to create)
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    const requiredFields = [
      "client_name",
      "CNIC",
      "address",
      "email",
      "contact_number",
      "next_of_kin",
      "installment_plan",
      "amount_payable",
      "agent_name",
      "status",
    ];

    requiredFields.forEach((field) => {
      const val = (formData as any)[field];
      if (
        val === undefined ||
        val === null ||
        (typeof val === "string" && val.trim() === "")
      ) {
        newErrors[field] = "This field is required.";
      }
    });

    if (!selectedFloor) newErrors.floor_id = "Please select a floor.";
    if (!selectedApartment)
      newErrors.apartment_number = "Please select an apartment.";

    // email validation
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const sanitizeForUpdate = (obj: any) => {
    const clean = { ...obj };
    delete clean.apartment_info;
    delete clean.apartments;
    // also remove derived UI-only keys if present
    delete clean.floor_id;
    delete clean.apartment_number;
    return clean;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);
    setSuccessMessage(null);

    if (!client?.membership_number) {
      setGeneralError("Missing client identifier.");
      return;
    }

    const isValid = validateForm();
    if (!isValid) return;

    setLoading(true);
    try {
      // Ensure we have apartment_id - prefer in-memory apartments list
      let apartmentIdToSave = formData.apartment_id;
      if (!apartmentIdToSave) {
        // try to find in loaded apartments
        const apt = apartments.find(
          (a) => a.number === selectedApartment && a.floor_id === selectedFloor
        );
        if (apt) apartmentIdToSave = apt.id;
        else {
          // fallback to querying DB
          const { data: aptRow, error: aptErr } = await supabase
            .from("apartments")
            .select("id")
            .eq("floor_id", selectedFloor)
            .eq("number", selectedApartment)
            .single();
          if (aptErr || !aptRow) {
            setGeneralError("Apartment not found.");
            setLoading(false);
            return;
          }
          apartmentIdToSave = aptRow.id;
        }
      }

      // prepare updatedData object
      const updatedData: any = {
        ...formData,
        apartment_id: apartmentIdToSave,
        updated_at: new Date().toISOString(),
      };

      // sanitize UI-only fields
      const clean = sanitizeForUpdate(updatedData);

      const result = await updateClient(client.membership_number, clean);

      if (result.success) {
        // pick the returned row if available
        const updatedClient = result.data?.[0] ?? {
          ...clean,
          membership_number: client.membership_number,
        };
        setSuccessMessage("✅ Client updated successfully!");
        onClientUpdated && onClientUpdated(updatedClient);

        // keep success message for a short time then close
        setTimeout(() => {
          setSuccessMessage(null);
          onClose && onClose();
        }, 1500);
      } else {
        setGeneralError(result.error || "Failed to update client.");
      }
    } catch (err: any) {
      console.error("updateClient error:", err);
      setGeneralError(err?.message || "Unexpected error while updating.");
    } finally {
      setLoading(false);
    }
  };

  // Render
  if (!client) {
    return (
      <div className="p-6">
        <p className="text-sm text-gray-600">No client selected.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-white p-6 rounded-lg shadow max-h-[80vh] overflow-y-auto">
      {/* Header */}
      <div className="flex items-start justify-between border-b pb-3">
        <h2 className="text-2xl font-semibold text-[#98786d] flex items-center gap-2">
          <FaUserEdit className="text-[#98786d]" /> Edit Client
        </h2>
      </div>

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        {/* Membership (read only) */}
        <div>
          <label className="text-sm font-medium text-[#98786d] mb-1 block">
            Membership #
          </label>
          <input
            name="membership_number"
            readOnly
            value={formData.membership_number ?? ""}
            className="border border-gray-300 rounded-md p-2 bg-gray-100 cursor-not-allowed w-full"
          />
        </div>

        {/* Client Name */}
        <div>
          <label className="text-sm font-medium text-[#98786d] mb-1 block">
            Client Name
          </label>
          <input
            name="client_name"
            value={formData.client_name ?? ""}
            onChange={handleChange}
            className={`border rounded-md p-2 w-full ${
              errors.client_name ? "border-red-400" : "border-gray-300"
            }`}
          />
          {errors.client_name && (
            <p className="text-red-600 text-xs mt-1">{errors.client_name}</p>
          )}
        </div>

        {/* CNIC */}
        <div>
          <label className="text-sm font-medium text-[#98786d] mb-1 block">
            CNIC
          </label>
          <input
            name="CNIC"
            value={formData.CNIC ?? ""}
            onChange={handleChange}
            className={`border rounded-md p-2 w-full ${
              errors.CNIC ? "border-red-400" : "border-gray-300"
            }`}
          />
          {errors.CNIC && (
            <p className="text-red-600 text-xs mt-1">{errors.CNIC}</p>
          )}
        </div>

        {/* Email */}
        <div>
          <label className="text-sm font-medium text-[#98786d] mb-1 block">
            Email
          </label>
          <input
            name="email"
            value={formData.email ?? ""}
            onChange={handleChange}
            className={`border rounded-md p-2 w-full ${
              errors.email ? "border-red-400" : "border-gray-300"
            }`}
          />
          {errors.email && (
            <p className="text-red-600 text-xs mt-1">{errors.email}</p>
          )}
        </div>

        {/* Contact */}
        <div>
          <label className="text-sm font-medium text-[#98786d] mb-1 block">
            Contact Number
          </label>
          <input
            name="contact_number"
            value={formData.contact_number ?? ""}
            onChange={handleChange}
            className={`border rounded-md p-2 w-full ${
              errors.contact_number ? "border-red-400" : "border-gray-300"
            }`}
          />
          {errors.contact_number && (
            <p className="text-red-600 text-xs mt-1">{errors.contact_number}</p>
          )}
        </div>

        {/* Next of Kin */}
        <div>
          <label className="text-sm font-medium text-[#98786d] mb-1 block">
            Next of Kin
          </label>
          <input
            name="next_of_kin"
            value={formData.next_of_kin ?? ""}
            onChange={handleChange}
            className={`border rounded-md p-2 w-full ${
              errors.next_of_kin ? "border-red-400" : "border-gray-300"
            }`}
          />
          {errors.next_of_kin && (
            <p className="text-red-600 text-xs mt-1">{errors.next_of_kin}</p>
          )}
        </div>

        {/* Address (span two columns) */}
        <div className="md:col-span-2">
          <label className="text-sm font-medium text-[#98786d] mb-1 block">
            Address
          </label>
          <input
            name="address"
            value={formData.address ?? ""}
            onChange={handleChange}
            className={`border rounded-md p-2 w-full ${
              errors.address ? "border-red-400" : "border-gray-300"
            }`}
          />
          {errors.address && (
            <p className="text-red-600 text-xs mt-1">{errors.address}</p>
          )}
        </div>

        {/* Floor dropdown */}
        <div>
          <label className="text-sm font-medium text-[#98786d] mb-1 block">
            Floor
          </label>
          <select
            value={selectedFloor}
            onChange={(e) => setSelectedFloor(e.target.value)}
            className={`border rounded-md p-2 w-full ${
              errors.floor_id ? "border-red-400" : "border-gray-300"
            }`}
          >
            <option value="">Select Floor</option>
            {floorIds.map((floor) => (
              <option key={floor} value={floor}>
                {floor.charAt(0).toUpperCase() + floor.slice(1)} Floor
              </option>
            ))}
          </select>
          {errors.floor_id && (
            <p className="text-red-600 text-xs mt-1">{errors.floor_id}</p>
          )}
        </div>

        {/* Apartment dropdown */}
        <div>
          <label className="text-sm font-medium text-[#98786d] mb-1 block">
            Apartment
          </label>
          <select
            value={selectedApartment}
            onChange={(e) => setSelectedApartment(e.target.value)}
            disabled={!selectedFloor}
            className={`border rounded-md p-2 w-full ${
              !selectedFloor ? "bg-gray-100 cursor-not-allowed" : ""
            } ${
              errors.apartment_number ? "border-red-400" : "border-gray-300"
            }`}
          >
            <option value="">Select Apartment</option>
            {apartments.map((apt) => (
              <option key={apt.id} value={apt.number}>
                {`${apt.number} • ${apt.type} • ${apt.area} sq.ft`}
              </option>
            ))}
          </select>
          {errors.apartment_number && (
            <p className="text-red-600 text-xs mt-1">
              {errors.apartment_number}
            </p>
          )}
        </div>

        {/* Installment plan */}
        <div>
          <label className="text-sm font-medium text-[#98786d] mb-1 block">
            Installment Plan
          </label>
          <select
            name="installment_plan"
            value={formData.installment_plan ?? "Monthly Plan"}
            onChange={handleChange}
            className={`border rounded-md p-2 w-full ${
              errors.installment_plan ? "border-red-400" : "border-gray-300"
            }`}
          >
            <option value="Monthly Plan">Monthly Plan</option>
            <option value="Half-Yearly Plan">Half-Yearly Plan</option>
            <option value="Yearly Plan">Yearly Plan</option>
          </select>
          {errors.installment_plan && (
            <p className="text-red-600 text-xs mt-1">
              {errors.installment_plan}
            </p>
          )}
        </div>

        {/* Discount */}
        <div>
          <label className="text-sm font-medium text-[#98786d] mb-1 block">
            Discount (%)
          </label>
          <input
            name="discount"
            type="number"
            min={0}
            max={100}
            value={formData.discount ?? "0"}
            onChange={handleChange}
            className={`border rounded-md p-2 w-full ${
              errors.discount ? "border-red-400" : "border-gray-300"
            }`}
          />
          {errors.discount && (
            <p className="text-red-600 text-xs mt-1">{errors.discount}</p>
          )}
        </div>

        {/* Amount Payable */}
        <div>
          <label className="text-sm font-medium text-[#98786d] mb-1 block">
            Amount Payable
          </label>
          <input
            name="amount_payable"
            readOnly
            value={
              formData.amount_payable
                ? `Rs. ${Number(formData.amount_payable).toLocaleString(
                    "en-PK"
                  )}`
                : "Rs. 0"
            }
            className="border border-gray-300 rounded-md p-2 bg-gray-100 cursor-not-allowed w-full text-gray-700"
          />
          {errors.amount_payable && (
            <p className="text-red-600 text-xs mt-1">{errors.amount_payable}</p>
          )}
        </div>

        {/* Agent */}
        <div>
          <label className="text-sm font-medium text-[#98786d] mb-1 block">
            Agent Name
          </label>
          <input
            name="agent_name"
            value={formData.agent_name ?? ""}
            onChange={handleChange}
            className={`border rounded-md p-2 w-full ${
              errors.agent_name ? "border-red-400" : "border-gray-300"
            }`}
          />
          {errors.agent_name && (
            <p className="text-red-600 text-xs mt-1">{errors.agent_name}</p>
          )}
        </div>

        {/* Status */}
        <div>
          <label className="text-sm font-medium text-[#98786d] mb-1 block">
            Status
          </label>
          <select
            name="status"
            value={formData.status ?? "Active"}
            onChange={handleChange}
            className={`border rounded-md p-2 w-full ${
              errors.status ? "border-red-400" : "border-gray-300"
            }`}
          >
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
          {errors.status && (
            <p className="text-red-600 text-xs mt-1">{errors.status}</p>
          )}
        </div>

        {/* Submit + messages (span full width) */}
        <div className="md:col-span-2 flex flex-col items-center space-y-2 mt-4">
          {successMessage && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-2 rounded mb-3 text-center">
              {successMessage}
            </div>
          )}
          {generalError && (
            <p className="text-red-500 text-sm mb-2 text-center">
              ⚠ {generalError}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="bg-[#98786d] text-white px-6 py-2 rounded-md hover:bg-[#7d645b] disabled:opacity-60"
          >
            {loading ? "Updating..." : "Update Client"}
          </button>
        </div>
      </form>
    </div>
  );
}
