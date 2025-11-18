"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { updateClient, getClientApartments } from "./clientFunctions";
import { FaUserEdit } from "react-icons/fa";
import { uploadFile, uploadMultipleFiles } from "./clientFunctions";

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
    passport_number: "",
    address: "",
    email: "",
    contact_number: "",
    other_contact: "",
    next_of_kin: "",
    apartment_ids: [] as string[],
    apartment_number: "",
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
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

  // 🆕 Track original apartments and current selection
  const [originalApartments, setOriginalApartments] = useState<any[]>([]);
  const [currentApartmentIds, setCurrentApartmentIds] = useState<string[]>([]);

  // Populate formData when client prop changes
  useEffect(() => {
    if (!client) return;

    setFormData((prev: any) => ({
      ...prev,
      membership_number: client.membership_number ?? "",
      client_name: client.client_name ?? "",
      CNIC: client.CNIC ?? "",
      passport_number: client.passport_number ?? "",
      address: client.address ?? "",
      email: client.email ?? "",
      contact_number: client.contact_number ?? "",
      other_contact: client.other_contact ?? "",
      next_of_kin: client.next_of_kin ?? "",
      installment_plan: client.installment_plan ?? "Monthly Plan",
      discount: client.discount ?? "0",
      amount_payable:
        client.amount_payable !== undefined && client.amount_payable !== null
          ? client.amount_payable
          : "",
      agent_name: client.agent_name ?? "",
      status: client.status ?? "Active",
      client_image: client.client_image ?? null,
      documents: client.documents ?? [],
      relevent_notice: client.relevent_notice ?? [],
      notes: client.notes ?? "",
    }));

    // 🆕 Fetch client apartments from intermediate table
    (async () => {
      try {
        const { data: apartmentsData } = await getClientApartments(client.membership_number);

        if (apartmentsData && apartmentsData.length > 0) {
          setOriginalApartments(apartmentsData);
          setCurrentApartmentIds(apartmentsData.map((apt: any) => apt.id));
        } else {
          setOriginalApartments([]);
          setCurrentApartmentIds([]);
        }
      } catch (err) {
        console.error("Error fetching client apartments:", err);
        setOriginalApartments([]);
        setCurrentApartmentIds([]);
      }
    })();

    // reset messages / errors
    setErrors({});
    setGeneralError(null);
    setSuccessMessage(null);
    setHasAttemptedSubmit(false);
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
                .filter(
                  (id: any) => id !== null && id.toLowerCase() !== "basement"
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

  // Fetch apartments when selectedFloor changes - only show available apartments
  useEffect(() => {
    const fetchApartments = async () => {
      if (!selectedFloor) {
        setApartments([]);
        return;
      }
      try {
        const { data, error } = await supabase
          .from("apartments")
          .select("id, number, type, area, price, floor_id, status")
          .eq("floor_id", selectedFloor)
          .eq("status", "available"); // 🆕 Only fetch available apartments

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
  }, [selectedFloor]);

  // 🧮 Build readable amount display from existing apartments (when editing)
  useEffect(() => {
    const updateAmounts = async () => {
      if (!currentApartmentIds || currentApartmentIds.length === 0) {
        setFormData((prev: any) => ({
          ...prev,
          amount_payable_display: "",
          amount_payable: 0,
        }));
        return;
      }

      try {
        // 🏢 Fetch prices of all apartments for this client
        const { data, error } = await supabase
          .from("apartments")
          .select("id, price")
          .in("id", currentApartmentIds);

        if (error) throw error;

        // 🧮 Step 1: Calculate total before discount
        const totalBase = data.reduce((sum, apt) => sum + (apt.price || 0), 0);

        // 🧮 Step 2: Apply discount to total
        const discountValue =
          formData.discount && !isNaN(Number(formData.discount))
            ? Number(formData.discount)
            : 0;
        const discountedTotal = totalBase - (totalBase * discountValue) / 100;

        // 🧩 Step 3: Build display string (newest apartment first)
        const reversed = [...data].reverse();
        const amountDisplay = reversed
          .map((apt) => `${apt.price?.toLocaleString("en-PK") || "0"}`)
          .join(" + ");

        // 🧩 Step 4: Update form state
        setFormData((prev: any) => ({
          ...prev,
          amount_payable_display: amountDisplay,
          amount_payable: Math.round(discountedTotal),
        }));
      } catch (err) {
        console.error("❌ Error updating amount payable:", err);
      }
    };

    updateAmounts();
  }, [currentApartmentIds, formData.discount]);

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
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [basePrice, formData.discount]);

  // debug watcher - safe top-level hook to inspect changes to relevent_notice (remove in prod)
  useEffect(() => {
    console.log("📸 formData.relevent_notice:", formData.relevent_notice);
    console.log("📸 formData.client_image:", formData.client_image);
    console.log("📸 formData.documents:", formData.documents);
  });

  // -- handlers --

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    // Skip if the input is a file input (those go to handleFileChange)
    if (e.target.type === "file") return;

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

    // 🆕 Remove floor/apartment validation - apartments are managed separately

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

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: "client_image" | "documents" | "relevent_notice"
  ) => {
    const files = e.target.files;
    if (!files) return;

    if (field === "client_image") {
      // single file — overwrite
      setFormData((prev: any) => ({
        ...prev,
        client_image: files[0],
      }));
    } else if (field === "documents") {
      // multiple — append new files
      setFormData((prev: any) => {
        const existingDocs = Array.isArray(prev.documents)
          ? prev.documents
          : [];
        return {
          ...prev,
          documents: [...existingDocs, ...Array.from(files)],
        };
      });
    } else if (field === "relevent_notice") {
      // 🟣 handle Relevent Notice Documents (append mode)
      setFormData((prev: any) => {
        const existingNotices = Array.isArray(prev.relevent_notice)
          ? prev.relevent_notice
          : [];
        return {
          ...prev,
          relevent_notice: [...existingNotices, ...Array.from(files)],
        };
      });
    }
  };

  const handleRemoveDocument = (index: number) => {
    setFormData((prev: any) => {
      const updatedDocs = Array.isArray(prev.documents)
        ? [...prev.documents]
        : [];
      updatedDocs.splice(index, 1); // remove clicked document
      return { ...prev, documents: updatedDocs };
    });
  };

  const handleRemoveReleventNotice = (index: number) => {
    setFormData((prev: any) => {
      const updatedNotices = Array.isArray(prev.relevent_notice)
        ? [...prev.relevent_notice]
        : [];
      updatedNotices.splice(index, 1); // remove clicked file or URL
      return { ...prev, relevent_notice: updatedNotices };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);
    setSuccessMessage(null);
    setHasAttemptedSubmit(true);

    if (!client?.membership_number) {
      setGeneralError("Missing client identifier.");
      return;
    }

    const isValid = validateForm();
    if (!isValid) return;

    setLoading(true);
    try {
      // 🆕 Calculate apartment changes
      const originalIds = originalApartments.map((apt) => apt.id);
      const currentIds = currentApartmentIds;

      const apartmentsToAdd = currentIds.filter((id) => !originalIds.includes(id));
      const apartmentsToRemove = originalIds.filter((id) => !currentIds.includes(id));

      // Resolve apartmentsToAdd to {floor_id, apartment_number} format
      const apartmentsToAddResolved: Array<{ floor_id: string; apartment_number: string }> = [];

      for (const aptId of apartmentsToAdd) {
        const { data: apt, error } = await supabase
          .from("apartments")
          .select("floor_id, number")
          .eq("id", aptId)
          .single();

        if (apt && !error && apt.floor_id && apt.number) {
          apartmentsToAddResolved.push({
            floor_id: apt.floor_id,
            apartment_number: apt.number,
          });
        }
      }

      // 🟢 Handle file uploads before preparing updatedData
      let clientImageUrl = formData.client_image;
      let documentUrls: string[] = [];
      let updatedReleventNoticeUrls: string[] = [];

      // 🧩 1️⃣ Upload new client image if changed
      if (formData.client_image instanceof File) {
        clientImageUrl = await uploadFile(
          "client-images",
          formData.client_image
        );
      }

      // 🧩 2️⃣ Handle documents — merge existing URLs with new uploads
      let existingUrls: string[] = [];
      let newFiles: File[] = [];

      if (Array.isArray(formData.documents)) {
        // separate old URLs and new Files
        existingUrls = formData.documents.filter(
          (item: any) => typeof item === "string"
        );
        newFiles = formData.documents.filter(
          (item: any) => item instanceof File
        );

        // upload new files to Supabase (if any)
        if (newFiles.length > 0) {
          const uploaded = await uploadMultipleFiles(
            "client-documents",
            newFiles
          );
          documentUrls = [...existingUrls, ...uploaded]; // ✅ merge old + new
        } else {
          documentUrls = existingUrls; // no new files
        }
      } else {
        documentUrls = [];
      }

      // 🧩 3️⃣ Handle Relevent Notice Documents — same pattern
      if (Array.isArray(formData.relevent_notice)) {
        const existingNotices = formData.relevent_notice.filter(
          (item: any) => typeof item === "string"
        );
        const newNoticeFiles = formData.relevent_notice.filter(
          (item: any) => item instanceof File
        );

        if (newNoticeFiles.length > 0) {
          const uploadedNotices = await uploadMultipleFiles(
            "relevent-documents",
            newNoticeFiles
          );
          updatedReleventNoticeUrls = [...existingNotices, ...uploadedNotices]; // 🟢 merge old + new
        } else {
          updatedReleventNoticeUrls = existingNotices;
        }
      } else {
        updatedReleventNoticeUrls = [];
      }

      // 🧩 4️⃣ Prepare final data to send
      const { amount_payable_display, apartment_ids, ...restFormData } = formData;

      const updatedData: any = {
        ...restFormData,
        client_image: clientImageUrl,
        documents: documentUrls,
        relevent_notice: updatedReleventNoticeUrls,
        updated_at: new Date().toISOString(),
      };

      // sanitize UI-only fields if needed
      const clean = sanitizeForUpdate(updatedData);

      console.log("Updating client with data:", clean);
      console.log("Apartment changes:", {
        apartmentsToAdd: apartmentsToAddResolved,
        apartmentIdsToRemove: apartmentsToRemove,
      });

      // 🆕 Call updateClient with apartment changes
      const result = await updateClient(
        client.membership_number,
        clean,
        {
          apartmentsToAdd: apartmentsToAddResolved,
          apartmentIdsToRemove: apartmentsToRemove,
        }
      );

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

  console.log(
    "typeof formData.relevent_notice:",
    typeof formData.relevent_notice
  );
  console.log("isArray:", Array.isArray(formData.relevent_notice));
  console.log("value:", formData.relevent_notice);

  console.log("typeof formData.documents:", typeof formData.documents);
  console.log("isArray:", Array.isArray(formData.documents));
  console.log("value:", formData.documents);

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
        {/* 🖼️ Client Image */}
        <div>
          <label className="text-sm font-medium text-[#98786d] mb-1 block">
            Client Image
          </label>

          <div className="flex items-center gap-3">
            {/* 🟣 Styled Upload Button */}
            <label className="cursor-pointer bg-[#98786d] text-white text-sm px-3 py-1 rounded-md hover:bg-[#7d645b] w-fit">
              Upload New
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange(e, "client_image")}
                className="hidden"
              />
            </label>

            {/* 🟤 preview */}
            {formData.client_image &&
              typeof formData.client_image === "string" && (
                <img
                  src={formData.client_image}
                  alt="Client"
                  className="w-12 h-12 object-cover rounded-md border mt-2"
                />
              )}
          </div>
        </div>

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

        {/* Passport number */}
        <div>
          <label className="text-sm font-medium text-[#98786d] mb-1 block">
            Passport Number
          </label>
          <input
            name="passport_number"
            type="text"
            value={formData.passport_number ?? ""}
            onChange={handleChange}
            className={`border rounded-md p-2 w-full ${
              errors.passport_number ? "border-red-400" : "border-gray-300"
            }`}
          />
          {errors.passport_number && (
            <p className="text-red-600 text-xs mt-1">
              {errors.passport_number}
            </p>
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

        {/* Other Contact */}
        <div>
          <label className="text-sm font-medium text-[#98786d] mb-1 block">
            Other Contact Number
          </label>
          <input
            name="other_contact"
            value={formData.other_contact ?? ""}
            onChange={handleChange}
            className={`border rounded-md p-2 w-full ${
              errors.other_contact ? "border-red-400" : "border-gray-300"
            }`}
          />
          {errors.other_contact && (
            <p className="text-red-600 text-xs mt-1">{errors.other_contact}</p>
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

        {/* 📄 Documents */}
        <div>
          <label className="text-sm font-medium text-[#98786d] mb-1 block">
            Documents
          </label>

          {/* 🟣 Upload new documents */}
          <div className="flex items-center gap-3">
            <label className="cursor-pointer bg-[#98786d] text-white text-sm px-3 py-1 rounded-md hover:bg-[#7d645b] w-fit">
              Upload New
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => handleFileChange(e, "documents")}
                className="hidden"
              />
            </label>

            {/* 🟢 Show total number of docs */}
            <span className="text-gray-600 text-sm">
              {Array.isArray(formData.documents) &&
              formData.documents.length > 0
                ? `${formData.documents.length} ${
                    formData.documents.length === 1 ? "image" : "images"
                  }`
                : "No images"}
            </span>
          </div>

          {/* 🧾 Document list with name + delete button + upload date */}
          <div className="mt-3 flex flex-col gap-2">
            {Array.isArray(formData.documents) &&
              formData.documents
                .slice()
                .reverse()
                .map((item: any, i: number) => {
                  // 🧠 Figure out filename
                  let fileName = "";
                  if (typeof item === "string") {
                    const parts = item.split("/");
                    const rawName = decodeURIComponent(parts[parts.length - 1]);
                    fileName = rawName.replace(/^\d+-/, "");
                  } else if (item instanceof File) {
                    fileName = item.name;
                  } else {
                    fileName = "document";
                  }

                  // 🕒 Try to extract timestamp from filename
                  let addedDate = "";
                  if (typeof item === "string") {
                    const match = item.match(/\/(\d+)-/);
                    if (match && match[1]) {
                      const ts = parseInt(match[1]);
                      if (!isNaN(ts)) {
                        addedDate = new Date(ts).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        });
                      }
                    }
                  } else if (item instanceof File) {
                    addedDate = new Date().toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    });
                  }

                  return (
                    <div
                      key={i}
                      className="flex items-center justify-between bg-gray-50 border rounded-md px-2 py-1"
                    >
                      {/* File link or label */}
                      {typeof item === "string" ? (
                        <a
                          href={item}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#98786d] underline text-sm truncate max-w-[180px]"
                          title={fileName}
                        >
                          View {fileName}
                        </a>
                      ) : (
                        <span
                          className="text-sm text-gray-700 truncate max-w-[180px]"
                          title={fileName}
                        >
                          View {fileName}
                        </span>
                      )}

                      {/* Date + Delete */}
                      <div className="flex items-center gap-3">
                        {addedDate && (
                          <span className="text-xs text-gray-500">
                            {addedDate}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() =>
                            handleRemoveDocument(
                              (formData.documents?.length || 0) - 1 - i
                            )
                          }
                          className="text-red-500 hover:text-red-700 text-lg leading-none"
                          title="Remove document"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  );
                })}
          </div>
        </div>

        {/* 📄 Relevent Notice Documents Upload (Multiple) */}
        <div>
          <label className="text-sm font-medium text-[#98786d] mb-1 block">
            Relevent Notice Documents
          </label>

          {/* 🟣 Upload new documents */}
          <div className="flex items-center gap-3">
            <label className="cursor-pointer bg-[#98786d] text-white text-sm px-3 py-1 rounded-md hover:bg-[#7d645b] w-fit">
              Upload New
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => handleFileChange(e, "relevent_notice")}
                className="hidden"
              />
            </label>

            {/* 🟢 Show total number of docs */}
            <span className="text-gray-600 text-sm">
              {Array.isArray(formData.relevent_notice) &&
              formData.relevent_notice.length > 0
                ? `${formData.relevent_notice.length} ${
                    formData.relevent_notice.length === 1 ? "image" : "images"
                  }`
                : "No images"}
            </span>
          </div>

          {/* 🧾 Document list with name + delete button */}
          <div className="mt-3 flex flex-col gap-2">
            {Array.isArray(formData.relevent_notice) &&
              formData.relevent_notice
                .slice()
                .reverse()
                .map((item: any, i: number) => {
                  // 🧠 Figure out filename
                  let fileName = "";
                  if (typeof item === "string") {
                    const parts = item.split("/");
                    const rawName = decodeURIComponent(parts[parts.length - 1]);
                    fileName = rawName.replace(/^\d+-/, "");
                  } else if (item instanceof File) {
                    fileName = item.name;
                  } else {
                    fileName = "document";
                  }

                  //  🕒  date label (uses filename timestamp if available)
                  let addedDate = "";
                  if (typeof item === "string") {
                    const match = item.match(/\/(\d+)-/);
                    if (match && match[1]) {
                      const ts = parseInt(match[1]);
                      if (!isNaN(ts)) {
                        addedDate = new Date(ts).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        });
                      }
                    }
                  } else if (item instanceof File) {
                    addedDate = new Date().toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    });
                  }

                  return (
                    <div
                      key={i}
                      className="flex items-center justify-between bg-gray-50 border rounded-md px-2 py-1"
                    >
                      {/* Link or label for file */}
                      {typeof item === "string" ? (
                        <a
                          href={item}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#98786d] underline text-sm truncate max-w-[180px]"
                          title={fileName}
                        >
                          View {fileName}
                        </a>
                      ) : (
                        <span
                          className="text-sm text-gray-700 truncate max-w-[180px]"
                          title={fileName}
                        >
                          View {fileName}
                        </span>
                      )}

                      <div className="flex items-center gap-3">
                        {addedDate && (
                          <span className="text-xs text-gray-500 mt-0.5">
                            {addedDate}
                          </span>
                        )}

                        {/* ❌ Delete button */}
                        <button
                          type="button"
                          onClick={() =>
                            handleRemoveReleventNotice(
                              (formData.relevent_notice?.length || 0) - 1 - i
                            )
                          }
                          className="text-red-500 hover:text-red-700 ml-2 text-lg leading-none"
                          title="Remove document"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  );
                })}
          </div>
        </div>

        {/* 🏢 Apartment Selection */}
        <div className="col-span-2 border p-3 rounded-md bg-gray-50">
          <label className="text-sm font-medium text-[#98786d] mb-2 block">
            Apartments
          </label>

          {/* Floor & Apartment Dropdowns */}
          <div className="flex flex-col md:flex-row gap-3 mb-3">
            {/* Floor Dropdown */}
            <select
              value={selectedFloor}
              onChange={(e) => setSelectedFloor(e.target.value)}
              className="border border-gray-300 rounded-md p-2 flex-1 focus:ring-2 focus:ring-[#98786d]"
            >
              <option value="">Select Floor</option>
              {floorIds.map((floor) => (
                <option key={floor} value={floor}>
                  {floor.charAt(0).toUpperCase() + floor.slice(1)} Floor
                </option>
              ))}
            </select>

            {/* Apartment Dropdown */}
            <select
              value={selectedApartment}
              onChange={(e) => setSelectedApartment(e.target.value)}
              disabled={!selectedFloor}
              className="border border-gray-300 rounded-md p-2 flex-1 focus:ring-2 focus:ring-[#98786d] disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">Select Apartment</option>
              {apartments.map((apt) => (
                <option key={apt.id} value={apt.number}>
                  {`${apt.number} • ${apt.type} • ${apt.area} sq.ft`}
                </option>
              ))}
            </select>

            {/* Add Button */}
            <button
              type="button"
              onClick={() => {
                if (!selectedApartment || !selectedFloor) return;
                const apt = apartments.find(
                  (a) => a.number === selectedApartment
                );
                if (apt && !currentApartmentIds.includes(apt.id)) {
                  setCurrentApartmentIds((prev) => [...prev, apt.id]);
                  setSelectedApartment(""); // Reset selection
                }
              }}
              className="bg-[#98786d] text-white px-4 py-2 rounded-md hover:bg-[#7d645b]"
            >
              Add
            </button>
          </div>

          {/* Selected Apartments List */}
          {currentApartmentIds.length > 0 ? (
            <div className="space-y-2">
              {currentApartmentIds.map((aptId: string) => {
                // Find apartment details
                const aptDetails = originalApartments.find((a) => a.id === aptId) ||
                                  allApartments.find((a) => a.id === aptId);

                return (
                  <div
                    key={aptId}
                    className="bg-white border rounded-md px-3 py-2 text-sm flex items-center justify-between"
                  >
                    <span className="text-gray-700">
                      {aptDetails ? (
                        <>
                          <span className="font-medium text-[#98786d]">
                            {aptDetails.number || aptDetails.type}
                          </span>
                          {" • "}
                          {aptDetails.floor_id && (
                            <>
                              {aptDetails.floor_id.charAt(0).toUpperCase() +
                                aptDetails.floor_id.slice(1)}{" "}
                              Floor
                            </>
                          )}
                          {aptDetails.alloted_date && (
                            <span className="text-xs text-gray-500 ml-2">
                              (Allotted: {new Date(aptDetails.alloted_date).toLocaleDateString()})
                            </span>
                          )}
                        </>
                      ) : (
                        aptId
                      )}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setCurrentApartmentIds((prev) =>
                          prev.filter((id) => id !== aptId)
                        )
                      }
                      className="text-red-500 hover:text-red-700"
                    >
                      ✕
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-500 text-sm mt-1">No apartments selected</p>
          )}
        </div>

        {/* Floor dropdown
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

        // {/* Apartment dropdown */}
        {/* <div>
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
        </div> */}

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
        <div className="flex flex-col">
          <label className="text-sm font-medium text-[#98786d] mb-1">
            Amount Payable
          </label>
          <input
            type="text"
            name="amount_payable"
            value={formData.amount_payable_display || ""}
            readOnly
            className="border border-gray-300 rounded-md p-2 bg-gray-100 text-gray-700 cursor-not-allowed"
          />

          {/* Show total after discount */}
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

        {/* Notes */}
        <div className="md:col-span-2">
          <label className="text-sm font-medium text-[#98786d] mb-1 block">
            Notes
          </label>
          <input
            name="notes"
            value={formData.notes ?? ""}
            onChange={handleChange}
            className={`border rounded-md p-2 w-full ${
              errors.notes ? "border-red-400" : "border-gray-300"
            }`}
          />
          {errors.notes && (
            <p className="text-red-600 text-xs mt-1">{errors.notes}</p>
          )}
        </div>

        {/* Submit + messages (span full width) */}
        <div className="md:col-span-2 flex flex-col items-center space-y-2 mt-4">
          {hasAttemptedSubmit && Object.keys(errors).length > 0 && (
            <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded mb-3 text-center w-full max-w-md">
              <p className="font-semibold">⚠ Please fix the errors above before submitting</p>
              <p className="text-sm mt-1">Scroll up to review {Object.keys(errors).length} field error{Object.keys(errors).length > 1 ? 's' : ''}</p>
            </div>
          )}

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
            {loading ? (
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
              "Update Client"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
