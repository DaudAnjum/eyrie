"use client";

import { supabase } from "@/lib/supabaseClient";
import { Client, IntermediateWithApartment, ClientApartment } from "@/types";
import { Database } from "@/lib/database.types";

/**
 * ================================
 * CREATE CLIENT
 * ================================
 */

export const createClient = async (clientData: any) => {
  try {
    // 🧠 Step 1: Support multiple apartments (convert to array)
    // clientData.apartments will be an array of { floor_id, apartment_number, discount }
    // We'll resolve each one to its apartment.id from Supabase and calculate discounted_price

    const apartmentDetails: Array<{ id: string; price: number; discount_percentage: number; discounted_price: number }> = [];

    if (
      Array.isArray(clientData.apartments) &&
      clientData.apartments.length > 0
    ) {
      for (const apt of clientData.apartments) {
        const { data: apartment, error: aptError } = await supabase
          .from("apartments")
          .select("id, price")
          .eq("floor_id", apt.floor_id)
          .eq("number", apt.apartment_number)
          .single();

        if (apartment && !aptError) {
          const basePrice = apartment.price || 0;
          const discountPercentage = Number(apt.discount) || 0;
          const discountedPrice = basePrice - (basePrice * discountPercentage / 100);

          apartmentDetails.push({
            id: apartment.id,
            price: basePrice,
            discount_percentage: discountPercentage,
            discounted_price: Math.round(discountedPrice),
          });
        } else {
          console.warn(
            `⚠️ Apartment not found for floor ${apt.floor_id}, number ${apt.apartment_number}`
          );
        }
      }
    } else if (clientData.floor_id && clientData.apartment_number) {
      // Fallback (old single-apartment form)
      const { data: apartment, error: aptError } = await supabase
        .from("apartments")
        .select("id, price")
        .eq("floor_id", clientData.floor_id)
        .eq("number", clientData.apartment_number)
        .single();

      if (apartment && !aptError) {
        const basePrice = apartment.price || 0;
        const discountPercentage = 0;
        const discountedPrice = basePrice;

        apartmentDetails.push({
          id: apartment.id,
          price: basePrice,
          discount_percentage: discountPercentage,
          discounted_price: Math.round(discountedPrice),
        });
      }
    }

    if (apartmentDetails.length === 0) {
      console.error("❌ No valid apartments found for client.");
      return { success: false, error: "No valid apartments found." };
    }

    // 🧩 Step 2: Insert client WITHOUT apartment_ids
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
          amount_payable: clientData.amount_payable,
          agent_name: clientData.agent_name,
          status: clientData.status,
          client_image: clientData.client_image || null,
          documents: clientData.documents || [],
          relevent_notice: clientData.relevent_notice || [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          notes: clientData.notes || "",
        },
      ])
      .select();

    if (error) throw error;

    // 🆕 Step 3: Insert into intermediate table with today's date, discount_percentage, and discounted_price
    const today = new Date().toISOString();
    const intermediateRecords = apartmentDetails.map((apt) => ({
      client_membership: clientData.membership_number,
      apartment_id: apt.id,
      alloted_date: today,
      discount_percentage: apt.discount_percentage,
      discounted_price: apt.discounted_price,
    }));

    const { error: intermediateError } = await supabase
      .from("intermediate")
      .insert(intermediateRecords);

    if (intermediateError) {
      console.error("❌ Error inserting into intermediate table:", intermediateError);
      throw intermediateError;
    }

    // 🆕 Step 4: Update apartment status to 'sold'
    const apartmentIds = apartmentDetails.map((apt) => apt.id);
    const { error: statusError } = await supabase
      .from("apartments")
      .update({ status: "sold" })
      .in("id", apartmentIds);

    if (statusError) {
      console.error("❌ Error updating apartment status:", statusError);
      throw statusError;
    }

    return { success: true, data };
  } catch (error: any) {
    console.error("❌ Error creating client:", error.message);
    return { success: false, error: error.message };
  }
};

