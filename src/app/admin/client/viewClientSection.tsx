"use client";

import { FaUser, FaHome, FaMoneyBillWave, FaInfoCircle } from "react-icons/fa";
import {
  getClientApartments,
  fetchApartmentPricesByIds,
} from "./clientFunctions";
import React, { useEffect, useState } from "react";

interface ViewClientSectionProps {
  client: any;
  onClose: () => void;
}

export default function ViewClientSection({
  client,
  onClose,
}: ViewClientSectionProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b pb-3">
        <h2 className="text-2xl font-semibold text-[#98786d] flex items-center gap-2">
          <FaInfoCircle className="text-[#98786d]" /> Client Details
        </h2>
        {/* 🖼️ Client Image (Circular) */}
        <div className="w-32 h-32 rounded-full border overflow-hidden flex items-center justify-center bg-gray-50">
          {client.client_image ? (
            <img
              src={client.client_image}
              alt="Client"
              className="w-full h-full object-cover rounded-full"
            />
          ) : (
            <span className="text-gray-500 text-sm">No image</span>
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
          <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-[#98786d] font-medium">Documents</p>
              {Array.isArray(client.documents) &&
              client.documents.length > 0 ? (
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
                          className="text-blue-600 hover:text-blue-800 underline font-medium transition-colors"
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
            {/* 📄 Relevent Notice Documents */}
            <div>
              <p className="text-[#98786d] font-medium mb-1">
                Relevent Notice Documents
              </p>
              {Array.isArray(client.relevent_notice) &&
              client.relevent_notice.length > 0 ? (
                <ul className="list-disc ml-5 space-y-1">
                  {[...client.relevent_notice]
                    .slice()
                    .reverse()
                    .map((url, i) => {
                      const fileName = decodeURIComponent(
                        url.split("/").pop() || `Document ${i + 1}`
                      );
                      return (
                        <li key={i}>
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 underline font-medium transition-colors"
                          >
                            View {fileName}
                          </a>
                        </li>
                      );
                    })}
                </ul>
              ) : (
                <p className="text-gray-500 text-sm bg-gray-50 p-2 rounded-md border border-gray-200">
                  No relevent documents
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 🏢 Apartment Information */}
      <div>
        <h3 className="text-lg font-semibold text-[#98786d] mb-2 flex items-center gap-2">
          <FaHome /> Apartment Information
        </h3>

        <ApartmentList membershipNumber={client.membership_number} />
      </div>

      {/* 💰 Payment Information */}
      <div>
        <h3 className="text-lg font-semibold text-[#98786d] mb-2 flex items-center gap-2">
          <FaMoneyBillWave /> Payment Information
        </h3>

        <PaymentInfo client={client} />
      </div>

      {/* Apartment Information */}
      {/* <div>
        <h3 className="text-lg font-semibold text-[#98786d] mb-2 flex items-center gap-2">
          <FaHome /> Apartment Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <Detail label="Floor" value={client.floor_name} />
          <Detail label="Apartment" value={client.apartment_type} />
        </div>
      </div> */}

      {/* Payment Information */}
      {/* <div>
        <h3 className="text-lg font-semibold text-[#98786d] mb-2 flex items-center gap-2">
          <FaMoneyBillWave /> Payment Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <Detail
            label="Amount Payable"
            value={`Rs. ${client.amount_payable}`}
          />
          <div className="md:col-span-2">
            <Detail label="Notes" value={client.notes} />
          </div>

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
      </div> */}
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

// 🏢 Fetch and display apartment list
function ApartmentList({ membershipNumber }: { membershipNumber: string }) {
  const [apartments, setApartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await getClientApartments(membershipNumber);
      setApartments(data || []);
      setLoading(false);
    };
    load();
  }, [membershipNumber]);

  if (loading) {
    return <p className="text-gray-500 text-sm">Loading apartments...</p>;
  }

  if (!apartments.length) {
    return (
      <p className="text-gray-500 text-sm bg-gray-50 p-2 rounded-md border border-gray-200">
        No apartments assigned
      </p>
    );
  }

  return (
    <ul className="space-y-3 bg-gray-50 p-3 rounded-md border border-gray-200">
      {apartments.map((apt) => (
        <li key={apt.id} className="text-sm">
          <div className="flex justify-between text-gray-700">
            <span>
              <span className="font-medium text-[#98786d]">{apt.type}</span> —{" "}
              {apt.floor_id.charAt(0).toUpperCase() + apt.floor_id.slice(1)}{" "}
              floor
            </span>
            <span className="text-gray-500 text-xs">
              Allotted:{" "}
              {new Date(apt.alloted_date).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "2-digit",
              })}
            </span>
          </div>
          <div className="text-xs text-gray-600 mt-1">
            Base: PKR {(apt.price || 0).toLocaleString()}
            {apt.discount > 0 && (
              <>
                {" • "}
                <span className="text-green-600 font-medium">
                  {apt.discount}% off
                </span>
                {" → "}
                Discounted: PKR{" "}
                {(apt.discounted_price || apt.price).toLocaleString()}
              </>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}

// 💰 Payment Info Section
function PaymentInfo({ client }: { client: any }) {
  const [apartmentPrices, setApartmentPrices] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPrices = async () => {
      // Fetch apartments from intermediate table using membership number
      const { data: apartments } = await getClientApartments(
        client.membership_number
      );

      if (apartments && apartments.length > 0) {
        // Extract discounted prices from apartments
        const prices = apartments.map(
          (apt: any) => apt.discounted_price || apt.price || 0
        );
        setApartmentPrices(prices);
      }
      setLoading(false);
    };
    loadPrices();
  }, [client.membership_number]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
      {/* Amount Payable */}
      <div className="md:col-span-2">
        <p className="text-[#98786d] font-medium mb-2">Amount Payable</p>

        {/* 🧮 Price Breakdown - showing discounted prices */}
        <p className="text-gray-700 bg-gray-50 p-2 rounded-md border border-gray-200">
          {apartmentPrices.length > 0
            ? apartmentPrices
                .map((price, i) =>
                  new Intl.NumberFormat("en-PK", {
                    style: "currency",
                    currency: "PKR",
                    maximumFractionDigits: 0,
                  }).format(price)
                )
                .join(" + ")
            : "—"}
        </p>

        {/* 💰 Total Below */}
        <div className="text-sm text-gray-700 mt-2">
          <span className="font-semibold">Total Payable:</span>{" "}
          {client.amount_payable
            ? new Intl.NumberFormat("en-PK", {
                style: "currency",
                currency: "PKR",
                maximumFractionDigits: 0,
              }).format(client.amount_payable)
            : "Rs. 0"}
        </div>
      </div>

      <Detail label="Agent Name" value={client.agent_name} />

      <div className="md:col-span-2">
        <Detail label="Notes" value={client.notes} />
      </div>

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
  );
}
