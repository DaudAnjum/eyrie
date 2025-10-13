"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Apartment, Floor } from "@/types";
import { useAppStore } from "@/lib/store";

interface FloorPlanViewerProps {
  floor: Floor;
}

const FloorPlanViewer: React.FC<FloorPlanViewerProps> = ({ floor }) => {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const { setSelectedApartment, apartments } = useAppStore();
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Get updated apartment data from Supabase via store
  const floorApartments = apartments.filter((apt) => apt.floorId === floor.id);

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.2, 3));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.2, 0.5));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleApartmentClick = (apartment: any) => {
    setSelectedApartment(apartment);
  };

  // Put this inside your FloorPlanViewer component, BEFORE the `return` statement:

  // REFERENCE DIMENSIONS (the size when you placed markers)
  const REFERENCE_WIDTH = 856;
  const REFERENCE_HEIGHT = 500;

  // Utility function to convert px coordinates to percentages
  const convertToPercentage = (coordinates?: { x: number; y: number }) => {
    if (!coordinates) {
      return { left: "0%", top: "0%" };
    }
    return {
      left: `${(coordinates.x / REFERENCE_WIDTH) * 100}%`,
      top: `${(coordinates.y / REFERENCE_HEIGHT) * 100}%`,
    };
  };

  return (
    <div className="bg-background rounded-lg shadow-lg overflow-hidden glass-gradient">
      {/* Floor Plan Header */}
      <div className="text-white p-4 flex justify-between items-center bg-primary glass-dark">
        <div>
          <h2 className="text-2xl font-bold">{floor.name}</h2>
          <p className="opacity-75">
            Level {floor.level} •{" "}
            {(() => {
              const name = floor.name.toLowerCase();

              if (name.includes("basement")) {
                return "Parking";
              }
              if (name.includes("lower ground")) {
                return `${floorApartments.length} shops`;
              }
              if (name.includes("ground floor")) {
                return `${floorApartments.length} shops • 2 cafe`;
              }
              if (name.includes("first floor")) {
                return `13 offices • 2 cafe`; // override count
              }
              if (name.includes("second floor")) {
                return `12 offices • 1 gym`; // override count
              }

              // default for other floors
              return `${floorApartments.length} apartments`;
            })()}
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleZoomOut}
            className="w-8 h-8 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full flex items-center justify-center transition-colors"
          >
            <span className="text-white font-bold">−</span>
          </button>
          <span className="text-white text-sm min-w-[3rem] text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={handleZoomIn}
            className="w-8 h-8 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full flex items-center justify-center transition-colors"
          >
            <span className="text-white font-bold">+</span>
          </button>
          <button
            onClick={resetView}
            className="ml-2 px-3 py-1 bg-white bg-opacity-20 hover:bg-opacity-30 rounded text-sm transition-colors"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Floor Plan Container */}
      {/* Floor Plan Container */}
      <div
        ref={containerRef}
        className="relative h-96 md:h-[500px] overflow-hidden cursor-grab active:cursor-grabbing floor-plan-container"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <motion.div
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: "center center",
          }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="w-full h-full flex items-center justify-center"
        >
          {/* Image Wrapper with intrinsic aspect ratio */}
          <div className="relative w-full" style={{ aspectRatio: "856/500" }}>
            <Image
              src={floor.planImage}
              alt={`${floor.name} floor plan`}
              fill
              className="object-contain pointer-events-none select-none"
              draggable={false}
            />

            {/* Apartment Markers */}
            {floorApartments
              .filter((apartment) => apartment.coordinates)
              .map((apartment) => {
                const position = convertToPercentage(apartment.coordinates);

                return (
                  <button
                    key={apartment.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleApartmentClick(apartment);
                    }}
                    className={`group apartment-marker ${apartment.status} absolute`}
                    style={{
                      left: position.left,
                      top: position.top,
                      zIndex: 10,
                    }}
                  >
                    {/* Marker Dot */}
                    <span
                      className={`
    block w-2 h-2 md:w-4 md:h-4 rounded-full 
    ${apartment.status === "sold" ? "bg-red-500" : "bg-green-500"} 
    shadow-md transition-all duration-300 
    group-hover:scale-125 group-hover:shadow-lg
  `}
                    ></span>

                    {/* Tooltip */}
                    <div
                      className="
                  absolute -top-12 left-1/2 transform -translate-x-1/2 
                  bg-primary text-white text-xs px-3 py-1 rounded-md 
                  opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100
                  transition-all duration-300 ease-out whitespace-nowrap
                  pointer-events-none
                  z-50 group-hover:z-[999]
                "
                    >
                      <div className="font-semibold">{apartment.number}</div>
                      <div className="text-[10px] opacity-90">
                        {apartment.type} •{" "}
                        {apartment.status === "sold" ? "Sold" : "Available"}
                      </div>
                    </div>

                    {/* Tooltip Arrow */}
                    <div
                      className="
                  absolute -top-3 left-1/2 transform -translate-x-1/2 
                  w-0 h-0 border-l-4 border-r-4 border-b-4 
                  border-transparent border-b-primary opacity-0 
                  group-hover:opacity-100 transition-opacity duration-300
                  z-50 group-hover:z-[999]
                "
                    ></div>
                  </button>
                );
              })}
          </div>
        </motion.div>
      </div>

      {/* Floor Information */}
      <div className="p-4 border-t bg-background glass-dark text-background">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-accent">
              {floorApartments.length}
            </div>
            <div className="text-sm">Total Units</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-success">
              {
                floorApartments.filter((apt) => apt.status === "available")
                  .length
              }
            </div>
            <div className="text-sm ">Available</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-sold">
              {floorApartments.filter((apt) => apt.status === "sold").length}
            </div>
            <div className="text-sm">Sold</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-secondary">
              {floorApartments.length > 0
                ? Math.round(
                    (floorApartments.filter((apt) => apt.status === "sold")
                      .length /
                      floorApartments.length) *
                      100
                  )
                : 0}
              %
            </div>
            <div className="text-sm">Sold Rate</div>
          </div>
        </div>
      </div>

      {/* Usage Instructions */}
      {floorApartments.length === 0 && (
        <div className="p-6 text-center text-gray-500">
          <p className="text-lg">No apartments available on this floor</p>
          <p className="text-sm">
            This floor contains common areas and facilities
          </p>
        </div>
      )}
    </div>
  );
};

