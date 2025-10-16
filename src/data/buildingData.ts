import { Floor, BuildingInfo, Apartment } from '@/types';

export const buildingInfo: BuildingInfo = {
  name: "Eyrie Luxury Residences",
  description: "Experience luxury living at its finest with our premium apartments featuring modern amenities, stunning views, and exceptional craftsmanship in every detail.",
  location: "Prime Location, City Center",
  totalFloors: 13,
  totalApartments: 120,
  amenities: [
    { name: "Swimming Pool", icon: "🏊‍♂️", description: "Olympic-sized swimming pool with panoramic views" },
    { name: "Fitness Center", icon: "💪", description: "State-of-the-art gym with modern equipment" },
    { name: "Parking", icon: "🚗", description: "Secure underground parking for residents" },
    { name: "Security", icon: "🔒", description: "24/7 security with advanced surveillance systems" },
    { name: "Garden", icon: "🌿", description: "Beautifully landscaped gardens and green spaces" },
    { name: "Rooftop Terrace", icon: "🏢", description: "Exclusive rooftop terrace with city views" },
  ],
  images: [
    "/assets/page3_img1.jpeg",
    "/assets/page22_img1.jpeg",
    "/assets/page25_img1.jpeg",
    "/assets/page26_img1.jpeg",
    "/assets/page27_img1.jpeg"
  ]
};

export const floors: Floor[] = [
  {
    id: "basement",
    name: "Basement",
    level: -1,
    planImage: "/assets/page8_img1.webp",
    apartments: []
  },
  {
    id: "lower-ground",
    name: "Lower Ground Floor",
    level: 0,
    planImage: "/assets/page9_img1.webp",
    apartments: [
    ]
  },
  {
    id: "ground",
    name: "Ground Floor",
    level: 1,
    planImage: "/assets/page10_img1.webp",
    apartments: [
    ]
  },
  {
    id: "first",
    name: "First Floor",
    level: 2,
    planImage: "/assets/page11_img1.webp",
    apartments: [
    ]
  },
  {
    id: "second",
    name: "Second Floor",
    level: 3,
    planImage: "/assets/page12_img1.webp",
    apartments: [
    ]
  },
  {
    id: "third",
    name: "Third Floor",
    level: 4,
    planImage: "/assets/page13_img1.webp",
    apartments: [
    ]
  },
  {
    id: "fourth",
    name: "Fourth Floor",
    level: 5,
    planImage: "/assets/page14_img1.webp",
    apartments: [
    ]
  },
  {
    id: "fifth",
    name: "Fifth Floor",
    level: 6,
    planImage: "/assets/page15_img1.webp",
    apartments: [
    ]
  },
  {
    id: "sixth",
    name: "Sixth Floor",
    level: 7,
    planImage: "/assets/page16_img1.webp",
    apartments: [
    ]
  },
  {
    id: "seventh",
    name: "Seventh Floor",
    level: 8,
    planImage: "/assets/page17_img1.webp",
    apartments: [
    ]
  },
  {
    id: "eighth",
    name: "Eighth Floor",
    level: 9,
    planImage: "/assets/page18_img1.webp",
    apartments: [    
    ]
  },
  {
    id: "ninth",
    name: "Ninth Floor",
    level: 10,
    planImage: "/assets/page19_img1.webp",
    apartments: [
    ]
  },
  {
    id: "rooftop",
    name: "Rooftop",
    level: 11,
    planImage: "/assets/page20_img1.webp",
    apartments: []
  }
];

export const sectionPlan = "/assets/page21_img1.webp";