# Inventory Tracking System - User Guide

## Overview

Your comprehensive inventory tracking system for managing cleaning chemical supplies across multiple locations (Tamil Nadu & Karnataka). This system provides real-time tracking of 30+ SKUs, order management, and stock movement monitoring.

## Key Features

### ✅ Completed Features

1. **Multi-Location Management**
   - Track inventory across HQ (Coimbatore) and warehouses (Bangalore)
   - Real-time stock levels at each location
   - Location-specific contact information

2. **Product/SKU Management**
   - Manage 30+ cleaning chemical products
   - Track by SKU, category, and unit
   - Set reorder levels for low stock alerts
   - Product activation/deactivation

3. **Client & Outlet Management**
   - Manage clients (hotels, restaurants, cafes, offices)
   - Multiple outlets per client
   - Contact information and location tracking

4. **Order Management**
   - Create orders for specific outlets
   - Track order status (pending → processing → packed → shipped → delivered)
   - Order history and timeline
   - Associate multiple products with each order

5. **Stock Movement Tracking**
   - Inbound stock (deliveries from HQ)
   - Outbound stock (distributions to clients)
   - Transfer between locations
   - Complete audit trail with timestamps and user tracking

6. **Real-Time Dashboard**
   - Live inventory updates across all users
   - Low stock alerts
   - Pending orders overview
   - Quick statistics

7. **Minimalist Design**
   - Clean, professional interface
   - Fast and responsive
   - Works on Windows (browser) and Android (browser/PWA)

## Getting Started

### First Time Setup

1. **Sign Up / Sign In**
   - Navigate to `/auth` to create an account
   - Use email authentication

2. **Add Locations**
   - Go to "Locations" in the navigation
   - Add your HQ (Coimbatore)
   - Add warehouses (Bangalore, etc.)

3. **Add Products**
   - Go to "Products"
   - Add your cleaning chemical products with:
     - SKU code
     - Product name
     - Category
     - Unit (Liters, etc.)
     - Reorder level

4. **Initialize Inventory**
   - After adding products and locations
   - Stock levels will be tracked automatically when you receive/ship items

5. **Add Clients & Outlets**
   - Go to "Clients" to add your business clients
   - For each client, add their outlets/branches

## Using the System

### Dashboard
- View real-time statistics
- See low stock alerts
- Monitor recent orders
- Quick access to all sections

### Managing Inventory

**Check Stock Levels:**
- Navigate to "Inventory"
- View all products across all locations
- See low stock warnings

**Record Stock Movements:**
1. Go to "Stock Movements" (when implemented)
2. Record inbound stock from HQ
3. Record outbound stock for orders
4. Transfer stock between locations

### Managing Orders

**Create New Order:**
1. Navigate to "Orders"
2. Select client outlet
3. Add products and quantities
4. Set expected delivery date
5. Submit order

**Update Order Status:**
- Track orders through: pending → processing → packed → shipped → delivered
- System automatically updates inventory when orders are fulfilled

### Product Management

**Add New Product:**
1. Go to "Products"
2. Click "Add Product"
3. Fill in SKU, name, category, unit, reorder level
4. Submit

**Monitor Product Stock:**
- Check inventory levels across all locations
- Get alerts when stock falls below reorder level

## Database Schema

### Tables

1. **locations** - Warehouses and HQ locations
2. **products** - Product/SKU catalog
3. **inventory** - Stock levels per product per location
4. **clients** - Customer companies
5. **outlets** - Client outlet/branch locations
6. **orders** - Customer orders
7. **orderItems** - Individual items in each order
8. **stockMovements** - Complete audit trail of all stock in/out
9. **alerts** - Low stock notifications

## Loading Test Data

To test the system with sample data:

```bash
npx convex run seedData:seed
```

This will create:
- 2 locations (Coimbatore HQ, Bangalore Warehouse)
- 10 sample cleaning products
- Initial inventory at both locations
- 3 sample clients with outlets
- Sample orders

