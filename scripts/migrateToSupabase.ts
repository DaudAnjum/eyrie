import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";
import { floors } from "@/data/buildingData"; // adjust path if needed
import { Apartment } from "@/types";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Use service role key for full DB access
);

async function migrate() {
  console.log("🚀 Starting migration...");

  for (const floor of floors) {
    for (const apt of floor.apartments) {
      const apartment: Apartment = {
        ...apt,
        floorId: floor.id, // link apartment to floor
      };

      const { error } = await supabase
        .from("apartments")
        .upsert(apartment, { onConflict: "id" }); // avoids duplicates

      if (error) {
        console.error(`❌ Failed to insert apartment ${apt.id}`, error);
      } else {
        console.log(`✅ Inserted apartment ${apt.id}`);
      }
    }
  }

  console.log("🎉 Migration completed!");
}

migrate().catch((err) => {
  console.error("❌ Migration error", err);
});