export default FloorPlanViewer;

// interface FloorPlanViewerProps {
//   floor: Floor;
// }

// const FloorPlanViewer: React.FC<FloorPlanViewerProps> = ({ floor }) => {
//   const [zoom, setZoom] = useState(1);
//   const [pan, setPan] = useState({ x: 0, y: 0 });
//   const [isDragging, setIsDragging] = useState(false);
//   const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
//   const containerRef = useRef<HTMLDivElement>(null);
//   const { setSelectedApartment, apartments } = useAppStore();

//   // Get updated apartment data from store
//   const floorApartments = apartments.filter((apt) => apt.floorId === floor.id);

//   const handleZoomIn = () => {
//     setZoom((prev) => Math.min(prev + 0.2, 3));
//   };

//   const handleZoomOut = () => {
//     setZoom((prev) => Math.max(prev - 0.2, 0.5));
//   };

//   const handleMouseDown = (e: React.MouseEvent) => {
//     setIsDragging(true);
//     setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
//   };

//   const handleMouseMove = (e: React.MouseEvent) => {
//     if (!isDragging) return;
//     setPan({
//       x: e.clientX - dragStart.x,
//       y: e.clientY - dragStart.y,
//     });
//   };

//   const handleMouseUp = () => {
//     setIsDragging(false);
//   };

//   const resetView = () => {
//     setZoom(1);
//     setPan({ x: 0, y: 0 });
//   };

//   const handleApartmentClick = (apartment: any) => {
//     setSelectedApartment(apartment);
//   };

//   return (
//     <div
//       className="bg-white rounded-lg shadow-lg overflow-hidden"
//       style={{ backgroundColor: "#F6F1EA" }}
//     >
//       {/* Floor Plan Header */}
//       <div
//         className="bg-primary text-white p-4 flex justify-between items-center"
//         style={{ backgroundColor: "#96796E", color: "#F6F1EA" }}
//       >
//         <div>
//           <h2 className="text-2xl font-bold">{floor.name}</h2>
//           <p className="opacity-75">
//             Level {floor.level} •{" "}
//             {(() => {
//               const name = floor.name.toLowerCase();

//               if (name.includes("basement")) {
//                 return "Parking";
//               }
//               if (name.includes("lower ground")) {
//                 return `${floorApartments.length} shops`;
//               }
//               if (name.includes("ground floor")) {
//                 return `${floorApartments.length} shops • 2 cafe`;
//               }
//               if (name.includes("first floor")) {
//                 return `13 offices • 2 cafe`; // override count
//               }
//               if (name.includes("second floor")) {
//                 return `12 offices • 1 gym`; // override count
//               }

