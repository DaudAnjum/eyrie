// ApartmentModal.tsx
"use client";

import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { Apartment } from "@/types";
import {
  FaBed,
  FaBath,
  FaRuler,
  FaTag,
  FaTimes,
  FaChevronLeft,
  FaChevronRight,
  FaExpand,
} from "react-icons/fa";
import { useEffect, useState } from "react";

interface ApartmentModalProps {
  apartment: Apartment;
  onClose: () => void;
  onContact?: (apartment?: Apartment) => void;
}

const ApartmentModal: React.FC<ApartmentModalProps> = ({
  apartment,
  onClose,
  onContact,
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

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

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (lightboxOpen) setLightboxOpen(false);
        else onClose();
      }
      if (e.key === "ArrowRight" && apartment.renders?.length) {
        setCurrentImageIndex((i) => (i + 1) % apartment.renders!.length);
      }
      if (e.key === "ArrowLeft" && apartment.renders?.length) {
        setCurrentImageIndex(
          (i) => (i - 1 + apartment.renders!.length) % apartment.renders!.length
        );
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, lightboxOpen, apartment.renders]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      if (lightboxOpen) setLightboxOpen(false);
      else onClose();
    }
  };

  const handleContact = () => {
    if (onContact) return onContact(apartment);
    const el = document.getElementById("contact");
    if (el) el.scrollIntoView({ behavior: "smooth" });
    else window.location.href = "#contact";
  };

  const isCommercial = ["shop", "office"].includes(
    apartment.type.toLowerCase()
  );
  const isStudio = apartment.type.toLowerCase() === "studio";

  const capitalize = (str: string) => {
    if (!str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  return (
    <AnimatePresence>
      {/* Main modal */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
        onClick={handleBackdropClick}
        role="presentation"
      >
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby={`apartment-modal-title-${apartment.id}`}
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
            <div>
              <h2
                id={`apartment-modal-title-${apartment.id}`}
                className="text-2xl font-bold text-primary"
              >
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
            <button
              onClick={onClose}
              aria-label="Close apartment details"
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <FaTimes className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Details */}
              <div>
                <h3 className="text-xl font-semibold text-primary mb-4">
                  {isCommercial ? "Unit Details" : "Apartment Details"}
                </h3>
                <div className="space-y-4">
                  {!isCommercial && !isStudio && (
                    <div className="flex items-center space-x-3">
                      <FaBed className="text-accent" />
                      <span className="font-medium">
                        {apartment.bedrooms} Bedrooms
                      </span>
                    </div>
                  )}
                  {!isCommercial && (
                    <div className="flex items-center space-x-3">
                      <FaBath className="text-accent" />
                      <span className="font-medium">
                        {apartment.bathrooms ?? "N/A"} Bathrooms
                      </span>
                    </div>
                  )}
                  <div className="flex items-center space-x-3">
                    <FaRuler className="text-accent" />
                    <span className="font-medium">
                      {formatArea(apartment.area ?? null)}
                    </span>
                  </div>
                  {!isCommercial && (
                    <div className="flex items-center space-x-3">
                      <FaTag className="text-accent" />
                      <span className="font-medium text-lg">
                        {formatPrice(apartment.price)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Payment Options */}
              {!isCommercial && (
                <div>
                  <h3 className="text-xl font-semibold text-primary mb-4">
                    Payment Options
                  </h3>

                  {Array.isArray(apartment.installmentOptions) ? (
                    <div className="space-y-4">
                      {(apartment.installmentOptions as any[]).map(
                        (opt, idx) => (
                          <div
                            key={idx}
                            className="border border-gray-200 rounded-lg p-4"
                          >
                            <h4 className="font-semibold text-primary mb-2">
                              {opt.duration} Month Plan
                            </h4>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span>Down Payment:</span>
                                <span className="font-medium">
                                  {formatPrice(opt.downPayment)}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>Monthly Payment:</span>
                                <span className="font-medium">
                                  {formatPrice(opt.monthlyAmount)}
                                </span>
                              </div>
                              <div className="flex justify-between pt-2 border-t border-gray-200">
                                <span className="font-semibold">Total:</span>
                                <span className="font-semibold">
                                  {formatPrice(
                                    (toNumber(opt.downPayment) ?? 0) +
                                      (toNumber(opt.monthlyAmount) ?? 0) *
                                        (opt.duration ?? 0)
                                  )}
                                </span>
                              </div>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  ) : apartment.installmentOptions ? (
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h4 className="font-semibold text-primary mb-2">
                        Payment Plan
                      </h4>
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
                            {formatPrice(
                              (apartment.installmentOptions as any).total
                            )}
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
              )}
            </div>

            {/* Image Viewer */}
            {!isCommercial &&
              apartment.renders &&
              apartment.renders.length > 0 && (
                <div className="mt-8 flex flex-col items-center">
                  <h3 className="text-xl font-semibold text-primary mb-4">
                    {apartment.renders.length > 1
                      ? "Image Gallery"
                      : "Render & Image"}
                  </h3>
                  <div className="items-center text-red-700 text-sm mt-2 border-red-700 bg-red-100 rounded-full flex px-3 py-2 mb-4">
                    <Image
                      src="/assets/disclaimer.png"
                      alt="Disclaimer"
                      width={16}
                      height={16}
                      className="mr-2 flex-shrink-0"
                    />
                    These images are for illustration purposes only and don't
                    represent the actual apartment.
                  </div>
                  <div className="relative w-full max-w-2xl h-96 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                    <Image
                      src={apartment.renders[currentImageIndex]}
                      alt={`Apartment ${apartment.number} render`}
                      fill
                      className="object-contain cursor-pointer"
                      onClick={() => setLightboxOpen(true)}
                    />
                    {apartment.renders.length > 1 && (
                      <>
                        <button
                          className="absolute left-2 top-1/2 -translate-y-1/2 bg-white p-2 rounded-full shadow hover:bg-gray-200"
                          onClick={() =>
                            setCurrentImageIndex(
                              (i) =>
                                (i - 1 + apartment.renders!.length) %
                                apartment.renders!.length
                            )
                          }
                        >
                          <FaChevronLeft />
                        </button>
                        <button
                          className="absolute right-2 top-1/2 -translate-y-1/2 bg-white p-2 rounded-full shadow hover:bg-gray-200"
                          onClick={() =>
                            setCurrentImageIndex(
                              (i) => (i + 1) % apartment.renders!.length
                            )
                          }
                        >
                          <FaChevronRight />
                        </button>
                      </>
                    )}
                    <button
                      className="absolute bottom-2 right-2 bg-white p-2 rounded-full shadow hover:bg-gray-200"
                      onClick={() => setLightboxOpen(true)}
                    >
                      <FaExpand />
                    </button>
                  </div>
                </div>
              )}

            {/* CTA */}
            <div className="mt-8 p-6 bg-primary text-white rounded-lg">
              <h3 className="text-xl font-semibold mb-2">
                {apartment.status === "available"
                  ? "Interested in this unit?"
                  : "Similar units available"}
              </h3>
              <p className="mb-4 opacity-90">
                {apartment.status === "available"
                  ? "Contact our sales team to schedule a viewing or get more information."
                  : "This unit is sold, but we have similar options available. Contact us to explore."}
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <a
                  href="https://impetus.com.pk/contact/"
                  className="btn bg-white text-primary hover:bg-background"
                >
                  Contact Sales Team
                </a>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Lightbox popup */}
      {lightboxOpen && apartment.renders && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-black bg-opacity-90 flex items-center justify-center"
          onClick={handleBackdropClick}
        >
          <div className="relative w-full max-w-5xl h-[80vh]">
            <Image
              src={apartment.renders[currentImageIndex]}
              alt="Fullscreen render"
              fill
              className="object-contain"
            />
            <button
              className="absolute top-4 right-4 text-white text-3xl"
              onClick={() => setLightboxOpen(false)}
            >
              <FaTimes />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ApartmentModal;
