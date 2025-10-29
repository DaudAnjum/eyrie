"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAppStore } from "@/lib/store";
import { supabase } from "@/lib/supabaseClient";
import { Apartment } from "@/types";
import { floors } from "@/data/buildingData";
import Link from "next/link";

export default function AdminDashboard({ user }: { user: any }) {
  const { apartments, updateApartmentStatus, fetchApartments } = useAppStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<
    "all" | "available" | "sold"
  >("all");
  const [selectedFloor, setSelectedFloor] = useState<string>("all");

  useEffect(() => {
    if (apartments.length === 0) {
      fetchApartments();
    }
  }, [fetchApartments]);

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

  return (
    <div className="min-h-screen py-24 bg-background">
      <div className="container mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-primary mb-2">
            Admin Dashboard
          </h1>
          <p className="text-gray-600">
            Manage apartment availability and status
          </p>
        </motion.div>

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
          className="mt-8 bg-white rounded-lg shadow-lg p-6"
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
          className="bg-white rounded-lg shadow-lg overflow-hidden"
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
                    className="hover:bg-gray-50"
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
                      <div className="flex space-x-2">
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
    </div>
  );
}
