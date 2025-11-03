"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  fetchPaymentsByMembership,
  upsertInstallments,
  markInstallmentPaid,
  markInstallmentUnpaid,
} from "./paymentFunctions";
import { format } from "date-fns";
import AdminButtons from "../adminButtons";

export default function PaymentsPage() {
  const [membership, setMembership] = useState("");
  const [client, setClient] = useState<any>(null);
  const [installments, setInstallments] = useState<any[]>([]);
  const [receiptOpen, setReceiptOpen] = useState(false);

  // installment plans as per your system
  const INSTALLMENT_PLANS = {
    "Monthly Plan": { count: 12, interval: 1 },
    "Half-Yearly Plan": { count: 2, interval: 6 },
    "Yearly Plan": { count: 1, interval: 12 },
  };

  const fetchClientData = async (membership_number: string) => {
    try {
      const { data: clientData, error } = await supabase
        .from("clients")
        .select("*")
        .eq("membership_number", membership_number)
        .single();

      if (error || !clientData) {
        alert("Client not found.");
        return;
      }

      setClient(clientData);

      // fetch existing payments
      const res = await fetchPaymentsByMembership(membership_number);
      const payments = res.success && Array.isArray(res.data) ? res.data : [];

      // determine plan details
      const plan =
        (clientData.installment_plan as keyof typeof INSTALLMENT_PLANS) ||
        "Monthly Plan";
      const config =
        INSTALLMENT_PLANS[plan] || INSTALLMENT_PLANS["Monthly Plan"];

      // get first paid installment as start date
      const firstPaid = payments.find((p) => (p.total_received || 0) > 0);
      const startDate = firstPaid ? new Date(firstPaid.created_at) : new Date();

      const amount =
        ((clientData.amount_payable || 0) - (clientData.discount || 0)) /
        config.count;

      const fullList = Array.from({ length: config.count }, (_, i) => {
        const existing = payments.find((p) => p.installment_number === i + 1);

        const due = new Date(startDate);
        due.setMonth(due.getMonth() + config.interval * i);

        return (
          existing || {
            client_membership: membership_number,
            installment_plan: plan,
            installment_number: i + 1,
            installment_amount: Math.round(amount),
            total_payment_received: 0,
            payment_left: Math.round(amount),
            payment_method: null,
            next_installment_date: format(due, "yyyy-MM-dd"),
          }
        );
      });

      setInstallments(fullList);
    } catch (err) {
      console.error(err);
      alert("Error fetching client data.");
    }
  };

  const handleTogglePaid = async (inst: any) => {
    if (!client) return;
    const membership_number = client.membership_number;

    if (inst.total_payment_received > 0) {
      const res = await markInstallmentUnpaid(
        membership_number,
        inst.installment_number,
        inst.installment_amount
      );
      if (!res.success) return alert(res.error);
      inst.total_payment_received = 0;
      inst.payment_left = inst.installment_amount;
      inst.payment_method = null;
    } else {
      if (!inst.payment_method)
        return alert("Please select a payment method first.");
      const res = await markInstallmentPaid(
        membership_number,
        inst.installment_number,
        inst.installment_amount,
        inst.payment_method
      );
      if (!res.success) return alert(res.error);
      inst.total_payment_received = inst.installment_amount;
      inst.payment_left = 0;
    }

    setInstallments([...installments]);
  };

  const handleSave = async () => {
    const res = await upsertInstallments(installments);
    if (!res.success) alert(res.error);
    else alert("Installments saved successfully.");
  };

  const totalPaid = installments.reduce(
    (sum, i) => sum + (i.total_payment_received || 0),
    0
  );

  const paidInstallments = installments.filter(
    (i) => i.total_payment_received > 0
  );

  return (
    <div className="p-6 space-y-6 bg-background min-h-screen">
      <h2 className="text-4xl font-semibold text-text mb-12 mt-12 text-center">
        Admin Dashboard
      </h2>
      <AdminButtons />

      <div className="container mx-auto px-6">
        <div className="flex space-x-2">
          <input
            type="text"
            value={membership}
            onChange={(e) => setMembership(e.target.value)}
            placeholder="Enter Membership Number"
            className="border p-2 rounded w-64"
          />
          <button
            onClick={() => fetchClientData(membership)}
            className="bg-[#98786d] text-white px-4 py-2 rounded"
          >
            Fetch Client
          </button>
        </div>

        {client && (
          <>
            <div className="border p-4 rounded bg-gray-50">
              <h2 className="text-xl font-medium mb-2 text-[#98786d]">
                Client Details
              </h2>
              <p>
                <strong>Name:</strong> {client.client_name}
              </p>
              <p>
                <strong>CNIC:</strong> {client.CNIC}
              </p>
              <p>
                <strong>Membership #:</strong> {client.membership_number}
              </p>
              <p>
                <strong>Installment Plan:</strong> {client.installment_plan}
              </p>
              <p>
                <strong>Total Payable:</strong> {client.amount_payable}
              </p>
            </div>

            <table className="w-full border mt-4 bg-background">
              <thead className="bg-gray-100">
                <tr>
                  <th>#</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Due Date</th>
                  <th>Payment Method</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {installments.map((inst, i) => (
                  <tr key={i} className="border-t text-center">
                    <td>{inst.installment_number}</td>
                    <td>{inst.installment_amount}</td>
                    <td>
                      {inst.total_payment_received > 0 ? (
                        <span className="text-green-600 font-semibold">
                          Paid
                        </span>
                      ) : (
                        <span className="text-red-500 font-semibold">
                          Unpaid
                        </span>
                      )}
                    </td>
                    <td>{inst.next_installment_date}</td>
                    <td>
                      <select
                        value={inst.payment_method || ""}
                        onChange={(e) => {
                          inst.payment_method = e.target.value;
                          setInstallments([...installments]);
                        }}
                        className="border p-1 rounded"
                      >
                        <option value="">Select</option>
                        <option value="Cash">Cash</option>
                        <option value="Bank Transfer">Bank Transfer</option>
                        <option value="Credit Card">Credit Card</option>
                      </select>
                    </td>
                    <td>
                      <button
                        onClick={() => handleTogglePaid(inst)}
                        className={`px-3 py-1 rounded text-white ${
                          inst.total_payment_received > 0
                            ? "bg-red-500"
                            : "bg-green-600"
                        }`}
                      >
                        {inst.total_payment_received > 0
                          ? "Mark Unpaid"
                          : "Mark Paid"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex justify-between items-center mt-4">
              <div>
                <p>
                  <strong>Total Payable:</strong> {client.amount_payable}
                </p>
                <p>
                  <strong>Total Paid:</strong> {totalPaid}
                </p>
              </div>
              <div className="space-x-2">
                <button
                  onClick={handleSave}
                  className="bg-[#98786d] text-white px-4 py-2 rounded"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => setReceiptOpen(true)}
                  className="bg-gray-700 text-white px-4 py-2 rounded"
                >
                  Print Receipt
                </button>
              </div>
            </div>
          </>
        )}

        {receiptOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded shadow-lg w-[600px] relative">
              <button
                onClick={() => setReceiptOpen(false)}
                className="absolute top-2 right-2 text-gray-600 hover:text-black"
              >
                ✕
              </button>
              <h2 className="text-xl font-semibold mb-4">Payment Receipt</h2>
              {client && (
                <div className="mb-4">
                  <p>
                    <strong>Client Name:</strong> {client.client_name}
                  </p>
                  <p>
                    <strong>CNIC:</strong> {client.CNIC}
                  </p>
                  <p>
                    <strong>Membership #:</strong> {client.membership_number}
                  </p>
                  <p>
                    <strong>Total Paid:</strong> {totalPaid}
                  </p>
                </div>
              )}
              <table className="w-full border text-center">
                <thead className="bg-gray-100">
                  <tr>
                    <th>#</th>
                    <th>Amount</th>
                    <th>Payment Method</th>
                    <th>Paid Date</th>
                  </tr>
                </thead>
                <tbody>
                  {paidInstallments.map((inst, i) => (
                    <tr key={i} className="border-t">
                      <td>{inst.installment_number}</td>
                      <td>{inst.installment_amount}</td>
                      <td>{inst.payment_method}</td>
                      <td>
                        {inst.created_at
                          ? format(new Date(inst.created_at), "yyyy-MM-dd")
                          : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button
                onClick={() => window.print()}
                className="mt-4 bg-blue-600 text-white px-4 py-2 rounded"
              >
                Print
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