## User Roles

The system supports 4 user roles:
- **Admin** - Full access to all features
- **Manager** - Manage inventory, orders, and products
- **Warehouse Staff** - Record stock movements, view inventory
- **Sales** - Create orders, view inventory

## Technical Details

### Tech Stack
- **Frontend:** React + TypeScript + Tailwind CSS
- **Backend:** Convex (real-time database)
- **Auth:** Convex Auth with email OTP
- **UI Components:** shadcn/ui
- **Animations:** Framer Motion
- **Theme:** Minimalist monochrome design

### Real-Time Features
All data updates in real-time across all connected devices. When:
- Inventory is updated → All users see new levels instantly
- Orders are created → Dashboard updates immediately
- Products are added → Available to all users instantly

### Mobile & Desktop Support
- **Windows:** Access via any modern browser (Chrome, Edge, Firefox)
- **Android:** Access via browser or install as PWA for app-like experience
- **Responsive Design:** Works seamlessly on all screen sizes

## File Structure

```
src/
├── convex/              # Backend functions
│   ├── schema.ts        # Database schema
│   ├── products.ts      # Product management
│   ├── inventory.ts     # Inventory queries/mutations
│   ├── locations.ts     # Location management
│   ├── clients.ts       # Client management
│   ├── outlets.ts       # Outlet management
│   ├── orders.ts        # Order management
│   ├── stockMovements.ts # Stock tracking
│   └── seedData.ts      # Test data script
├── pages/               # UI pages
│   ├── Landing.tsx      # Landing page
│   ├── Dashboard.tsx    # Main dashboard
│   ├── Inventory.tsx    # Inventory view
│   ├── Products.tsx     # Product management
│   ├── Orders.tsx       # Order management
│   ├── Locations.tsx    # Location management
│   └── Clients.tsx      # Client management
└── index.css           # Minimalist theme styles
```

## Future Enhancements

Consider adding:
1. **Reports & Analytics**
   - Inventory turnover reports
   - Client order history
   - Stock movement analytics
   - Low stock trend analysis

2. **Stock Movements UI**
   - Dedicated page for recording movements
   - Bulk stock updates
   - Import/export functionality

3. **Mobile App**
   - Native Android app
   - Barcode scanning for products
   - Offline mode support

4. **Notifications**
   - Email alerts for low stock
   - SMS notifications for order updates
   - Push notifications for critical alerts

5. **Advanced Features**
   - Automated reordering
   - Predictive stock levels
   - Integration with accounting software
   - Multi-currency support
   - Batch/lot tracking
   - Expiry date management

## Support & Maintenance

### Error Checking
Run type checking to ensure code quality:
```bash
npx tsc -b --noEmit
npx convex dev --once
```

### Development Server
Start the development server:
```bash
pnpm install
npx convex dev
pnpm dev
```

### Common Issues

**Auth Not Working:**
- Check `src/convex/auth.ts` has `domain: process.env.CONVEX_SITE_URL`
- Ensure `src/convex/http.ts` includes `auth.addHttpRoutes(http)`

**Low Stock Alerts Not Showing:**
- Verify products have `reorderLevel` set
- Check inventory quantities against reorder levels

**Orders Not Creating:**
- Ensure outlet and client exist
- Verify user is authenticated
- Check product IDs are valid

## Data Security

- User authentication required for all operations
- Role-based access control
- Secure API endpoints
- Real-time data validation
- Audit trail for all stock movements

## Performance

- Optimized queries with proper indexing
- Paginated large datasets
- Real-time updates without polling
- Efficient data loading strategies
- Minimal bundle size

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Questions?

For technical support or feature requests, refer to:
- Convex documentation: https://docs.convex.dev
- React Router: https://reactrouter.com
- shadcn/ui: https://ui.shadcn.com

---

**Built with ❤️ for efficient inventory management**
