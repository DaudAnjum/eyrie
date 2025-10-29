export interface Apartment {
  id: string;
  floorId: string;
  number: string;
  type: string;
  bedrooms?: number;
  bathrooms?: number;
  area?: number;
  price: number;
  status: 'available' | 'sold';
  renders?: string[];
  installmentOptions?: installmentOptions;
  coordinates?: {
    x: number;
    y: number;
  };
}

export interface Client {
  membership_number: string;
  client_name: string;
  CNIC: string;
  address: string;
  email: string;
  contact_number: string;
  next_of_kin: string;
  apartment_id: string | null;
  discount: number;
  amount_payable: number;
  installment_plan: string;
  agent_name: string;
  status: string;
  created_at?: string;
  updated_at?: string;
}


export interface installmentOptions {
  booking: string;
  allotmentConfirmation: string;
  monthlyInstallments: string;
  halfYearly: string;
  onPossession: string;
  total: string;
}

export interface Floor {
  id: string;
  name: string;
  level: number;
  planImage: string;
  apartments: Apartment[];
}

export interface BuildingInfo {
  name: string;
  description: string;
  location: string;
  totalFloors: number;
  totalApartments: number;
  amenities: Amenity[];
  images: string[];
}

export interface Amenity {
  name: string;
  icon: string;
  description?: string;
}

export interface User {
  id: string;
  username: string;
  role: 'admin' | 'user';
}

export interface Admin {
  id: number;
  username: string;
  password_hash: string;
  created_at: string;
}