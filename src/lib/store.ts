import { create } from 'zustand';
import { Apartment, User } from '@/types';
import { floors } from '@/data/buildingData';
import { supabase } from './supabaseClient';

interface AppState {
  selectedFloor: string | null;
  selectedApartment: Apartment | null;
  user: User | null;
  apartments: Apartment[];
  setSelectedFloor: (floorId: string | null) => void;
  setSelectedApartment: (apartment: Apartment | null) => void;
  setUser: (user: User | null) => void;
  fetchApartments: () => Promise<void>;
  updateApartmentStatus: (apartmentId: string, status: 'available' | 'sold') => Promise<void>;
  getAllApartments: () => Apartment[];
}

export const useAppStore = create<AppState>((set, get) => ({
  selectedFloor: null,
  selectedApartment: null,
  user: null,
  apartments: [],

  setSelectedFloor: (floorId) => set({ selectedFloor: floorId }),

  setSelectedApartment: (apartment) => set({ selectedApartment: apartment }),

  setUser: (user) => set({ user }),

  fetchApartments: async () => {
    try{
      const res = await fetch("/api/apartments");
      const data = await res.json();

      if (!res.ok) {
        return;
      }

      if (!data || data.length === 0) {
        set({ apartments: [] });
        return;
      }

      const normalized: Apartment[] = data.map((apt: any) => ({
        id: apt.id,
        floorId: apt.floor_id,
        number: apt.number,
        type: apt.type,
        bedrooms: apt.bedrooms ?? undefined,
        bathrooms: apt.bathrooms ?? undefined,
        area: apt.area ?? undefined,
        price: apt.price,
        status: apt.status,
        renders: apt.renders ?? [],
        installmentOptions: apt.installment_options ?? undefined,
        coordinates: typeof apt.coordinates === "string"
  ? JSON.parse(apt.coordinates) // If stored as string
  : apt.coordinates && apt.coordinates.x !== undefined
  ? { x: Number(apt.coordinates.x), y: Number(apt.coordinates.y) } // Ensure numbers
  : undefined,

      }));

      set({ apartments: normalized as Apartment[] });
    }catch (err) {
      console.error("Unexpected error while fetching apartments:", err);
      set({ apartments: [] });
    }
  },  

  updateApartmentStatus: async (apartmentId, status) => {
    const { error } = await supabase
      .from("apartments")
      .update({ status })
      .eq("id", apartmentId);

    if (error) {
      console.error("Error updating status:", error);
      return;
    }

    set((state) => ({
      apartments: state.apartments.map((apt) =>
        apt.id === apartmentId ? { ...apt, status } : apt
      ),
    }));
  },

    getAllApartments: () => get().apartments,
}));