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
  layout?: string;
  renders?: string[];
  floorPlan?: string;
  installmentOptions?: installmentOptions;
  coordinates?: {
    x: number;
    y: number;
  };
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