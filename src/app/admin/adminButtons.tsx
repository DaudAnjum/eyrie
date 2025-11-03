"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FaHome, FaUsers, FaCreditCard } from "react-icons/fa";

export default function AdminButtons() {
  const pathname = usePathname();
  const cleanPath = pathname?.replace(/\/$/, ""); // 🔹 remove trailing slash

  const buttons = [
    {
      title: "Apartments Management",
      href: "/admin",
      bg: "bg-blue-600",
      icon: <FaHome className="w-8 h-8 ml-3" />,
    },
    {
      title: "Clients Management",
      href: "/admin/client",
      bg: "bg-green-600",
      icon: <FaUsers className="w-8 h-8 ml-3" />,
    },
    {
      title: "Payments Management",
      href: "/admin/payment",
      bg: "bg-orange-500",
      icon: <FaCreditCard className="w-8 h-8 ml-3" />,
    },
  ];

  let currentSection = "Dashboard";

  if (cleanPath?.startsWith("/admin/client")) {
    currentSection = "Clients Section";
  } else if (cleanPath?.startsWith("/admin/payment")) {
    currentSection = "Payments Section";
  } else if (cleanPath === "/admin") {
    currentSection = "Apartments Section";
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="flex flex-col items-center"
    >
      {/* Buttons */}
      <div className="flex flex-wrap gap-6 justify-center mt-8">
        {buttons.map((btn) => {
          const isActive = cleanPath === btn.href;
          return (
            <Link key={btn.href} href={btn.href}>
              <button
                className={`flex items-center justify-between px-10 py-6 rounded-xl transition-all duration-300 font-semibold text-xl ${
                  btn.bg
                } text-white
                  ${
                    isActive
                      ? "scale-105 border-b-4 border-r-4 border-primary shadow-lg"
                      : "border-b-4 border-r-4 border-transparent hover:shadow-lg hover:scale-105 opacity-95"
                  }`}
              >
                <span>{btn.title}</span>
                {btn.icon}
              </button>
            </Link>
          );
        })}
      </div>

      {/* Divider */}
      <div className="relative flex items-center justify-center mt-10 mb-16 w-full">
        <div className="absolute w-[80%] h-[3px] bg-gradient-to-r from-[#98786d] via-[#c8a89a] to-[#98786d] rounded-full"></div>
        <span className="relative bg-background px-4 text-[#98786d] font-semibold text-sm tracking-wide uppercase">
          {currentSection}
        </span>
      </div>
    </motion.div>
  );
}
