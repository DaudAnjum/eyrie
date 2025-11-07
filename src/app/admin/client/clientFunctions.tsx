"use client";

import { supabase } from "@/lib/supabaseClient";
import { Client } from "@/types";

/**
 * ================================
 * CREATE CLIENT
 * ================================
 */
export const createClient = async (clientData: any) => {
  try {
    // Step 1: Find apartment by floor_id and apartment number
    const { data: apartment, error: aptError } = await supabase
      .from("apartments")
      .select("id")
      .eq("floor_id", clientData.floor_id)
      .eq("number", clientData.apartment_number)
      .single();

    if (aptError || !apartment) {
      console.error("❌ Apartment not found:", aptError?.message);
      return { success: false, error: "Apartment not found" };
    }

    // Step 2: Insert client using the found apartment.id
    const { data, error } = await supabase
      .from("clients")
      .insert([
        {
          membership_number: clientData.membership_number,
          client_name: clientData.client_name,
          CNIC: clientData.CNIC,
          passport_number: clientData.passport_number,
          address: clientData.address,
          email: clientData.email,
          contact_number: clientData.contact_number,
          other_contact: clientData.other_contact,
          next_of_kin: clientData.next_of_kin,
          apartment_id: apartment.id,
          discount: clientData.discount,
          amount_payable: clientData.amount_payable,
          installment_plan: clientData.installment_plan,
          agent_name: clientData.agent_name,
          status: clientData.status,
          client_image: clientData.client_image || null,
          documents: clientData.documents || [],
          relevent_notice: clientData.relevent_notice || [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select();

    if (error) throw error;

    return { success: true, data };
  } catch (error: any) {
    console.error("❌ Error creating client:", error.message);
    return { success: false, error: error.message };
  }
};

/**
 * ================================
 * FETCH ALL CLIENTS
 * ================================
 */
export const fetchClients = async () => {
  try {
    const { data, error } = await supabase
      .from("clients")
      .select(
        `
        *,
        apartments (
          type,
          floor_id
        )
      `
      )
      .order("created_at", { ascending: false });

    if (error) throw error;

    // ✅ Flatten nested apartment info
    const transformed = data.map((client) => ({
      ...client,
      apartment_info: client.apartments
        ? `${client.apartments.type || "N/A"} • ${
            client.apartments.floor_id || "Unknown Floor"
          }`
        : "N/A",
      apartment_type: client.apartments?.type || "N/A",
      floor_name: client.apartments?.floor_id || "Unknown Floor",
    }));

    return { success: true, data: transformed };
  } catch (error: any) {
    console.error("❌ Error fetching clients:", error.message);
    return { success: false, error: error.message };
  }
};

/**
 * ================================
 * UPDATE CLIENT
 * ================================
 */
export const updateClient = async (
  membership_number: string,
  updatedData: Partial<Client>
) => {
  try {
    const { data, error } = await supabase
      .from("clients")
      .update({
        ...updatedData,
        updated_at: new Date().toISOString(),
      })
      .eq("membership_number", membership_number)
      .select();

    if (error) throw error;

    return { success: true, data };
  } catch (error: any) {
    console.error("❌ Error updating client:", error.message);
    return { success: false, error: error.message };
  }
};

/**
 * ================================
 * SEARCH CLIENTS
 * ================================
 * Searches by client name, CNIC, or membership number.
 */
export const searchClients = async (query: string) => {
  try {
    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .or(
        `client_name.ilike.%${query}%,CNIC.ilike.%${query}%,membership_number.ilike.%${query}%`
      )
      .order("created_at", { ascending: false });

    if (error) throw error;

    return { success: true, data };
  } catch (error: any) {
    console.error("❌ Error searching clients:", error.message);
    return { success: false, error: error.message };
  }
};

export const getNextMembershipNumber = async (): Promise<string> => {
  try {
    const { data, error } = await supabase
      .from("clients")
      .select("membership_number")
      .not("membership_number", "is", null);

    if (error) {
      console.error("Error fetching last membership number:", error.message);
      return "EA-1";
    }

    if (!data || data.length === 0) {
      return "EA-1"; // no clients yet
    }

    // Extract numeric part safely
    const numbers = data
      .map((c) => {
        const match = c.membership_number?.match(/EA-(\d+)/);
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter((n) => !isNaN(n));

    const maxNum = Math.max(...numbers);
    return `EA-${maxNum + 1}`;
  } catch (err: any) {
    console.error("Unexpected error fetching membership number:", err.message);
    return "EA-1";
  }
};

export async function uploadFile(bucket: string, file: File) {
  try {
    const filePath = `${Date.now()}-${file.name}`;
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file);

    if (error) {
      console.error("Upload error:", error);
      return null;
    }

    const { data: publicUrl } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return publicUrl?.publicUrl || null;
  } catch (err) {
    console.error("Unexpected upload error:", err);
    return null;
  }
}

export async function uploadMultipleFiles(bucket: string, files: File[]) {
  const urls: string[] = [];
  for (const file of files) {
    console.log(`Uploading to bucket: ${bucket}, file: ${file.name}`);

    const url = await uploadFile(bucket, file);
    if (url) urls.push(url);
  }
  return urls;
}
