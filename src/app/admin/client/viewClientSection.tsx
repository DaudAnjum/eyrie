"use client";

import { FaUser, FaHome, FaMoneyBillWave, FaInfoCircle } from "react-icons/fa";

interface ViewClientSectionProps {
  client: any;
  onClose: () => void;
}

export default function ViewClientSection({
  client,
  onClose,
}: ViewClientSectionProps) {
  return (
    <div className="space-y-6 bg-white p-6 rounded-lg shadow max-h-[80vh] overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between border-b pb-3">
        <h2 className="text-2xl font-semibold text-[#98786d] flex items-center gap-2">
          <FaInfoCircle className="text-[#98786d]" /> Client Details
        </h2>
        {/* 🖼️ Client Image */}
        <div>
          <p className="text-[#98786d] font-medium">Client Image</p>
          {client.client_image ? (
            <img
              src={client.client_image}
              alt="Client"
              className="mt-1 w-32 h-32 object-cover rounded-md border"
            />
          ) : (
            <p className="text-gray-500 text-sm bg-gray-50 p-2 rounded-md border border-gray-200">
              No image
            </p>
          )}
        </div>
      </div>

      {/* Personal Information */}
      <div>
        <h3 className="text-lg font-semibold text-[#98786d] mb-2 flex items-center gap-2">
          <FaUser /> Personal Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <Detail label="Membership #" value={client.membership_number} />
          <Detail label="Name" value={client.client_name} />
          <Detail label="CNIC" value={client.CNIC} />
          <Detail label="Passport Number" value={client.passport_number} />
          <Detail label="Email" value={client.email} />
          <Detail label="Contact Number" value={client.contact_number} />
          <Detail label="Next of Kin" value={client.next_of_kin} />

          <div className="md:col-span-2">
            <Detail label="Address" value={client.address} />
          </div>
          <div className="md:col-span-2">
            <p className="text-[#98786d] font-medium">Documents</p>
            {Array.isArray(client.documents) && client.documents.length > 0 ? (
              <ul className="list-disc ml-5 space-y-1">
                {client.documents.map((url: string, i: number) => {
                  const fileName = decodeURIComponent(
                    url.split("/").pop() || `Document ${i + 1}`
                  );
                  return (
                    <li key={i}>
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#98786d] underline"
                      >
                        View {fileName}
                      </a>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-gray-500 text-sm bg-gray-50 p-2 rounded-md border border-gray-200">
                No documents
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Apartment Information */}
      <div>
        <h3 className="text-lg font-semibold text-[#98786d] mb-2 flex items-center gap-2">
          <FaHome /> Apartment Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <Detail label="Floor" value={client.floor_name} />
          <Detail label="Apartment" value={client.apartment_type} />
        </div>
      </div>

      {/* Payment Information */}
      <div>
        <h3 className="text-lg font-semibold text-[#98786d] mb-2 flex items-center gap-2">
          <FaMoneyBillWave /> Payment Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <Detail label="Installment Plan" value={client.installment_plan} />
          <Detail label="Discount" value={`${client.discount}%`} />
          <Detail
            label="Amount Payable"
            value={`Rs. ${client.amount_payable}`}
          />
          <div className="mt-8">
            <span className="font-medium text-[#98786d]">Status:</span>{" "}
            <span
              className={`font-semibold ${
                client.status === "Active" ? "text-green-600" : "text-red-600"
              }`}
            >
              {client.status}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Reusable Detail component
function Detail({ label, value }: { label: string; value: any }) {
  return (
    <div>
      <p className="text-[#98786d] font-medium">{label}</p>
      <p className="text-gray-700 bg-gray-50 p-2 rounded-md border border-gray-200">
        {value || "—"}
      </p>
    </div>
  );
}
