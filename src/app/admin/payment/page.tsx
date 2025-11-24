"use client";

import { useEffect, useState } from "react";
import { FaSearch } from "react-icons/fa";
import AdminButtons from "../adminButtons";
import ClientCard from "./ClientCard";
import ApartmentSelectPopup from "./ApartmentSelectPopup";
import PaymentPopup from "./PaymentPopup";
import { fetchClientsWithApartments, searchClients } from "./paymentFunctions";

interface Apartment {
  id: string;
  number: string;
  type: string;
  floor_id: string;
  price: number;
  discounted_price?: number;
  alloted_date: string;
}

interface ClientWithDetails {
  membership_number: string;
  client_name: string;
  CNIC: string;
  passport_number: string;
  agent_name: string;
  amount_payable: number;
  discount: number;
  apartments: Apartment[];
  apartment_count: number;
  total_received: number;
  progress: number;
}

export default function PaymentsPage() {
  const [clients, setClients] = useState<ClientWithDetails[]>([]);
  const [filteredClients, setFilteredClients] = useState<ClientWithDetails[]>(
    []
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  // Popup states
  const [selectedClient, setSelectedClient] =
    useState<ClientWithDetails | null>(null);
  const [selectedApartment, setSelectedApartment] = useState<Apartment | null>(
    null
  );
  const [showApartmentPopup, setShowApartmentPopup] = useState(false);
  const [showPaymentPopup, setShowPaymentPopup] = useState(false);

  useEffect(() => {
    loadClients();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredClients(clients);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = clients.filter(
        (client) =>
          client.membership_number?.toLowerCase().includes(query) ||
          client.client_name?.toLowerCase().includes(query) ||
          client.CNIC?.toLowerCase().includes(query) ||
          client.passport_number?.toLowerCase().includes(query) ||
          client.agent_name?.toLowerCase().includes(query)
      );
      setFilteredClients(filtered);
    }
  }, [searchQuery, clients]);

  const loadClients = async () => {
    setLoading(true);
    const result = await fetchClientsWithApartments();
    if (result.success && result.data) {
      setClients(result.data as ClientWithDetails[]);
      setFilteredClients(result.data as ClientWithDetails[]);
    }
    setLoading(false);
  };

  const handleClientClick = (client: ClientWithDetails) => {
    setSelectedClient(client);

    if (client.apartments.length === 1) {
      // Single apartment - go directly to payment popup
      setSelectedApartment(client.apartments[0]);
      setShowPaymentPopup(true);
    } else if (client.apartments.length > 1) {
      // Multiple apartments - show selection popup
      setShowApartmentPopup(true);
    } else {
      alert("No apartments found for this client");
    }
  };

  const handleApartmentSelect = (apartment: Apartment) => {
    setSelectedApartment(apartment);
    setShowApartmentPopup(false);
    setShowPaymentPopup(true);
  };

  const handleClosePopups = () => {
    setShowApartmentPopup(false);
    setShowPaymentPopup(false);
    setSelectedClient(null);
    setSelectedApartment(null);
  };

  const handlePaymentAdded = () => {
    // Refresh client list to update progress
    loadClients();
  };

  return (
    <div className="p-24 bg-background min-h-screen">
      <h2 className="text-4xl font-semibold text-text mb-12 mt-12 text-center">
        Admin Dashboard
      </h2>
      <AdminButtons />

      <div className="container mx-auto px-6">
        {/* Main Content Container */}
        <div className="bg-white rounded-lg shadow overflow-hidden p-4 md:p-6 mt-4">
          {/* Search Bar */}
          <div className="relative mb-6">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaSearch className="text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, membership, CNIC, passport, or agent..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#98786d] focus:outline-none"
            />
          </div>

          {/* Loading State */}
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-[#98786d] border-t-transparent"></div>
              <p className="mt-2 text-gray-600">Loading clients...</p>
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              {searchQuery
                ? "No clients found matching your search"
                : "No clients found"}
            </div>
          ) : (
            /* Client Cards Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredClients.map((client) => (
                <ClientCard
                  key={client.membership_number}
                  client={client}
                  onClick={() => handleClientClick(client)}
                />
              ))}
            </div>
          )}

          {/* Results Count */}
          {!loading && (
            <div className="mt-4 text-sm text-gray-500 text-center">
              Showing {filteredClients.length} of {clients.length} clients
            </div>
          )}
        </div>
      </div>

      {/* Apartment Selection Popup */}
      {selectedClient && (
        <ApartmentSelectPopup
          isOpen={showApartmentPopup}
          onClose={handleClosePopups}
          apartments={selectedClient.apartments}
          clientName={selectedClient.client_name}
          onSelectApartment={handleApartmentSelect}
        />
      )}

      {/* Payment Popup */}
      {selectedClient && selectedApartment && (
        <PaymentPopup
          isOpen={showPaymentPopup}
          onClose={handleClosePopups}
          client={selectedClient}
          apartment={selectedApartment}
          onPaymentAdded={handlePaymentAdded}
        />
      )}
    </div>
  );
}
