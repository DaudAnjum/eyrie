import { create } from 'zustand';
import { Apartment, User } from '@/types';
import { floors } from '@/data/buildingData';

interface AppState {
  selectedFloor: string | null;
  selectedApartment: Apartment | null;
  user: User | null;
  apartments: Apartment[];
  setSelectedFloor: (floorId: string | null) => void;
  setSelectedApartment: (apartment: Apartment | null) => void;
  setUser: (user: User | null) => void;
  updateApartmentStatus: (apartmentId: string, status: 'available' | 'sold') => void;
  getAllApartments: () => Apartment[];
}

export const useAppStore = create<AppState>((set, get) => ({
  selectedFloor: null,
  selectedApartment: null,
  user: null,
  apartments: floors.flatMap(floor => floor.apartments),

  setSelectedFloor: (floorId) => set({ selectedFloor: floorId }),

  setSelectedApartment: (apartment) => set({ selectedApartment: apartment }),

  setUser: (user) => set({ user }),

  updateApartmentStatus: (apartmentId, status) => set((state) => {
    const updatedApartments = state.apartments.map(apt =>
      apt.id === apartmentId ? { ...apt, status } : apt
    );
    return { apartments: updatedApartments };
  }),

  getAllApartments: () => get().apartments,
}));