// export const createClient = async (clientData: any) => {
//   try {
//     // Step 1: Find apartment by floor_id and apartment number
//     const { data: apartment, error: aptError } = await supabase
//       .from("apartments")
//       .select("id")
//       .eq("floor_id", clientData.floor_id)
//       .eq("number", clientData.apartment_number)
//       .single();

//     if (aptError || !apartment) {
//       console.error("❌ Apartment not found:", aptError?.message);
//       return { success: false, error: "Apartment not found" };
//     }

//     // Step 2: Insert client using the found apartment.id
//     const { data, error } = await supabase
//       .from("clients")
//       .insert([
//         {
//           membership_number: clientData.membership_number,
//           client_name: clientData.client_name,
//           CNIC: clientData.CNIC,
//           passport_number: clientData.passport_number,
//           address: clientData.address,
//           email: clientData.email,
//           contact_number: clientData.contact_number,
//           other_contact: clientData.other_contact,
//           next_of_kin: clientData.next_of_kin,
//           apartment_id: apartment.id,
//           discount: clientData.discount,
//           amount_payable: clientData.amount_payable,
// //           agent_name: clientData.agent_name,
//           status: clientData.status,
//           client_image: clientData.client_image || null,
//           documents: clientData.documents || [],
//           relevent_notice: clientData.relevent_notice || [],
//           created_at: new Date().toISOString(),
//           updated_at: new Date().toISOString(),
//           notes: clientData.notes || "",
//         },
//       ])
//       .select();

//     if (error) throw error;

//     return { success: true, data };
//   } catch (error: any) {
//     console.error("❌ Error creating client:", error.message);
//     return { success: false, error: error.message };
//   }
// };

/**
 * ================================
 * GET CLIENT APARTMENTS
 * ================================
 * Fetches all apartments for a client with alloted dates from intermediate table
 */
export const getClientApartments = async (
  membership_number: string
): Promise<{ success: boolean; data: ClientApartment[]; error?: string }> => {
  try {
    const { data, error } = await supabase
      .from("intermediate")
      .select(
        `
        id,
        apartment_id,
        alloted_date,
        discount_percentage,
        discounted_price,
        apartments (
          id,
          number,
          type,
          floor_id,
          price,
          area,
          bedrooms,
          bathrooms
        )
      `
      )
      .eq("client_membership", membership_number);

    if (error) throw error;

    // Transform to flatten the nested structure
    const apartments: ClientApartment[] = (data as unknown as IntermediateWithApartment[])?.map((record) => ({
      id: record.apartments.id,
      number: record.apartments.number,
      type: record.apartments.type,
      floor_id: record.apartments.floor_id,
      price: record.apartments.price,
      discount: (record as any).discount_percentage || 0, // discount percentage per apartment
      discounted_price: (record as any).discounted_price || record.apartments.price, // fallback to base price for old records
      area: record.apartments.area,
      bedrooms: record.apartments.bedrooms,
      bathrooms: record.apartments.bathrooms,
      alloted_date: record.alloted_date,
      intermediate_id: record.id,
    })) || [];

    return { success: true, data: apartments };
  } catch (error: any) {
    console.error("❌ Error fetching client apartments:", error.message);
    return { success: false, error: error.message, data: [] };
  }
};

/**
 * ================================
 * FETCH ALL CLIENTS
 * ================================
 */
