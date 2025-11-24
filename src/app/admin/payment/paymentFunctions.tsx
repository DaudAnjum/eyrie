"use client";

import { supabase } from "@/lib/supabaseClient";

// Payment categories and their configuration
export const PAYMENT_CATEGORIES = {
  booking: { label: "Booking", percentage: 0.15, installments: 1 },
  allotment: { label: "Allotment", percentage: 0.10, installments: 1 },
  monthly: { label: "Monthly", percentage: 0.40, installments: 33 },
  half_yearly: { label: "Half-Yearly", percentage: 0.25, installments: 6 },
  possession: { label: "On-Possession", percentage: 0.10, installments: 1 },
} as const;

export type PaymentCategory = keyof typeof PAYMENT_CATEGORIES;

export const PAYMENT_METHODS = ["Cash", "Bank Transfer", "Cheque", "Pay-order"] as const;

/**
 * Calculate expected amounts for each category
 */
export const calculateExpectedAmounts = (totalPayable: number) => {
  const booking = totalPayable * PAYMENT_CATEGORIES.booking.percentage;
  const allotment = totalPayable * PAYMENT_CATEGORIES.allotment.percentage;
  const monthlyTotal = totalPayable * PAYMENT_CATEGORIES.monthly.percentage;
  const monthlyEach = monthlyTotal / 33;
  const halfYearlyTotal = totalPayable * PAYMENT_CATEGORIES.half_yearly.percentage;
  const halfYearlyFull = halfYearlyTotal / 5.5;
  const halfYearlyHalf = halfYearlyFull / 2;
  const possession = totalPayable * PAYMENT_CATEGORIES.possession.percentage;

  return {
    booking,
    allotment,
    monthlyEach,
    halfYearlyFull,
    halfYearlyHalf,
    possession,
  };
};

/**
 * Calculate due date based on allotment paid date
 */
export const calculateDueDate = (
  allotmentPaidDate: string,
  category: PaymentCategory,
  installmentNumber: number,
  previousPaidDate?: string
): string | null => {
  if (category === "booking" || category === "allotment" || category === "possession") {
    return null;
  }

  const baseDate = previousPaidDate ? new Date(previousPaidDate) : new Date(allotmentPaidDate);
  const dueDate = new Date(baseDate);

  if (category === "monthly") {
    if (installmentNumber === 1) {
      dueDate.setMonth(dueDate.getMonth() + 1);
    } else {
      dueDate.setMonth(dueDate.getMonth() + 1);
    }
  } else if (category === "half_yearly") {
    if (installmentNumber === 1) {
      dueDate.setMonth(dueDate.getMonth() + 6);
    } else {
      dueDate.setMonth(dueDate.getMonth() + 6);
    }
  }

  return dueDate.toISOString();
};

/**
 * ================================
 * FETCH ALL CLIENTS WITH APARTMENT INFO
 * ================================
 */
export const fetchClientsWithApartments = async () => {
  try {
    const { data: clients, error: clientsError } = await supabase
      .from("clients")
      .select("*")
      .order("created_at", { ascending: false });

    if (clientsError) throw clientsError;

    const clientsWithDetails = await Promise.all(
      (clients || []).map(async (client) => {
        const { data: intermediateData } = await supabase
          .from("intermediate")
          .select(`
            apartment_id,
            alloted_date,
            discount_percentage,
            discounted_price,
            apartments (
              id,
              number,
              type,
              floor_id,
              price
            )
          `)
          .eq("client_membership", client.membership_number);

        const apartments = (intermediateData || []).map((item: any) => ({
          id: item.apartments?.id,
          number: item.apartments?.number,
          type: item.apartments?.type,
          floor_id: item.apartments?.floor_id,
          price: item.apartments?.price,
          discount: item.discount_percentage || 0,
          discounted_price: item.discounted_price || item.apartments?.price, // fallback to base price for old records
          alloted_date: item.alloted_date,
        }));

        const { data: payments } = await supabase
          .from("payments")
          .select("amount")
          .eq("client_membership", client.membership_number);

        const totalReceived = (payments || []).reduce(
          (sum, p) => sum + (p.amount || 0),
          0
        );

        // Use the amount_payable from database (discount already applied during create/edit)
        const totalPayable = client.amount_payable || 0;

        return {
          ...client,
          apartments,
          apartment_count: apartments.length,
          total_received: totalReceived,
          amount_payable: totalPayable,
          progress: totalPayable
            ? (totalReceived / totalPayable) * 100
            : 0,
        };
      })
    );

    return { success: true, data: clientsWithDetails };
  } catch (error: any) {
    console.error("Error fetching clients:", error.message);
    return { success: false, error: error.message, data: [] };
  }
};

/**
 * ================================
 * SEARCH CLIENTS
 * ================================
 */
