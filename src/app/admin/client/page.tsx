"use client";

import { useEffect, useState } from "react";
import { fetchClients } from "./clientFunctions";
import CreateClientSection from "./createClientSection";
import EditClientSection from "./editClientSection";
import ViewClientSection from "./viewClientSection";
import { motion, AnimatePresence } from "framer-motion";
import { FaPlus, FaEdit, FaTimes } from "react-icons/fa";
import { usePathname } from "next/navigation";
import AdminButtons from "../adminButtons";

const ClientPage = () => {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const [selectedClient, setSelectedClient] = useState<any | null>(null);

  const [searchTerm, setSearchTerm] = useState("");

  // ✅ Fetch all clients on mount
  const loadClients = async () => {
    setLoading(true);
    const result = await fetchClients();
    if (result.success && result.data) {
      setClients(result.data);
    } else {
      setError(result.error || "Failed to fetch clients.");
    }
    setLoading(false);
  };
  useEffect(() => {
    loadClients();
  }, []);

  const handleClientClick = (client: any) => {
    setSelectedClient(client);
    setShowViewModal(true);
  };

  const handleClientCreated = async () => {
    await loadClients();
  };

  const handleClientUpdated = async () => {
    await loadClients();
  };

  const pathname = usePathname();

  return (
    <div className="p-24 bg-background">
      <h2 className="text-4xl font-semibold text-text mb-12 mt-12 text-center">
        Admin Dashboard
      </h2>
      <AdminButtons />
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          {/* Table Section */}
          <div className="bg-white rounded-lg shadow overflow-x-auto p-4 md:p-6 mt-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
              {/* Search Bar */}
              <input
                type="text"
                placeholder="Search by name, membership number, or apartment..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full md:w-1/2 border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-text focus:outline-none"
              />

              <button
                onClick={() => setShowCreateModal(true)}
                className="btn btn-secondary text-sm gap-2"
              >
                <FaPlus /> Create Client
              </button>
            </div>

            {loading ? (
              <p className="p-4 text-gray-500">Loading clients...</p>
            ) : error ? (
              <p className="p-4 text-red-500">{error}</p>
            ) : clients.length === 0 ? (
              <p className="p-4 text-gray-500">No clients found.</p>
            ) : (
              <table className="min-w-full border-collapse">
                <thead>
                  <tr className="bg-background text-left text-text md-5 shadow">
                    <th className="p-3 border-b ">Membership #</th>
                    <th className="p-3 border-b ">Client Name</th>
                    <th className="p-3 border-b ">CNIC</th>
                    <th className="p-3 border-b ">Apartment Type • Floor</th>
                    <th className="p-3 border-b ">Status</th>
                    <th className="p-3 border-b text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {clients
                    .filter((client) => {
                      if (!searchTerm.trim()) return true; // show all when empty
                      const term = searchTerm.toLowerCase();
                      return (
                        client.client_name?.toLowerCase().includes(term) ||
                        client.membership_number
                          ?.toLowerCase()
                          .includes(term) ||
                        client.apartment_info?.toLowerCase().includes(term)
                      );
                    })
                    .map((client) => (
                      <tr
                        key={client.membership_number}
                        onClick={() => handleClientClick(client)}
                        className="hover:bg-[#fdf7f5] cursor-pointer transition"
                      >
                        <td className="p-3 border-b">
                          {client.membership_number}
                        </td>
                        <td className="p-3 border-b">{client.client_name}</td>
                        <td className="p-3 border-b">{client.CNIC}</td>
                        <td className="p-3 border-b">
                          {client.apartment_info}
                        </td>
                        <td
                          className={`p-3 border-b font-medium ${
                            client.status === "Active"
                              ? "text-green-600"
                              : client.status === "Inactive"
                              ? "text-red-600"
                              : "text-gray-500"
                          }`}
                        >
                          {client.status}
                        </td>
                        <td className="p-3 border-b text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedClient(client);
                              setShowEditModal(true);
                            }}
                            className="text-[#98786d] hover:text-[#7d645b]"
                          >
                            <FaEdit />
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Create Client Modal */}
          <AnimatePresence>
            {showCreateModal && (
              <Modal onClose={() => setShowCreateModal(false)}>
                <CreateClientSection
                  onClose={() => setShowCreateModal(false)}
                  onClientCreated={handleClientCreated}
                />
              </Modal>
            )}
          </AnimatePresence>

          {/* View Client Modal */}
          <AnimatePresence>
            {showViewModal && selectedClient && (
              <Modal onClose={() => setShowViewModal(false)}>
                <ViewClientSection
                  client={selectedClient}
                  onClose={() => setShowViewModal(false)}
                />
              </Modal>
            )}
          </AnimatePresence>

          {/* Edit Client Modal */}
          <AnimatePresence>
            {showEditModal && selectedClient && (
              <Modal onClose={() => setShowEditModal(false)}>
                <EditClientSection
                  client={selectedClient}
                  onClose={() => setShowEditModal(false)}
                  onClientUpdated={handleClientUpdated}
                />
              </Modal>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
};

// ✅ Simple reusable modal wrapper
const Modal = ({
  children,
  onClose,
}: {
  children: any;
  onClose: () => void;
}) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    onClick={onClose} // <- clicking the background closes the modal
  >
    <motion.div
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.95, opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={(e) => e.stopPropagation()} // <- prevent close when clicking inside
      className="bg-white rounded-xl shadow-xl p-8 w-full max-w-4xl relative overflow-y-auto max-h-[90vh]"
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-gray-500 hover:text-gray-800"
      >
        <FaTimes size={18} />
      </button>
      {children}
    </motion.div>
  </motion.div>
);

export default ClientPage;
