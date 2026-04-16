# Phone Shop Dashboard

A comprehensive inventory and sales management dashboard for mobile phone shops, built with Next.js 14, TypeScript, TailwindCSS, shadcn/ui, and Supabase.

## Features

- **Authentication**: Supabase Auth with email/password
- **Products Management**: CRUD operations, image uploads, filtering, and search
- **Categories Management**: Organize products by categories
- **Sales Management**: Record sales, auto-calculate profits, track inventory
- **Dashboard Analytics**: Real-time stats, charts, low stock alerts
- **Realtime Updates**: Live updates when data changes
- **Dark Mode**: Toggle between light and dark themes
- **Responsive Design**: Works on mobile and desktop

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Styling**: TailwindCSS, shadcn/ui
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Realtime)
- **Charts**: Recharts
- **Forms**: React Hook Form with Zod validation

## Getting Started

### Prerequisites

- Node.js 18+
- Supabase account
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd phone-shop-dashboard
```

2. Install dependencies:
```bash
npm install
```

3. Copy the environment file:
```bash
cp .env.example .env.local
```

4. Fill in your Supabase credentials in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

5. Set up the Supabase database:
   - Go to your Supabase project
   - Navigate to SQL Editor
   - Run the SQL schema from `supabase/schema.sql`

6. Create a storage bucket:
   - In Supabase, go to Storage
   - Create a new bucket named `products`
   - Set it to public

7. Run the development server:
```bash
npm run dev
```

8. Open [http://localhost:3000](http://localhost:3000)

## Database Schema

The application uses three main tables:

- **categories**: Store product categories
- **products**: Store product information with images
- **sales**: Track sales transactions

## Project Structure

```
├── app/                    # Next.js app directory
│   ├── login/             # Login page
│   ├── register/          # Registration page
│   └── dashboard/          # Protected dashboard
│       ├── products/      # Products management
│       ├── categories/    # Categories management
│       └── sales/         # Sales management
├── components/           # Reusable components
│   └── ui/               # shadcn/ui components
├── hooks/                # Custom React hooks
├── lib/                  # Utilities and Supabase client
└── supabase/             # Database schema
```

## Features Breakdown

### Dashboard
- Total products, sales, and profit statistics
- Sales and revenue charts (last 7 days)
- Recent sales table
- Low stock alerts (products with stock < 5)

### Products
- Create, edit, and delete products
- Upload product images to Supabase Storage
- Filter by category
- Search by product name
- Image preview before upload

### Categories
- Create, edit, and delete categories
- Assign to products

### Sales
- Record new sales
- Auto-calculate total price and profit
- Auto-decrement product stock
- Sales history with filtering

## Authentication

All routes except `/`, `/login`, and `/register` are protected by middleware. Unauthenticated users are redirected to the login page.

## Realtime

The application uses Supabase Realtime to subscribe to database changes. The dashboard updates automatically when:
- Products are added, updated, or deleted
- Sales are recorded

## License

MIT
