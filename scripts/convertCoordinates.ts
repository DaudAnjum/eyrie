// scripts/resetAndFixApartments.ts
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const IMAGE_WIDTH = 9922;
const IMAGE_HEIGHT = 7016;

async function resetAndFix() {
  console.log("🗑️ Clearing apartments table...");
  await supabase.from("apartments").delete().neq("id", "");

  console.log("📥 Fetching data from apartments_duplicate...");
  const { data: backupData, error: backupError } = await supabase
    .from("apartments_duplicate")
    .select("*");

  if (backupError || !backupData) {
    console.error("❌ Error fetching from backup:", backupError);
    return;
  }

  console.log(`🚚 Inserting ${backupData.length} rows into apartments...`);
  const { error: insertError } = await supabase.from("apartments").insert(backupData);
  if (insertError) {
    console.error("❌ Error inserting:", insertError);
    return;
  }

  console.log("🔄 Converting coordinates to percentage...");
  for (const apt of backupData) {
    if (apt.coordinates?.x && apt.coordinates?.y) {
      const pixelX = apt.coordinates.x;
      const pixelY = apt.coordinates.y;

      const newX = (pixelX / IMAGE_WIDTH) * 100;
      const newY = (pixelY / IMAGE_HEIGHT) * 100;

      await supabase
        .from("apartments")
        .update({ coordinates: { x: newX, y: newY } })
        .eq("id", apt.id);

      console.log(`✅ Fixed ${apt.id}: ${pixelX},${pixelY} → ${newX.toFixed(2)}%,${newY.toFixed(2)}%`);
    }
  }

  console.log("🎉 Reset + Coordinate Fix Complete!");
}

resetAndFix();
