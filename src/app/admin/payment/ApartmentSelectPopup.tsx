"use client";

import { FaTimes, FaBuilding } from "react-icons/fa";

interface Apartment {
  id: string;
  number: string;
  type: string;
  floor_id: string;
  price: number;
  discounted_price?: number;
  alloted_date: string;
}

interface ApartmentSelectPopupProps {
  isOpen: boolean;
  onClose: () => void;
  apartments: Apartment[];
  clientName: string;
  onSelectApartment: (apartment: Apartment) => void;
}

export default function ApartmentSelectPopup({
  isOpen,
  onClose,
  apartments,
  clientName,
  onSelectApartment,
}: ApartmentSelectPopupProps) {
  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const capitalizeFloor = (floor: string) => {
    return floor.charAt(0).toUpperCase() + floor.slice(1);
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h2 className="text-xl font-semibold text-[#98786d]">
              Select Apartment
            </h2>
            <p className="text-sm text-gray-600">{clientName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-1"
          >
            <FaTimes size={20} />
          </button>
        </div>

        {/* Apartment List */}
        <div className="p-4 max-h-[60vh] overflow-y-auto">
          <div className="space-y-3">
            {apartments.map((apt) => (
              <div
                key={apt.id}
                onClick={() => onSelectApartment(apt)}
                className="flex items-center gap-4 p-4 border rounded-lg cursor-pointer hover:border-[#98786d] hover:bg-gray-50 transition-all"
              >
                <div className="bg-[#98786d] bg-opacity-10 p-3 rounded-lg">
                  <FaBuilding className="text-[#98786d] text-xl" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-gray-800">
                        {apt.type} - {apt.number}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {capitalizeFloor(apt.floor_id)} Floor
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-medium text-[#98786d]">
                        {formatCurrency(apt.discounted_price || apt.price || 0)}
                      </span>
                      {apt.discounted_price && apt.discounted_price !== apt.price && (
                        <p className="text-xs text-gray-500 line-through">
                          {formatCurrency(apt.price || 0)}
                        </p>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Allotted: {formatDate(apt.alloted_date)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50 rounded-b-lg">
          <p className="text-sm text-gray-500 text-center">
            Click on an apartment to view its payment details
          </p>
        </div>
      </div>
    </div>
  );
}
