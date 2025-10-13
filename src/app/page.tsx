"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { floors, sectionPlan } from "@/data/buildingData";
import { useAppStore } from "@/lib/store";
import FloorPlanViewer from "@/components/FloorPlanViewer";
import ApartmentModal from "@/components/ApartmentModal";
import { FaTimes, FaPlus, FaMinus } from "react-icons/fa";

console.log("🚨 FloorPlanViewer RENDERED");

export default function FloorPlansPage() {
  const [selectedFloorId, setSelectedFloorId] = useState<string>(floors[5].id);
  const {
    selectedApartment,
    setSelectedApartment,
    apartments,
    fetchApartments,
  } = useAppStore();

  useEffect(() => {
    console.log("🟡 FloorPlanViewer mounted. Current apartments:", apartments);
    if (apartments.length === 0) {
      console.log("🏠 Fetching apartments from Cached data...");
      fetchApartments();
    }
  }, [fetchApartments, apartments]);

  const selectedFloor = floors.find((floor) => floor.id === selectedFloorId);

  const [isOpen, setIsOpen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const dragRef = useRef<HTMLDivElement>(null);

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.25, 3)); // max 3x
  const handleZoomOut = () => {
    setZoom((z) => {
      const newZoom = Math.max(z - 0.25, 1);
      if (newZoom === 1) setPosition({ x: 0, y: 0 }); // reset pan
      return newZoom;
    });
  };

  return (
    <div className="min-h-screen py-24">
      <div className="container mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Interactive Floor Plans
          </h1>
          <p className="text-lg text-white max-w-2xl mx-auto">
            Explore our building floor by floor. Click on apartment markers to
            view details and availability.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Floor Navigation Sidebar */}
          <motion.div
            initial={{ x: "-100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="sidebar"
          >
            <div className="bg-white rounded-lg shadow-lg p-6 sticky top-24 h-[92vh] overflow-y-auto text-background glass-gradient">
              <h3 className="text-xl font-semibold mb-6">Building Floors</h3>

              <div className="space-y-2">
                <div className="space-y-2">
                  {floors.map((floor) => {
                    let unitLabel = `${
                      apartments.filter((apt) => apt.floorId === floor.id)
                        .length
                    } apartments`;
                    console.log("🏢 Floor:", floor.name, "Units:", unitLabel);

                    // Special cases
                    if (floor.name.toLowerCase().includes("basement")) {
                      unitLabel = "Parking";
                    } else if (
                      floor.name.toLowerCase().includes("lower ground")
                    ) {
                      unitLabel = `${
                        apartments.filter((apt) => apt.floorId === floor.id)
                          .length
                      } shops`;
                    } else if (
                      floor.name.toLowerCase().includes("ground floor")
                    ) {
                      unitLabel = `${
                        apartments.filter((apt) => apt.floorId === floor.id)
                          .length
                      } shops`;
                    } else if (
                      floor.name.toLowerCase().includes("first floor")
                    ) {
                      unitLabel = `13 offices`; // override count
                    } else if (
                      floor.name.toLowerCase().includes("second floor")
                    ) {
                      unitLabel = `12 offices`; // override count
                    }

                    return (
                      <button
                        key={floor.id}
                        onClick={() => setSelectedFloorId(floor.id)}
                        className={`w-full text-left p-3 rounded-lg transition-all duration-300 text-white glass-dark ${
                          selectedFloorId === floor.id
                            ? "shadow-md glass-dark-hover"
                            : "bg-white hover:bg-primary text-primary hover:text-background"
                        }`}
                      >
                        <div className="font-medium">{floor.name}</div>
                        <div className="text-sm opacity-75">
                          Level {floor.level} • {unitLabel}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Section Plan */}
              <div className="mt-8 pt-6 border-t border-gray-200 text-background">
                <h4 className="text-lg font-semibold mb-4">Building Section</h4>
                <div>
                  {/* Thumbnail */}
                  <div
                    className="relative h-48 rounded-lg overflow-hidden cursor-pointer"
                    onClick={() => {
                      setIsOpen(true);
                      setZoom(1);
                      setPosition({ x: 0, y: 0 }); // reset pan
                    }}
                  >
                    <Image
                      src={sectionPlan}
                      alt="Building Section A-A"
                      fill
                      className="object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                </div>
                <p className="text-sm mt-2">
                  Complete building cross-section view
                </p>
              </div>
            </div>
          </motion.div>

          {/* Floor Plan Viewer */}
          <motion.div
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="lg:col-span-3"
          >
            <AnimatePresence mode="wait">
              {selectedFloor && (
                <motion.div
                  key={selectedFloor.id} // Ensures animation when switching floors
                  initial={{ x: "100%", opacity: 0 }} // Slide in from right
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: "100%", opacity: 0 }} // Slide out when unselected
                  transition={{ duration: 0.4, ease: "easeOut" }}
                >
                  <FloorPlanViewer floor={selectedFloor} />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* Legend
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-12 bg-white rounded-lg shadow-lg p-6 text-white glass-gradient"
        >
          <h3 className="text-xl font-semibold mb-4">Legend</h3>
          <div className="flex flex-wrap gap-6">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded-full bg-success border-2 border-white shadow-md"></div>
              <span className="font-medium">Available Apartment</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded-full bg-sold border-2 border-white shadow-md"></div>
              <span className="font-medium">Sold Apartment</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="font-medium">
                Click markers to view apartment details
              </span>
            </div>
          </div>
        </motion.div> */}
      </div>

      {/* Apartment Modal */}
      {selectedApartment && (
        <ApartmentModal
          apartment={selectedApartment}
          onClose={() => setSelectedApartment(null)}
        />
      )}
      {/* Popup */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center"
            onClick={() => setIsOpen(false)}
          >
            <div
              ref={dragRef}
              className="relative z-[9999] w-full max-w-5xl h-[80vh] flex items-center justify-center"
              onClick={(e) => e.stopPropagation()} // prevent close on image click
            >
              {/* Zoomable + draggable image */}
              <motion.div
                drag={zoom > 1 ? true : false}
                dragConstraints={dragRef}
                dragMomentum={false}
                style={{
                  x: position.x,
                  y: position.y,
                  scale: zoom,
                }}
                className="w-full h-full relative flex items-center justify-center"
              >
                <Image
                  src={sectionPlan}
                  alt="Building Section A-A"
                  fill
                  className="object-contain pointer-events-none"
                />
              </motion.div>

              {/* Close button - stays top right */}
              <button
                onClick={() => setIsOpen(false)}
                className="absolute top-4 right-4 bg-primary bg-opacity-70 text-white text-3xl p-2 rounded-full hover:bg-opacity-90 hover:bg-white hover:text-primary"
              >
                <FaTimes />
              </button>

              {/* Zoom controls - top center, independent of zoom */}
              <div className="absolute top-4 left-1/2 transform -translate-x-1/2 flex space-x-3 bg-primary bg-opacity-70 p-2 rounded-lg">
                <button
                  onClick={handleZoomOut}
                  className="p-2 rounded-full text-white bg-white bg-opacity-20 hover:bg-opacity-30"
                >
                  <FaMinus />
                </button>
                <button
                  onClick={handleZoomIn}
                  className="p-2 rounded-full text-white bg-white bg-opacity-20 hover:bg-opacity-30"
                >
                  <FaPlus />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
