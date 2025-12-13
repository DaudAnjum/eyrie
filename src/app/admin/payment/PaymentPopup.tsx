"use client";

import { useEffect, useState } from "react";
import { FaTimes, FaPrint } from "react-icons/fa";
import {
  PAYMENT_CATEGORIES,
  PAYMENT_METHODS,
  PaymentCategory,
  calculateExpectedAmounts,
  calculateDueDate,
  fetchPaymentsForApartment,
  createPayment,
  isCategoryPayable,
  getNextPayableInstallment,
  getAllotmentPaidDate,
  getLastPaidDateForCategory,
  updateNotesForApartment,
} from "./paymentFunctions";

interface Apartment {
  id: string;
  number: string;
  type: string;
  floor_id: string;
  price: number;
  discounted_price?: number;
  alloted_date: string;
}

interface PaymentPopupProps {
  isOpen: boolean;
  onClose: () => void;
  client: {
    membership_number: string;
    client_name: string;
    CNIC: string;
    amount_payable: number;
    discount: number;
  };
  apartment: Apartment;
  onPaymentAdded?: () => void;
}

export default function PaymentPopup({
  isOpen,
  onClose,
  client,
  apartment,
  onPaymentAdded,
}: PaymentPopupProps) {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notes, setNotes] = useState("");
  const [initialNotes, setInitialNotes] = useState("");

  // Payment form state for each category
  const [paymentForms, setPaymentForms] = useState<{
    [key: string]: { amount: string; method: string };
  }>({});

  // Use discounted_price if available, otherwise fall back to base price
  const totalPayable = apartment.discounted_price || apartment.price || 0;
  const expectedAmounts = calculateExpectedAmounts(totalPayable);

  const totalReceived = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const remainingPayable = totalPayable - totalReceived;
  const progress = totalPayable ? (totalReceived / totalPayable) * 100 : 0;

  useEffect(() => {
    if (isOpen && client && apartment) {
      loadPayments();
    }
  }, [isOpen, client, apartment]);

  const loadPayments = async () => {
    setLoading(true);
    const result = await fetchPaymentsForApartment(
      client.membership_number,
      apartment.id
    );
    if (result.success) {
      setPayments(result.data);
      // Load notes from the first payment (all payments have the same notes)
      const existingNotes = result.data.length > 0 ? result.data[0].notes || "" : "";
      setNotes(existingNotes);
      setInitialNotes(existingNotes);
    }
    setLoading(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const capitalizeFloor = (floor: string) => {
    return floor.charAt(0).toUpperCase() + floor.slice(1);
  };

  const getExpectedAmount = (category: PaymentCategory, installmentNumber: number) => {
    switch (category) {
      case "booking":
        return expectedAmounts.booking;
      case "allotment":
        return expectedAmounts.allotment;
      case "monthly":
        return expectedAmounts.monthlyEach;
      case "half_yearly":
        return installmentNumber === 6
          ? expectedAmounts.halfYearlyHalf
          : expectedAmounts.halfYearlyFull;
      case "possession":
        return expectedAmounts.possession;
      default:
        return 0;
    }
  };

  const handlePay = async (category: PaymentCategory, installmentNumber: number) => {
    const formKey = `${category}_${installmentNumber}`;
    const form = paymentForms[formKey];

    if (!form?.amount || !form?.method) {
      alert("Please enter amount and select payment method");
      return;
    }

    const amount = parseFloat(form.amount);
    if (isNaN(amount) || amount <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    setSaving(true);

    // Calculate due date
    const allotmentPaidDate = getAllotmentPaidDate(payments);
    const previousPaidDate = getLastPaidDateForCategory(category, payments);
    const dueDate =
      allotmentPaidDate && installmentNumber > 1
        ? calculateDueDate(allotmentPaidDate, category, installmentNumber, previousPaidDate || undefined)
        : installmentNumber === 1 && allotmentPaidDate
        ? calculateDueDate(allotmentPaidDate, category, installmentNumber)
        : null;

    const result = await createPayment({
      client_membership: client.membership_number,
      apartment_id: apartment.id,
      payment_category: category,
      installment_number: installmentNumber,
      amount,
      payment_method: form.method,
      paid_date: new Date().toISOString(),
      due_date: dueDate,
      notes: notes || undefined,
    });

    if (result.success) {
      await loadPayments();
      setPaymentForms((prev) => ({ ...prev, [formKey]: { amount: "", method: "" } }));
      onPaymentAdded?.();
    } else {
      alert("Failed to save payment: " + result.error);
    }

    setSaving(false);
  };

  const handlePrintAll = () => {
    window.print();
  };

  const handleSave = async () => {
    // Check if notes have changed
    if (notes !== initialNotes) {
      setSaving(true);
      const result = await updateNotesForApartment(
        client.membership_number,
        apartment.id,
        notes
      );

      if (!result.success) {
        alert("Failed to save notes: " + result.error);
        setSaving(false);
        return;
      }
      setSaving(false);
    }

    // Close the popup
    onClose();
  };

  const renderPaymentRow = (
    category: PaymentCategory,
    installmentNumber: number,
    label: string
  ) => {
    const payment = payments.find(
      (p) => p.payment_category === category && p.installment_number === installmentNumber
    );
    const isPaid = !!payment;
    const expectedAmount = getExpectedAmount(category, installmentNumber);
    const formKey = `${category}_${installmentNumber}`;
    const form = paymentForms[formKey] || { amount: "", method: "" };

    const categoryPayable = isCategoryPayable(category, payments);
    const nextPayable = getNextPayableInstallment(category, payments);
    const isNextToPay = categoryPayable && nextPayable === installmentNumber;
    const isLocked = !isPaid && !isNextToPay;

    // Calculate due date for display
    const allotmentPaidDate = getAllotmentPaidDate(payments);
    const previousPaidDate = getLastPaidDateForCategory(category, payments);
    let displayDueDate = payment?.due_date;
    if (!isPaid && isNextToPay && allotmentPaidDate) {
      displayDueDate = calculateDueDate(
        allotmentPaidDate,
        category,
        installmentNumber,
        installmentNumber > 1 ? previousPaidDate || undefined : undefined
      );
    }

    return (
      <tr
        key={formKey}
        className={`border-b ${
          isPaid
            ? "bg-green-50"
            : isNextToPay
            ? "bg-white"
            : "bg-gray-100 opacity-60"
        }`}
      >
        <td className="px-3 py-2 text-sm">{label}</td>
        <td className="px-3 py-2 text-sm">
          {isPaid ? (
            <span className="font-medium">{formatCurrency(payment.amount)}</span>
          ) : isNextToPay ? (
            <div className="relative">
              {!form.amount && (
                <span className="absolute inset-0 flex items-center px-2 text-gray-400 text-sm pointer-events-none">
                  {formatCurrency(expectedAmount)}
                </span>
              )}
              <input
                type="text"
                value={form.amount}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, "");
                  setPaymentForms((prev) => ({
                    ...prev,
                    [formKey]: { ...form, amount: val },
                  }));
                }}
                onFocus={() => {
                  if (!form.amount) {
                    setPaymentForms((prev) => ({
                      ...prev,
                      [formKey]: { ...form, amount: "" },
                    }));
                  }
                }}
                className="w-32 border rounded px-2 py-1 text-sm bg-transparent"
              />
            </div>
          ) : (
            <span className="text-gray-400">{formatCurrency(expectedAmount)}</span>
          )}
        </td>
        <td className="px-3 py-2 text-sm">
          {category !== "booking" &&
          category !== "allotment" &&
          category !== "possession"
            ? formatDate(displayDueDate)
            : "-"}
        </td>
        <td className="px-3 py-2 text-sm">
          {isPaid ? (
            <span>{payment.payment_method}</span>
          ) : isNextToPay ? (
            <select
              value={form.method}
              onChange={(e) =>
                setPaymentForms((prev) => ({
                  ...prev,
                  [formKey]: { ...form, method: e.target.value },
                }))
              }
              className="border rounded px-2 py-1 text-sm"
            >
              <option value="">Select</option>
              {PAYMENT_METHODS.map((method) => (
                <option key={method} value={method}>
                  {method}
                </option>
              ))}
            </select>
          ) : (
            <span className="text-gray-400">-</span>
          )}
        </td>
        <td className="px-3 py-2 text-sm">
          {isPaid ? (
            <span className="text-green-600 font-medium">
              Paid ({formatDate(payment.paid_date)})
            </span>
          ) : isNextToPay ? (
            <button
              onClick={() => handlePay(category, installmentNumber)}
              disabled={saving}
              className="bg-[#98786d] text-white px-3 py-1 rounded text-sm hover:bg-[#7d645b] disabled:opacity-50"
            >
              {saving ? "Saving..." : "Pay"}
            </button>
          ) : (
            <span className="text-gray-400">Locked</span>
          )}
        </td>
      </tr>
    );
  };

  const renderSection = (category: PaymentCategory) => {
    const config = PAYMENT_CATEGORIES[category];
    const rows = [];

    for (let i = 1; i <= config.installments; i++) {
      const label =
        config.installments === 1
          ? config.label
          : `${config.label} ${i}${category === "half_yearly" && i === 6 ? " (Half)" : ""}`;
      rows.push(renderPaymentRow(category, i, label));
    }

    return rows;
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gray-50">
          <div>
            <h2 className="text-xl font-semibold text-[#98786d]">
              Payment Details
            </h2>
            <p className="text-sm text-gray-600">
              {client.client_name} - {client.membership_number}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrintAll}
              className="flex items-center gap-1 text-gray-600 hover:text-gray-800 px-3 py-1 border rounded"
            >
              <FaPrint /> Print
            </button>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 p-1"
            >
              <FaTimes size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Apartment & Summary Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Apartment Info */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-[#98786d] mb-2">Apartment</h3>
              <p className="text-sm">
                <span className="font-medium">{apartment.type}</span> - {apartment.number}
              </p>
              <p className="text-sm text-gray-600">
                {capitalizeFloor(apartment.floor_id)} Floor
              </p>
              <p className="text-sm text-gray-600">
                Allotted: {formatDate(apartment.alloted_date)}
              </p>
            </div>

            {/* Payment Summary */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-[#98786d] mb-2">Payment Summary</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Total Amount:</span>
                  <span className="font-medium">{formatCurrency(totalPayable)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Discount:</span>
                  <span>{client.discount || 0}%</span>
                </div>
                <div className="flex justify-between text-green-600">
                  <span>Total Received:</span>
                  <span className="font-medium">{formatCurrency(totalReceived)}</span>
                </div>
                <div className="flex justify-between text-red-600">
                  <span>Remaining Payable:</span>
                  <span className="font-medium">{formatCurrency(remainingPayable)}</span>
                </div>
              </div>
              {/* Progress Bar */}
              <div className="mt-3">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Progress</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full transition-all"
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading payments...</div>
          ) : (
            <>
              {/* Payments Table */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-[#98786d] text-white">
                      <th className="px-3 py-2 text-left text-sm font-medium">Installment</th>
                      <th className="px-3 py-2 text-left text-sm font-medium">Amount</th>
                      <th className="px-3 py-2 text-left text-sm font-medium">Due Date</th>
                      <th className="px-3 py-2 text-left text-sm font-medium">Method</th>
                      <th className="px-3 py-2 text-left text-sm font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Booking */}
                    <tr className="bg-gray-200">
                      <td colSpan={5} className="px-3 py-1 text-sm font-semibold text-[#98786d]">
                        Booking (15%)
                      </td>
                    </tr>
                    {renderSection("booking")}

                    {/* Allotment */}
                    <tr className="bg-gray-200">
                      <td colSpan={5} className="px-3 py-1 text-sm font-semibold text-[#98786d]">
                        Allotment (10%)
                      </td>
                    </tr>
                    {renderSection("allotment")}

                    {/* Monthly */}
                    <tr className="bg-gray-200">
                      <td colSpan={5} className="px-3 py-1 text-sm font-semibold text-[#98786d]">
                        Monthly Installments (40% - 33 months)
                      </td>
                    </tr>
                    {renderSection("monthly")}

                    {/* Half-Yearly */}
                    <tr className="bg-gray-200">
                      <td colSpan={5} className="px-3 py-1 text-sm font-semibold text-[#98786d]">
                        Half-Yearly Installments (25% - 5.5 installments)
                      </td>
                    </tr>
                    {renderSection("half_yearly")}

                    {/* On-Possession */}
                    <tr className="bg-gray-200">
                      <td colSpan={5} className="px-3 py-1 text-sm font-semibold text-[#98786d]">
                        On-Possession (10%)
                      </td>
                    </tr>
                    {renderSection("possession")}
                  </tbody>
                </table>
              </div>

              {/* Notes */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-[#98786d] mb-1">
                  Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add notes for this payment..."
                  className="w-full border rounded-md p-2 text-sm h-20 resize-none"
                />
              </div>
            </>
          )}
        </div>

        {/* Footer with Save and Cancel buttons */}
        <div className="flex items-center justify-end gap-3 p-4 border-t bg-gray-50">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-[#98786d] text-white rounded text-sm hover:bg-[#7d645b] disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
