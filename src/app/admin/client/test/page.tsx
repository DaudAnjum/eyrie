"use client";

import { useEffect } from "react";
import { createClient } from "../clientFunctions";
import { Client } from "@/types";

export default function TestCreateClient() {
  useEffect(() => {
    const testCreate = async () => {
      console.log("🚀 Testing createClient()...");

      const newClient: Client = {
        membership_number: "M111", // make sure this is unique
        client_name: "Ahmad Raza",
        CNIC: "35202-9876543-1",
        address: "45 Main Boulevard, Lahore",
        email: "ahmad.raza@example.com",
        contact_number: "0301-9876543",
        next_of_kin: "Bilal Raza",
        discount: 10,
        amount_payable: 2500000,
        agent_name: "Sara Ahmed",
        status: "active",
      };

      const result = await createClient(newClient);
      console.log("✅ CREATE RESULT:", result);
    };

    testCreate();
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-primary mb-4">
        Testing createClient()
      </h1>
      <p>Open the browser console (F12 → Console tab) to view results.</p>
    </div>
  );
}