export const searchClients = async (query: string) => {
  try {
    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .or(
        `membership_number.ilike.%${query}%,client_name.ilike.%${query}%,CNIC.ilike.%${query}%,passport_number.ilike.%${query}%,agent_name.ilike.%${query}%`
      )
      .order("created_at", { ascending: false });

    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    console.error("Error searching clients:", error.message);
    return { success: false, error: error.message, data: [] };
  }
};

/**
 * ================================
 * FETCH PAYMENTS FOR APARTMENT
 * ================================
 */
export const fetchPaymentsForApartment = async (
  clientMembership: string,
  apartmentId: string
) => {
  try {
    const { data, error } = await supabase
      .from("payments")
      .select("*")
      .eq("client_membership", clientMembership)
      .eq("apartment_id", apartmentId)
      .order("payment_category", { ascending: true })
      .order("installment_number", { ascending: true });

    if (error) throw error;
    return { success: true, data: data || [] };
  } catch (error: any) {
    console.error("Error fetching payments:", error.message);
    return { success: false, error: error.message, data: [] };
  }
};

/**
 * ================================
 * CREATE PAYMENT
 * ================================
 */
export const createPayment = async (payment: {
  client_membership: string;
  apartment_id: string;
  payment_category: string;
  installment_number: number;
  amount: number;
  payment_method: string;
  paid_date: string;
  due_date?: string | null;
  notes?: string;
}) => {
  try {
    const { data, error } = await supabase
      .from("payments")
      .insert([payment])
      .select();

    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    console.error("Error creating payment:", error.message);
    return { success: false, error: error.message };
  }
};

/**
 * ================================
 * GET PAYMENT PROGRESS FOR APARTMENT
 * ================================
 */
export const getPaymentProgress = async (
  clientMembership: string,
  apartmentId: string,
  totalPayable: number
) => {
  try {
    const { data: payments, error } = await supabase
      .from("payments")
      .select("*")
      .eq("client_membership", clientMembership)
      .eq("apartment_id", apartmentId);

    if (error) throw error;

    const totalReceived = (payments || []).reduce(
      (sum, p) => sum + (p.amount || 0),
      0
    );

    return {
      success: true,
      totalReceived,
      remainingPayable: totalPayable - totalReceived,
      progress: totalPayable ? (totalReceived / totalPayable) * 100 : 0,
      payments: payments || [],
    };
  } catch (error: any) {
    console.error("Error getting payment progress:", error.message);
    return {
      success: false,
      error: error.message,
      totalReceived: 0,
      remainingPayable: totalPayable,
      progress: 0,
      payments: [],
    };
  }
};

/**
 * ================================
 * CHECK IF CATEGORY IS PAYABLE
 * ================================
 */
export const isCategoryPayable = (
  category: PaymentCategory,
  payments: any[]
): boolean => {
  const bookingPaid = payments.some(
    (p) => p.payment_category === "booking" && p.installment_number === 1
  );
  const allotmentPaid = payments.some(
    (p) => p.payment_category === "allotment" && p.installment_number === 1
  );

  const monthlyPaidCount = payments.filter(
    (p) => p.payment_category === "monthly"
  ).length;
  const halfYearlyPaidCount = payments.filter(
    (p) => p.payment_category === "half_yearly"
  ).length;

  switch (category) {
    case "booking":
      return true;
    case "allotment":
      return bookingPaid;
    case "monthly":
    case "half_yearly":
      return allotmentPaid;
    case "possession":
      return monthlyPaidCount >= 33 && halfYearlyPaidCount >= 6;
    default:
      return false;
  }
};

/**
 * ================================
 * GET NEXT PAYABLE INSTALLMENT
 * ================================
 */
export const getNextPayableInstallment = (
  category: PaymentCategory,
  payments: any[]
): number => {
  const categoryPayments = payments.filter(
    (p) => p.payment_category === category
  );
  const paidNumbers = categoryPayments.map((p) => p.installment_number);

  const maxInstallments = PAYMENT_CATEGORIES[category].installments;

  for (let i = 1; i <= maxInstallments; i++) {
    if (!paidNumbers.includes(i)) {
      return i;
    }
  }

  return -1;
};

/**
 * ================================
 * GET ALLOTMENT PAID DATE
 * ================================
 */
export const getAllotmentPaidDate = (payments: any[]): string | null => {
  const allotmentPayment = payments.find(
    (p) => p.payment_category === "allotment" && p.installment_number === 1
  );
  return allotmentPayment?.paid_date || null;
};

/**
 * ================================
 * GET LAST PAID DATE FOR CATEGORY
 * ================================
 */
export const getLastPaidDateForCategory = (
  category: PaymentCategory,
  payments: any[]
): string | null => {
  const categoryPayments = payments
    .filter((p) => p.payment_category === category)
    .sort((a, b) => b.installment_number - a.installment_number);

  return categoryPayments[0]?.paid_date || null;
};