export const fetchClients = async () => {
  try {
    const { data: clients, error } = await supabase
      .from("clients")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    // For each client, fetch their apartments through intermediate table
    const clientsWithApartments = await Promise.all(
      clients.map(async (client) => {
        const { data: apartmentData } = await getClientApartments(client.membership_number);

        // Create summary info (first apartment if multiple)
        const firstApt = apartmentData?.[0];
        const apartmentCount = apartmentData?.length || 0;

        return {
          ...client,
          apartment_info: firstApt
            ? `${firstApt.type || "N/A"} • ${firstApt.floor_id || "Unknown Floor"}${
                apartmentCount > 1 ? ` (+${apartmentCount - 1} more)` : ""
              }`
            : "N/A",
          apartment_type: firstApt?.type || "N/A",
          floor_name: firstApt?.floor_id || "Unknown Floor",
          apartment_count: apartmentCount,
          apartments: apartmentData || [],
        };
      })
    );

    return { success: true, data: clientsWithApartments };
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
  updatedData: Database['public']['Tables']['clients']['Update'],
  apartmentChanges?: {
    apartmentsToAdd?: Array<{ floor_id: string; apartment_number: string; discount?: number }>;
    apartmentIdsToRemove?: string[]; // apartment.id values to remove
    apartmentsToUpdate?: Array<{ apartment_id: string; discount: number; price: number }>; // Update discount for existing apartments
  }
) => {
  try {
    // Step 1: Update client basic info
    const { data, error } = await supabase
      .from("clients")
      .update({
        ...updatedData,
        updated_at: new Date().toISOString(),
      })
      .eq("membership_number", membership_number)
      .select();

    if (error) throw error;

    // Step 2: Handle apartment additions
    if (apartmentChanges?.apartmentsToAdd && apartmentChanges.apartmentsToAdd.length > 0) {
      const newApartmentDetails: Array<{ id: string; discount_percentage: number; discounted_price: number }> = [];
      const today = new Date().toISOString();

      // Resolve new apartments and calculate discounted prices using per-apartment discount
      for (const apt of apartmentChanges.apartmentsToAdd) {
        const { data: apartment, error: aptError } = await supabase
          .from("apartments")
          .select("id, price")
          .eq("floor_id", apt.floor_id)
          .eq("number", apt.apartment_number)
          .single();

        if (apartment && !aptError) {
          const basePrice = apartment.price || 0;
          const discountPercentage = Number((apt as any).discount) || 0;
          const discountedPrice = basePrice - (basePrice * discountPercentage / 100);

          newApartmentDetails.push({
            id: apartment.id,
            discount_percentage: discountPercentage,
            discounted_price: Math.round(discountedPrice),
          });
        } else {
          console.warn(
            `⚠️ Apartment not found for floor ${apt.floor_id}, number ${apt.apartment_number}`
          );
        }
      }

      if (newApartmentDetails.length > 0) {
        // Insert into intermediate table with discount_percentage and discounted_price
        const intermediateRecords = newApartmentDetails.map((apt) => ({
          client_membership: membership_number,
          apartment_id: apt.id,
          alloted_date: today,
          discount_percentage: apt.discount_percentage,
          discounted_price: apt.discounted_price,
        }));

        const { error: intermediateError } = await supabase
          .from("intermediate")
          .insert(intermediateRecords);

        if (intermediateError) {
          console.error("❌ Error adding apartments to intermediate:", intermediateError);
          throw intermediateError;
        }

        // Update apartment status to 'sold'
        const newApartmentIds = newApartmentDetails.map((apt) => apt.id);
        const { error: statusError } = await supabase
          .from("apartments")
          .update({ status: "sold" })
          .in("id", newApartmentIds);

        if (statusError) {
          console.error("❌ Error updating apartment status:", statusError);
          throw statusError;
        }
      }
    }

    // Step 3: Handle apartment discount updates
    if (apartmentChanges?.apartmentsToUpdate && apartmentChanges.apartmentsToUpdate.length > 0) {
      for (const apt of apartmentChanges.apartmentsToUpdate) {
        const discountedPrice = Math.round(apt.price - (apt.price * apt.discount / 100));

        const { error: updateError } = await supabase
          .from("intermediate")
          .update({
            discount_percentage: apt.discount,
            discounted_price: discountedPrice,
          })
          .eq("client_membership", membership_number)
          .eq("apartment_id", apt.apartment_id);

        if (updateError) {
          console.error("❌ Error updating apartment discount in intermediate:", updateError);
          throw updateError;
        }
      }
    }

    // Step 4: Handle apartment removals
    if (apartmentChanges?.apartmentIdsToRemove && apartmentChanges.apartmentIdsToRemove.length > 0) {
      // Delete from intermediate table
      const { error: deleteError } = await supabase
        .from("intermediate")
        .delete()
        .eq("client_membership", membership_number)
        .in("apartment_id", apartmentChanges.apartmentIdsToRemove);

      if (deleteError) {
        console.error("❌ Error removing apartments from intermediate:", deleteError);
        throw deleteError;
      }

      // Update apartment status back to 'available'
      const { error: statusError } = await supabase
        .from("apartments")
        .update({ status: "available" })
        .in("id", apartmentChanges.apartmentIdsToRemove);

      if (statusError) {
        console.error("❌ Error updating apartment status:", statusError);
        throw statusError;
      }
    }

    return { success: true, data };
  } catch (error: any) {
    console.error("❌ Error updating client:", error.message);
    return { success: false, error: error.message };
  }
};

/**
 * ================================
 * DELETE CLIENT
 * ================================
 * Deletes a client and cleans up all related data
 */
export const deleteClient = async (membership_number: string) => {
  try {
    // Step 1: Get all apartments for this client from intermediate table
    const { data: intermediateRecords, error: fetchError } = await supabase
      .from("intermediate")
      .select("apartment_id")
      .eq("client_membership", membership_number);

    if (fetchError) {
      console.error("❌ Error fetching client apartments:", fetchError);
      throw fetchError;
    }

    const apartmentIds = (intermediateRecords as { apartment_id: string }[])?.map((record) => record.apartment_id) || [];

    // Step 2: Delete all intermediate records for this client
    const { error: deleteIntermediateError } = await supabase
      .from("intermediate")
      .delete()
      .eq("client_membership", membership_number);

    if (deleteIntermediateError) {
      console.error("❌ Error deleting intermediate records:", deleteIntermediateError);
      throw deleteIntermediateError;
    }

    // Step 3: Update apartment status back to 'available'
    if (apartmentIds.length > 0) {
      const { error: statusError } = await supabase
        .from("apartments")
        .update({ status: "available" })
        .in("id", apartmentIds);

      if (statusError) {
        console.error("❌ Error updating apartment status:", statusError);
        throw statusError;
      }
    }

    // Step 4: Delete the client record
    const { error: deleteClientError } = await supabase
      .from("clients")
      .delete()
      .eq("membership_number", membership_number);

    if (deleteClientError) {
      console.error("❌ Error deleting client:", deleteClientError);
      throw deleteClientError;
    }

    return { success: true, message: "Client deleted successfully" };
  } catch (error: any) {
    console.error("❌ Error deleting client:", error.message);
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

// 🏢 Fetch details (floor_id, type, price) for multiple apartments
export const fetchApartmentsByIds = async (apartmentIds: string[]) => {
  try {
    if (!apartmentIds || apartmentIds.length === 0) return [];

    const { data, error } = await supabase
      .from("apartments")
      .select("id, floor_id, type, price")
      .in("id", apartmentIds);

    if (error) throw error;
    return data || [];
  } catch (err: any) {
    console.error("❌ Error fetching apartments by IDs:", err.message);
    return [];
  }
};

// 💰 Fetch only prices for multiple apartments
export const fetchApartmentPricesByIds = async (apartmentIds: string[]) => {
  try {
    if (!apartmentIds || apartmentIds.length === 0) return [];

    const { data, error } = await supabase
      .from("apartments")
      .select("id, price")
      .in("id", apartmentIds);

    if (error) throw error;
    return data?.map((a) => a.price || 0) || [];
  } catch (err: any) {
    console.error("❌ Error fetching apartment prices:", err.message);
    return [];
  }
};
