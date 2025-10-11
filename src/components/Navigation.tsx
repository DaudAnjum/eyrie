"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useAppStore } from "@/lib/store";

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, setUser } = useAppStore();

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/logout", { method: "POST" });
      setUser(null); // clear user from store
      setIsOpen(false);
      window.location.href = "/admin/login"; // redirect after logout
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const navItems = [
    { href: "https://impetus.com.pk/", label: "Home" },
    { href: "/", label: "Floor Plans" },
  ];

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-6">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">E</span>
            </div>
            <span className="font-bold text-xl text-primary">Eyrie</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-primary hover:text-accent transition-colors duration-300 font-medium"
              >
                {item.label}
              </Link>
            ))}

            {user?.role === "admin" ? (
              <div className="flex items-center space-x-4">
                <Link
                  href="/admin"
                  className="text-primary hover:text-accent transition-colors duration-300 font-medium"
                >
                  Admin Panel
                </Link>
                <button
                  onClick={handleLogout}
                  className="btn btn-primary text-sm"
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link href="/admin/login" className="btn btn-primary text-sm">
                Admin Login
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden flex items-center justify-center w-8 h-8"
          >
            <div className="flex flex-col space-y-1">
              <span
                className={`block w-6 h-0.5 bg-primary transition-all duration-300 ${
                  isOpen ? "rotate-45 translate-y-1.5" : ""
                }`}
              ></span>
              <span
                className={`block w-6 h-0.5 bg-primary transition-all duration-300 ${
                  isOpen ? "opacity-0" : ""
                }`}
              ></span>
              <span
                className={`block w-6 h-0.5 bg-primary transition-all duration-300 ${
                  isOpen ? "-rotate-45 -translate-y-1.5" : ""
                }`}
              ></span>
            </div>
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden pb-4"
          >
            <div className="flex flex-col space-y-4">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-primary hover:text-accent transition-colors duration-300 font-medium py-2"
                  onClick={() => setIsOpen(false)}
                >
                  {item.label}
                </Link>
              ))}

              {user?.role === "admin" ? (
                <div className="flex flex-col space-y-2 pt-2 border-t border-gray-200">
                  <Link
                    href="/admin"
                    className="text-primary hover:text-accent transition-colors duration-300 font-medium py-2"
                    onClick={() => setIsOpen(false)}
                  >
                    Admin Panel
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="btn btn-primary text-sm w-fit"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <div className="pt-2 border-t border-gray-200">
                  <Link
                    href="/admin/login"
                    className="btn btn-primary text-sm w-fit"
                    onClick={() => setIsOpen(false)}
                  >
                    Admin Login
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
