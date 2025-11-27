"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAppStore } from "@/lib/store";
import { supabase } from "@/lib/supabaseClient";
import { floors } from "@/data/buildingData";
import { usePathname } from "next/navigation";
import {
  FaUser,
  FaBed,
  FaBath,
  FaRuler,
  FaTag,
  FaHome,
  FaTimes,
} from "react-icons/fa";
import AdminButtons from "./adminButtons";
import ViewClientSection from "./client/viewClientSection";
import { Apartment } from "@/types";

export default function AdminDashboard({ user }: { user: any }) {
  const { apartments, updateApartmentStatus, fetchApartments } = useAppStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<
    "all" | "available" | "sold"
  >("all");
  const [selectedFloor, setSelectedFloor] = useState<string>("all");
  const [showViewClient, setShowViewClient] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [noClientMessage, setNoClientMessage] = useState<string | null>(null);
  const [showClientModal, setShowClientModal] = useState(false);
  const [isLoadingClient, setIsLoadingClient] = useState(false);
  const [apartmentClientMap, setApartmentClientMap] = useState<
    Record<string, string>
  >({});
  const [selectedApartment, setSelectedApartment] = useState<Apartment | null>(
    null
  );

  useEffect(() => {
    if (apartments.length === 0) {
      fetchApartments();
    }
  }, [fetchApartments]);

  // Fetch apartment-client mappings from intermediate table
  useEffect(() => {
    const fetchApartmentClientMappings = async () => {
      try {
        const { data, error } = await supabase
          .from("intermediate")
          .select("apartment_id, client_membership");

        if (error) {
          console.error("Error fetching apartment-client mappings:", error);
          return;
        }

        if (data) {
          // Create a map of apartment_id -> client_membership
          const mappings: Record<string, string> = {};
          data.forEach((item) => {
            if (item.apartment_id && item.client_membership) {
              mappings[item.apartment_id] = item.client_membership;
            }
          });
          setApartmentClientMap(mappings);
        }
      } catch (err) {
        console.error("Error fetching mappings:", err);
      }
    };

    fetchApartmentClientMappings();
  }, []);

  // Filtered apartments based on search, status, and floor
  const filteredApartments = apartments.filter((apartment) => {
    const matchesSearch =
      apartment.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apartment.type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === "all" || apartment.status === filterStatus;
    const matchesFloor =
      selectedFloor === "all" || apartment.floorId === selectedFloor;
    return matchesSearch && matchesStatus && matchesFloor;
  });

  const handleStatusChange = async (
    apartmentId: string,
    newStatus: "available" | "sold"
  ) => {
    const { error } = await supabase
      .from("apartments")
      .update({ status: newStatus })
      .eq("id", apartmentId);

    if (error) {
      console.error("Error updating status:", error);
    } else {
      updateApartmentStatus(apartmentId, newStatus);

      await fetch("/api/apartments?invalidate=1");
    }
  };

  const stats = {
    total: apartments.length,
    available: apartments.filter((apt) => apt.status === "available").length,
    sold: apartments.filter((apt) => apt.status === "sold").length,
  };

  const getFloorName = (floorId: string) => {
    const floor = floors.find((f) => f.id === floorId);
    return floor ? floor.name : floorId;
  };

  const pathname = usePathname();

  const handleViewClient = async (apartmentId: string) => {
    setIsLoadingClient(true);
    setShowClientModal(true); // open popup immediately

    try {
      // Step 1: Find client_membership from intermediate table
      const { data: intermediateData, error: intermediateError } =
        await supabase
          .from("intermediate")
          .select("client_membership")
          .eq("apartment_id", apartmentId)
          .single();

      if (intermediateError || !intermediateData) {
        setSelectedClient(null);
        setNoClientMessage("No client found for this apartment.");
        setIsLoadingClient(false);
        return;
      }

      // Step 2: Fetch client details using client_membership
      const { data: clientData, error: clientError } = await supabase
        .from("clients")
        .select("*")
        .eq("membership_number", intermediateData.client_membership || "")
        .single();

      if (clientError || !clientData) {
        setSelectedClient(null);
        setNoClientMessage("No client found for this apartment.");
      } else {
        setSelectedClient(clientData);
        setNoClientMessage(null);
      }
    } catch (err) {
      console.error("Error fetching client:", err);
      setSelectedClient(null);
      setNoClientMessage("An error occurred while loading client data.");
    } finally {
      setIsLoadingClient(false);
    }
  };

  return (
    <div className="py-24 bg-background">
      <h2 className="text-4xl font-semibold text-text mb-12 mt-12 text-center">
        Admin Dashboard
      </h2>
      <AdminButtons />

      <div className="container mx-auto px-6">
        {/* Statistics */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        >
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Apartments</p>
                <p className="text-3xl font-bold text-primary">{stats.total}</p>
              </div>
              <div className="text-4xl">🏠</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Available</p>
                <p className="text-3xl font-bold text-success">
                  {stats.available}
                </p>
              </div>
              <div className="text-4xl">✅</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Sold</p>
                <p className="text-3xl font-bold text-sold">{stats.sold}</p>
              </div>
              <div className="text-4xl">❌</div>
            </div>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="bg-white rounded-lg shadow-lg p-6 mb-8"
        >
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search apartments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
              />
            </div>

            {/* Floor selector */}
            <div>
              <select
                value={selectedFloor}
                onChange={(e) => setSelectedFloor(e.target.value)}
                className="w-full md:w-auto p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
              >
                <option value="all">All Floors</option>
                {floors.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status selector */}
            <div>
              <select
                value={filterStatus}
                onChange={(e) =>
                  setFilterStatus(
                    e.target.value as "all" | "available" | "sold"
                  )
                }
                className="w-full md:w-auto p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="available">Available</option>
                <option value="sold">Sold</option>
              </select>
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-600">
            Showing {filteredApartments.length} of {apartments.length}{" "}
            apartments
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="mt-4 bg-white rounded-lg shadow-lg p-6"
        >
          <div className="flex justify-end items-center gap-2 text-sm">
            <h3 className="font-semibold text-primary">Quick Actions:</h3>
            <button
              onClick={() => {
                const availableApts = apartments.filter(
                  (apt) => apt.status === "available"
                );
                availableApts.forEach((apt) =>
                  handleStatusChange(apt.id, "sold")
                );
              }}
              className="btn bg-sold text-white hover:bg-red-600 px-3 py-2 text-xs"
            >
              Mark All as Sold
            </button>
            <button
              onClick={() => {
                const soldApts = apartments.filter(
                  (apt) => apt.status === "sold"
                );
                soldApts.forEach((apt) =>
                  handleStatusChange(apt.id, "available")
                );
              }}
              className="btn bg-success text-white hover:bg-green-600 px-3 py-2 text-xs"
            >
              Mark All as Available
            </button>
          </div>
        </motion.div>

        {/* Apartments Table */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="bg-white rounded-lg shadow-lg overflow-hidden p-4 md:p-6 mt-4"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-primary text-white">
                <tr>
                  <th className="px-6 py-4 text-left">Apartment</th>
                  <th className="px-6 py-4 text-left">Floor</th>
                  <th className="px-6 py-4 text-left">Type</th>
                  <th className="px-6 py-4 text-left">Price (PKR)</th>
                  <th className="px-6 py-4 text-left">Status</th>
                  <th className="px-6 py-4 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredApartments.map((apartment, index) => (
                  <motion.tr
                    key={apartment.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="hover:bg-gray-100 cursor-pointer transition-colors"
                    onClick={(e) => {
                      // Only open modal if clicking on the row itself, not on buttons
                      const target = e.target as HTMLElement;
                      if (!target.closest("button")) {
                        setSelectedApartment(apartment);
                      }
                    }}
                  >
                    <td className="px-6 py-4">
                      <div className="font-semibold text-primary">
                        {apartment.number}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-gray-700">
                        {getFloorName(apartment.floorId)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-gray-700">{apartment.type}</div>
                      <div className="text-sm text-gray-500">
                        {apartment.bedrooms} bed • {apartment.bathrooms} bath •{" "}
                        {apartment.area} sq ft
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-accent">
                        {apartment.price.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          apartment.status === "available"
                            ? "status-available"
                            : "status-sold"
                        }`}
                      >
                        {apartment.status === "available"
                          ? "Available"
                          : "Sold"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() =>
                            handleStatusChange(apartment.id, "available")
                          }
                          disabled={apartment.status === "available"}
                          className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                            apartment.status === "available"
                              ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                              : "bg-success text-white hover:bg-green-600"
                          }`}
                        >
                          Available
                        </button>
                        <button
                          onClick={() =>
                            handleStatusChange(apartment.id, "sold")
                          }
                          disabled={apartment.status === "sold"}
                          className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                            apartment.status === "sold"
                              ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                              : "bg-sold text-white hover:bg-red-600"
                          }`}
                        >
                          Sold
                        </button>
                        {apartmentClientMap[apartment.id] ? (
                          <button
                            onClick={() => handleViewClient(apartment.id)}
                            disabled={isLoadingClient}
                            className={`p-2 rounded-md transition ${
                              isLoadingClient
                                ? "text-gray-400 cursor-not-allowed"
                                : "text-[#98786d] hover:text-[#7b635b]"
                            }`}
                            title="View Client"
                          >
                            <FaUser className="text-lg" />
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400 py-1 italic">
                            No Client
                          </span>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredApartments.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                No apartments found
              </h3>
              <p className="text-gray-500">
                Try adjusting your search or filter criteria.
              </p>
            </div>
          )}
        </motion.div>
      </div>

      {showClientModal && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowClientModal(false);
          }}
        >
          <div
            className="bg-white rounded-lg shadow-lg p-8 w-[90%] max-w-4xl relative"
            style={{ maxHeight: "85vh", overflowY: "auto" }}
          >
            {/* Close button */}
            <button
              onClick={() => setShowClientModal(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-primary text-xl"
            >
              <FaTimes />
            </button>

            {/* Loader */}
            {isLoadingClient ? (
              <div className="flex justify-center items-center h-40">
                <svg
                  className="animate-spin h-8 w-8 text-[#98786d]"
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
              </div>
            ) : noClientMessage ? (
              <p className="text-center text-red-500 font-medium">
                {noClientMessage}
              </p>
            ) : selectedClient ? (
              <ViewClientSection
                client={selectedClient}
                onClose={() => setShowClientModal(false)}
              />
            ) : (
              <p className="text-center text-gray-500">No data to display.</p>
            )}
          </div>
        </div>
      )}

      {/* Apartment Details Modal */}
      {selectedApartment && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedApartment(null);
          }}
        >
          <div className="bg-white rounded-lg shadow-lg p-8 w-[90%] max-w-4xl max-h-[85vh] overflow-y-auto relative">
            {/* Close button */}
            <button
              onClick={() => setSelectedApartment(null)}
              className="absolute top-4 right-4 text-gray-500 hover:text-primary text-xl z-10"
            >
              <FaTimes />
            </button>

            {/* Apartment Details Content */}
            <ApartmentDetailsAdmin apartment={selectedApartment} />
          </div>
        </div>
      )}
    </div>
  );
}

// Apartment Details Component for Admin (matches original ApartmentModal layout)
function ApartmentDetailsAdmin({ apartment }: { apartment: Apartment }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const capitalize = (str: string) => {
    if (!str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  const toNumber = (val?: number | string | null) => {
    if (val === undefined || val === null || val === "") return null;
    if (typeof val === "number") return val;
    const parsed = Number(String(val).replace(/,/g, ""));
    return Number.isNaN(parsed) ? null : parsed;
  };

  const formatPrice = (price?: number | string | null) => {
    const n = toNumber(price);
    if (n == null) {
      if (price && typeof price === "string") return price;
      return "N/A";
    }
    return new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
      minimumFractionDigits: 0,
    }).format(n);
  };

  const formatArea = (area?: number | null) => {
    if (area == null) return "N/A";
    return `${area.toLocaleString()} sq ft`;
  };

  const isCommercial = ["shop", "office"].includes(
    apartment.type.toLowerCase()
  );
  const isStudio = apartment.type.toLowerCase() === "studio";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b pb-3">
        <h2 className="text-2xl font-bold text-[#98786d]">
          {apartment.number} • {apartment.type} •{" "}
          {capitalize(apartment.floorId)} Floor
        </h2>
        <div
          className={`inline-block px-3 py-1 rounded-full text-sm font-medium mt-2 ${
            apartment.status === "available"
              ? "status-available"
              : "status-sold"
          }`}
        >
          {apartment.status === "available" ? "Available" : "Sold"}
        </div>
      </div>

      {/* Two Column Grid Layout (matches original) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Details Column */}
        <div>
          <h3 className="text-xl font-semibold text-[#98786d] mb-4">
            {isCommercial ? "Unit Details" : "Apartment Details"}
          </h3>
          <div className="space-y-4">
            {!isCommercial && !isStudio && (
              <div className="flex items-center space-x-3">
                <FaBed className="text-[#98786d]" />
                <span className="font-medium">
                  {apartment.bedrooms} Bedrooms
                </span>
              </div>
            )}
            {!isCommercial && (
              <div className="flex items-center space-x-3">
                <FaBath className="text-[#98786d]" />
                <span className="font-medium">
                  {apartment.bathrooms ?? "N/A"} Bathrooms
                </span>
              </div>
            )}
            <div className="flex items-center space-x-3">
              <FaRuler className="text-[#98786d]" />
              <span className="font-medium">
                {formatArea(apartment.area ?? null)}
              </span>
            </div>
            {!isCommercial && (
              <div className="flex items-center space-x-3">
                <FaTag className="text-[#98786d]" />
                <span className="font-medium text-lg">
                  {formatPrice(apartment.price)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Payment Options Column */}
        <div>
          <h3 className="text-xl font-semibold text-[#98786d] mb-4">
            Payment Options
          </h3>

          {apartment.installmentOptions ? (
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Booking:</span>
                  <span className="font-medium">
                    {formatPrice(
                      (apartment.installmentOptions as any).booking
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Allotment Confirmation:</span>
                  <span className="font-medium">
                    {formatPrice(
                      (apartment.installmentOptions as any)
                        .allotmentConfirmation
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Monthly Installments:</span>
                  <span className="font-medium">
                    {formatPrice(
                      (apartment.installmentOptions as any)
                        .monthlyInstallments
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Half Yearly:</span>
                  <span className="font-medium">
                    {formatPrice(
                      (apartment.installmentOptions as any).halfYearly
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>On Possession:</span>
                  <span className="font-medium">
                    {formatPrice(
                      (apartment.installmentOptions as any).onPossession
                    )}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-200">
                  <span className="font-semibold">Total:</span>
                  <span className="font-semibold">
                    {formatPrice((apartment.installmentOptions as any).total)}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-gray-600">
                Contact us for payment options and financing details.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Images Section */}
      {!isCommercial && apartment.renders && apartment.renders.length > 0 && (
        <div className="mt-8 flex flex-col items-center">
          <h3 className="text-xl font-semibold text-[#98786d] mb-4">
            {apartment.renders.length > 1 ? "Image Gallery" : "Render & Image"}
          </h3>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 w-full">
            {/* Current Image Display */}
            <div className="relative w-full h-64 bg-gray-200 rounded-lg overflow-hidden mb-3">
              <img
                src={apartment.renders[currentImageIndex]}
                alt={`Apartment ${apartment.number} - Image ${
                  currentImageIndex + 1
                }`}
                className="w-full h-full object-contain"
              />

              {/* Navigation Arrows */}
              {apartment.renders.length > 1 && (
                <>
                  <button
                    onClick={() =>
                      setCurrentImageIndex(
                        (currentImageIndex - 1 + apartment.renders!.length) %
                          apartment.renders!.length
                      )
                    }
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-[#98786d] p-2 rounded-full shadow"
                  >
                    ‹
                  </button>
                  <button
                    onClick={() =>
                      setCurrentImageIndex(
                        (currentImageIndex + 1) % apartment.renders!.length
                      )
                    }
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-[#98786d] p-2 rounded-full shadow"
                  >
                    ›
                  </button>
                </>
              )}

              {/* Image Counter */}
              {apartment.renders.length > 1 && (
                <div className="absolute bottom-2 right-2 bg-black/60 text-white px-2 py-1 rounded text-xs">
                  {currentImageIndex + 1} / {apartment.renders.length}
                </div>
              )}
            </div>

            {/* Thumbnail Gallery */}
            {apartment.renders.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {apartment.renders.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentImageIndex(idx)}
                    className={`flex-shrink-0 w-16 h-16 rounded border-2 overflow-hidden ${
                      idx === currentImageIndex
                        ? "border-[#98786d]"
                        : "border-gray-300"
                    }`}
                  >
                    <img
                      src={img}
                      alt={`Thumbnail ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
