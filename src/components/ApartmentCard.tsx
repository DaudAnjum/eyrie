"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Apartment } from "@/types";
import { FaBed, FaBath, FaRuler, FaTag } from "react-icons/fa";
import { useAppStore } from "@/lib/store";
import { floors } from "@/data/buildingData";

interface ApartmentCardProps {
  apartment: Apartment;
  onClick: () => void;
}

const ApartmentCard: React.FC<ApartmentCardProps> = ({
  apartment,
  onClick,
}) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatArea = (area: number) => {
    return `${area.toLocaleString()} sq ft`;
  };

  // Get floor name for display
  const getFloorName = (floorId: string) => {
    const floorNames: { [key: string]: string } = {
      basement: "Basement",
      "lower-ground": "Lower Ground",
      ground: "Ground Floor",
      first: "First Floor",
      second: "Second Floor",
      third: "Third Floor",
      fourth: "Fourth Floor",
      fifth: "Fifth Floor",
      sixth: "Sixth Floor",
      seventh: "Seventh Floor",
      eighth: "Eighth Floor",
      ninth: "Ninth Floor",
      rooftop: "Rooftop",
    };
    return floorNames[floorId] || floorId;
  };

  const isCommercial = ["shop", "office"].includes(
    apartment.type.toLowerCase()
  );
  const isStudio = apartment.type.toLowerCase() === "studio";

  const { apartments } = useAppStore();

  const allApartments =
    apartments.length > 0
      ? apartments
      : floors.flatMap((floor) => floor.apartments);
  const availableCount = allApartments.filter(
    (apt) => apt.status === "available"
  ).length;

  // Function to get total units by type
  const getCountsByType = (type: string) => {
    const units = allApartments.filter(
      (apt) => apt.type.toLowerCase() === type.toLowerCase()
    );
    return {
      total: units.length,
      available: units.filter((apt) => apt.status === "available").length,
    };
  };

  return (
    <motion.div
      whileHover={{ y: -5 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-lg shadow-lg overflow-hidden cursor-pointer group"
      onClick={onClick}
    >
      {/* Image Placeholder or Actual Image */}
      <div className="relative h-48 bg-gradient-to-br from-secondary to-accent">
        {apartment.renders && apartment.renders.length > 0 ? (
          <>
            <Image
              src={apartment.renders[0]} // show the first image
              alt={`Apartment ${apartment.number}`}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />

            {/* If there are more images, show indicator */}
            {apartment.renders.length > 1 && (
              <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded-md">
                +{apartment.renders.length - 1} more
              </div>
            )}
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-white text-center">
              <div className="text-4xl mb-2">🏠</div>
              <div className="text-lg font-semibold">{apartment.type}</div>
            </div>
          </div>
        )}

        {/* Status Badge */}
        <div className="absolute top-4 right-4">
          {getCountsByType(apartment.type).available > 0 ? (
            <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-600 text-white">
              {getCountsByType(apartment.type).available}/
              {getCountsByType(apartment.type).total} Available
            </span>
          ) : (
            <span className="px-3 py-1 rounded-full text-sm font-medium bg-red-600 text-white">
              Sold Out
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xl font-bold text-primary">{apartment.type}</h3>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-accent">
              {formatPrice(apartment.price)}
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="flex items-center space-x-2">
            {!isCommercial && !isStudio && (
              <div>
                <FaBed className="text-accent text-sm" />
                <span className="text-sm text-gray-600">
                  {apartment.bedrooms} beds
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {!isCommercial && (
              <div>
                <FaBath className="text-accent text-sm" />
                <span className="text-sm text-gray-600">
                  {apartment.bathrooms} baths
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <FaRuler className="text-accent text-sm" />
            <span className="text-sm text-gray-600">
              {formatArea(apartment.area)}
            </span>
          </div>
        </div>

        {/* Payment Options Preview */}
        {apartment.installmentOptions &&
          apartment.installmentOptions.length > 0 && (
            <div className="border-t border-gray-200 pt-4">
              <div className="text-sm text-gray-600 mb-2">Starting from:</div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Monthly Payment</span>
                <span className="font-semibold text-primary">
                  {formatPrice(
                    Math.min(
                      ...apartment.installmentOptions.map(
                        (opt) => opt.monthlyAmount
                      )
                    )
                  )}
                </span>
              </div>
            </div>
          )}

        {/* View Details Button */}
        {!isCommercial && (
          <div>
            <button className="w-full mt-4 btn btn-primary group-hover:shadow-lg transition-shadow duration-300">
              View Details
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default ApartmentCard;
