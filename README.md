# Eyrie Luxury Residences

An interactive and modern real estate website for a luxury construction project that allows prospective buyers to explore available and sold apartments through visual floor navigation and detailed apartment information.

## Features

- 🏢 **Interactive Floor Plan Navigation** - Real-time apartment availability status with clickable floor plans
- 🔐 **Admin Panel** - Secure admin login to manage apartment availability status
- 🏠 **Detailed Apartment Pages** - Layout, pricing, and installment payment options
- 📱 **Responsive Design** - Mobile-first design with smooth animations
- 🎨 **Modern UI/UX** - Clean presentation inspired by platforms like Zillow

## Technology Stack

- **Framework**: Next.js 14 with TypeScript
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **State Management**: Zustand
- **Icons**: React Icons
- **Deployment**: Optimized for static export

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) with your browser

### Building for Production

```bash
npm run build
```

This creates an optimized static export in the `out` directory, ready for deployment to any static hosting service.

## Admin Access

**Demo Credentials:**
- Username: `admin`
- Password: `eyrie2024`

## Project Structure

```
src/
├── app/                 # Next.js app router pages
├── components/          # Reusable React components
├── data/               # Building and apartment data
├── lib/                # Utilities and state management
└── types/              # TypeScript type definitions

assets/                 # Building images and floor plans
```

## Color Scheme

- **Primary**: #2C3E50 (sophisticated navy)
- **Secondary**: #E8F4FD (light blue)
- **Accent**: #3498DB (trust blue)
- **Success**: #27AE60 (available green)
- **Sold**: #E74C3C (sold red)

## Deployment

The project is configured for static export and can be deployed to:

- **Vercel**: Connect your repository for automatic deployments
- **Netlify**: Drag and drop the `out` folder after building
- **GitHub Pages**: Push the `out` folder to a gh-pages branch
- **Any static hosting service**

### Vercel Deployment (Recommended)

1. Connect your repository to Vercel
2. Set build command: `npm run build`
3. Set output directory: `out`
4. Deploy automatically on push

## Adding Content

### Adding Apartment Data

Update apartment information in `src/data/buildingData.ts`:

```typescript
// Add apartments to specific floors
{
  id: "unique-id",
  floorId: "floor-id",
  number: "A-101",
  type: "2 Bedroom",
  bedrooms: 2,
  bathrooms: 2,
  area: 1200,
  price: 450000,
  status: "available",
  coordinates: { x: 200, y: 150 }, // Position on floor plan
  installmentOptions: [...],
  renders: [...],
  floorPlan: "path/to/floorplan.jpg"
}
```

### Adding Floor Plans

1. Add floor plan images to the `assets` folder
2. Update the floor data in `src/data/buildingData.ts`
3. Add apartment coordinates for clickable markers

## License

This project is for demonstration purposes. All images and content are used for portfolio presentation.