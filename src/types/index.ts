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
  passport_number: string;
  address: string;
  email: string;
  contact_number: string;
  other_contact: string;
  next_of_kin: string;
  discount: number;
  amount_payable: number;
  agent_name: string;
  status: string;
  created_at?: string;
  updated_at?: string;
  client_image?: File | null;
  documents?: File[];
  relevent_notice?: File[];
  notes?: string;
}

export interface Intermediate {
  id: number;
  client_membership: string;
  apartment_id: string;
  alloted_date: string;
}

// Type for intermediate table query results with nested apartment data
export interface IntermediateWithApartment {
  id: number;
  apartment_id: string;
  alloted_date: string;
  apartments: {
    id: string;
    number: string;
    type: string;
    floor_id: string;
    price: number;
    area: number | null;
    bedrooms: number | null;
    bathrooms: number | null;
  };
}

// Type for client apartment info (flattened structure)
export interface ClientApartment {
  id: string;
  number: string;
  type: string;
  floor_id: string;
  price: number;
  area: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  alloted_date: string;
  intermediate_id: number;
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

export interface Payment {
  id: number;
  client_membership: string;
  apartment_id: string;
  payment_category: 'booking' | 'allotment' | 'monthly' | 'half_yearly' | 'possession';
  installment_number: number;
  amount: number;
  payment_method: 'Cash' | 'Bank Transfer' | 'Cheque' | 'Pay-order';
  paid_date: string;
  due_date?: string | null;
  notes?: string;
}