//               // default for other floors
//               return `${floorApartments.length} apartments`;
//             })()}
//           </p>
//         </div>

//         {/* Controls */}
//         <div className="flex items-center space-x-2">
//           <button
//             onClick={handleZoomOut}
//             className="w-8 h-8 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full flex items-center justify-center transition-colors"
//           >
//             <span className="text-white font-bold">−</span>
//           </button>
//           <span className="text-white text-sm min-w-[3rem] text-center">
//             {Math.round(zoom * 100)}%
//           </span>
//           <button
//             onClick={handleZoomIn}
//             className="w-8 h-8 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full flex items-center justify-center transition-colors"
//           >
//             <span className="text-white font-bold">+</span>
//           </button>
//           <button
//             onClick={resetView}
//             className="ml-2 px-3 py-1 bg-white bg-opacity-20 hover:bg-opacity-30 rounded text-sm transition-colors"
//           >
//             Reset
//           </button>
//         </div>
//       </div>

//       {/* Floor Plan Container */}
//       <div
//         ref={containerRef}
//         className="relative h-96 md:h-[500px] overflow-hidden cursor-grab active:cursor-grabbing floor-plan-container"
//         onMouseDown={handleMouseDown}
//         onMouseMove={handleMouseMove}
//         onMouseUp={handleMouseUp}
//         onMouseLeave={handleMouseUp}
//       >
//         <motion.div
//           style={{
//             transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
//             transformOrigin: "center center",
//           }}
//           transition={{ type: "spring", stiffness: 300, damping: 30 }}
//           className="w-full h-full relative"
//         >
//           <Image
//             src={floor.planImage}
//             alt={`${floor.name} floor plan`}
//             fill
//             className="object-contain pointer-events-none select-none"
//             draggable={false}
//           />

//           {/* Apartment Markers */}
//           {floorApartments.map((apartment) => (
//             <button
//               key={apartment.id}
//               onClick={(e) => {
//                 e.stopPropagation();
//                 handleApartmentClick(apartment);
//               }}
//               className={`apartment-marker ${apartment.status}`}
//               style={{
//                 left: `${apartment.coordinates?.x || 50}px`,
//                 top: `${apartment.coordinates?.y || 50}px`,
//               }}
//               title={`${apartment.number} - ${apartment.type} - ${apartment.status}`}
//             >
//               <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-primary text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
//                 {apartment.number}
//               </div>
//             </button>
//           ))}
//         </motion.div>
//       </div>

//       {/* Floor Information */}
//       <div
//         className="p-4 bg-gray-50 border-t"
//         style={{ backgroundColor: "#F6F1EA" }}
//       >
//         <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
//           <div>
//             <div className="text-2xl font-bold text-accent">
//               {floorApartments.length}
//             </div>
//             <div className="text-sm text-gray-600" style={{ color: "#96796E" }}>
//               Total Units
//             </div>
//           </div>
//           <div>
//             <div className="text-2xl font-bold text-success">
//               {
//                 floorApartments.filter((apt) => apt.status === "available")
//                   .length
//               }
//             </div>
//             <div className="text-sm text-gray-600" style={{ color: "#96796E" }}>
//               Available
//             </div>
//           </div>
//           <div>
//             <div className="text-2xl font-bold text-sold">
//               {floorApartments.filter((apt) => apt.status === "sold").length}
//             </div>
//             <div className="text-sm text-gray-600" style={{ color: "#96796E" }}>
//               Sold
//             </div>
//           </div>
//           <div>
//             <div className="text-2xl font-bold text-primary">
//               {floorApartments.length > 0
//                 ? Math.round(
//                     (floorApartments.filter((apt) => apt.status === "sold")
//                       .length /
//                       floorApartments.length) *
//                       100
//                   )
//                 : 0}
//               %
//             </div>
//             <div className="text-sm text-gray-600" style={{ color: "#96796E" }}>
//               Sold Rate
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Usage Instructions */}
//       {floorApartments.length === 0 && (
//         <div className="p-6 text-center text-gray-500">
//           <p className="text-lg">No apartments available on this floor</p>
//           <p className="text-sm">
//             This floor contains common areas and facilities
//           </p>
//         </div>
//       )}
//     </div>
//   );
// };

// export default FloorPlanViewer;
