// /app/admin/payments/paymentFunctions.tsx

"use client";

import { supabase } from "@/lib/supabaseClient";

/**
 * ================================
 * FETCH PAYMENTS BY MEMBERSHIP
 * ================================
 */
export const fetchPaymentsByMembership = async (membership_number: string) => {
  try {
    const { data, error } = await supabase
      .from("payments")
      .select("*")
      .eq("client_membership", membership_number)
      .order("installment_number", { ascending: true });

    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    console.error("❌ Error fetching payments:", error.message);
    return { success: false, error: error.message };
  }
};

/**
 * ================================
 * UPSERT MULTIPLE INSTALLMENTS
 * ================================
 */
export const upsertInstallments = async (rows: any[]) => {
  try {
    const { error } = await supabase.from("payments").upsert(rows, {
      onConflict: "client_membership, installment_number",
    });

    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    console.error("❌ Error upserting installments:", error.message);
    return { success: false, error: error.message };
  }
};

/**
 * ================================
 * MARK INSTALLMENT AS PAID
 * ================================
 */
export const markInstallmentPaid = async (
  membership_number: string,
  installment_number: number,
  amount: number,
  method: string
) => {
  try {
    const { error } = await supabase.from("payments").upsert(
      [
        {
          client_membership: membership_number,
          installment_number,
          total_received: amount,
          payment_left: 0,
          payment_method: method,
        },
      ],
      { onConflict: "client_membership, installment_number" }
    );

    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    console.error("❌ Error marking installment paid:", error.message);
    return { success: false, error: error.message };
  }
};

/**
 * ================================
 * MARK INSTALLMENT AS UNPAID
 * ================================
 */
export const markInstallmentUnpaid = async (
  membership_number: string,
  installment_number: number,
  amount: number
) => {
  try {
    const { error } = await supabase.from("payments").upsert(
      [
        {
          client_membership: membership_number,
          installment_number,
          total_received: 0,
          payment_left: amount,
          payment_method: null,
        },
      ],
      { onConflict: "client_membership, installment_number" }
    );

    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    console.error("❌ Error marking installment unpaid:", error.message);
    return { success: false, error: error.message };
  }
};
