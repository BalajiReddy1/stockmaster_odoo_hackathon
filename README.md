# 📦 StockMaster - Inventory Management System

> A comprehensive warehouse and inventory management system built for the Odoo Hackathon, featuring real-time stock tracking, delivery operations, warehouse management, and intelligent inventory control.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-ISC-green.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)
![React](https://img.shields.io/badge/react-19.2.0-61DAFB.svg)

---

## 📋 Table of Contents

- [Project Overview](#-project-overview)
- [Features](#-features)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
- [Project Structure](#-project-structure)
- [Database Schema](#-database-schema)
- [API Documentation](#-api-documentation)
- [Authentication Flow](#-authentication-flow)
- [Delivery Operations](#-delivery-operations)
- [Inventory Management](#-inventory-management)
- [Contributing](#-contributing)
- [Team](#-team)

---

## 🎯 Project Overview

**StockMaster** is a modern, full-stack inventory management system designed to streamline warehouse operations, delivery tracking, and stock control. Built with a focus on scalability, security, and user experience, it provides comprehensive tools for managing products, locations, stock movements, and delivery operations.

### Key Objectives

- **Real-time Stock Tracking**: Monitor inventory levels across multiple warehouses and locations
- **Delivery Operations**: Complete pick-pack-validate workflow for outgoing goods
- **Multi-warehouse Support**: Manage multiple warehouses with distinct storage locations
- **Stock Movement Ledger**: Comprehensive audit trail for all inventory movements
- **Low Stock Alerts**: Automated notifications for products below reorder levels
- **Role-based Access Control**: Secure authentication with granular permissions

---

## ✨ Features

### 🔐 Authentication & User Management
- **Secure Registration**: Email-based account creation with bcrypt password hashing
- **Login System**: JWT-based authentication with access and refresh tokens
- **Password Recovery**: OTP-based forgot password flow via email
- **Session Management**: HTTP-only cookies for secure token storage
- **Role-based Access**: Admin, Inventory Manager, and Warehouse Staff roles

### 📦 Product Management
- **Product Catalog**: Comprehensive product database with SKU tracking
- **Category Hierarchy**: Organize products in nested categories
- **Unit of Measure**: Support for different measurement units (pieces, kg, liters, etc.)
- **Reorder Management**: Set reorder levels and suggested quantities
- **Active/Inactive States**: Control product visibility and availability

### 🏭 Warehouse & Location Management
- **Multi-warehouse Support**: Manage multiple warehouse facilities
- **Location Types**: Storage, Production, Receiving, Shipping, Damaged, Quarantine
- **Location Hierarchy**: Organized storage with unique location codes
- **Stock by Location**: Track inventory at specific storage locations
- **Warehouse Dashboard**: Real-time overview of warehouse metrics

### 🚚 Delivery Operations
- **Delivery Orders**: Create and manage outgoing shipments
- **Pick-Pack-Validate Workflow**:
  - **Pick**: Mark items as picked from storage
  - **Pack**: Confirm packing of picked items
  - **Validate**: Finalize delivery and auto-update stock levels
- **Customer Management**: Track deliveries by customer
- **Status Tracking**: Draft → Waiting → Ready → Done → Canceled
- **Delivery Lines**: Multiple products per delivery order
- **Scheduled Deliveries**: Plan future delivery dates

### 📊 Stock Management
- **Stock Location Tracking**: Real-time quantity by product and location
- **Reserved Quantities**: Track stock reserved for pending deliveries
- **Available Stock**: Calculate available = quantity - reserved
- **Stock Ledger**: Complete audit trail of all movements
- **Low Stock Alerts**: Dashboard notifications for products below reorder level

### 📈 Dashboard & Analytics
- **Overview Metrics**: Total stock, warehouses, locations, products
- **Warehouse Statistics**: Stock levels and product counts per warehouse
- **Low Stock Monitoring**: Real-time alerts for products needing reorder
- **Quick Actions**: Fast access to common operations
- **Recent Activity**: View latest stock movements and operations

### 🔄 Stock Operations (Backend Ready)
- **Receipts**: Incoming goods from suppliers
- **Internal Transfers**: Move stock between locations
- **Stock Adjustments**: Correct inventory discrepancies (physical count, damage, theft)
- **Stock Ledger**: Comprehensive movement history

---

## 🏗️ Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Frontend (React)                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │
│  │   Auth   │  │ Delivery │  │Warehouse │  │Dashboard│ │
│  │  Pages   │  │  Pages   │  │  Pages   │  │  Page   │ │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬────┘ │
│       │             │               │             │      │
│       └─────────────┴───────────────┴─────────────┘      │
│                          │                               │
│              ┌───────────▼──────────┐                    │
│              │   React Router       │                    │
│              │   Auth Context       │                    │
│              │   API Service (Axios)│                    │
│              └───────────┬──────────┘                    │
└────────────────────────────┼─────────────────────────────┘
                             │ HTTP/HTTPS
                             │ REST API
┌────────────────────────────┼─────────────────────────────┐
│                            │                             │
│              ┌─────────────▼──────────┐                  │
│              │   Express.js Server    │                  │
│              │   - CORS               │                  │
│              │   - Helmet Security    │                  │
│              │   - Rate Limiting      │                  │
│              │   - Cookie Parser      │                  │
│              └─────────────┬──────────┘                  │
│                            │                             │
│       ┌────────────────────┼────────────────────┐        │
│       │                    │                    │        │
│  ┌────▼─────┐       ┌──────▼─────┐      ┌──────▼─────┐  │
│  │   Auth   │       │  Delivery  │      │ Inventory  │  │
│  │  Routes  │       │   Routes   │      │   Routes   │  │
│  └────┬─────┘       └──────┬─────┘      └──────┬─────┘  │
│       │                    │                    │        │
│  ┌────▼────────────────────▼────────────────────▼─────┐  │
│  │          Prisma ORM Client (Database Layer)        │  │
│  └────────────────────────┬────────────────────────────┘  │
│                           │                               │
└───────────────────────────┼───────────────────────────────┘
                            │
                   ┌────────▼────────┐
                   │   PostgreSQL    │
                   │  (Neon Cloud)   │
                   │                 │
                   │  - Users        │
                   │  - Products     │
                   │  - Warehouses   │
                   │  - Stock        │
                   │  - Deliveries   │
                   └─────────────────┘
```

### Data Flow

#### Authentication Flow
```
User → Login Form → API Call → JWT Generation → Cookie Storage → Protected Routes
```

#### Delivery Validation Flow
```
User clicks "Validate" 
    → API: POST /api/deliveries/:id/validate
    → Update delivery status to DONE
    → For each delivery line:
        → Reduce StockLocation quantity
        → Create StockLedger entry (OUT movement)
        → Update available stock
    → Return updated delivery
    → Frontend: Update UI + Show success toast
```

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 19.2.0
- **Routing**: React Router DOM 7.9.6
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Styling**: Tailwind CSS 4.1.17
- **Forms**: React Hook Form 7.66.1 + Zod validation
- **HTTP Client**: Axios 1.13.2
- **Icons**: Lucide React 0.554.0
- **Notifications**: Sonner 2.0.7
- **Build Tool**: Vite 7.2.4

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js 4.18.2
- **Database ORM**: Prisma 5.7.0
- **Authentication**: JWT (jsonwebtoken 9.0.2)
- **Password Hashing**: bcryptjs 2.4.3
- **Validation**: Joi 17.11.0 + Zod 4.1.12
- **Email**: Nodemailer 7.0.10
- **Security**: Helmet 7.1.0, express-rate-limit 7.1.5

### Database
- **Database**: PostgreSQL
- **Hosting**: Neon (Serverless Postgres)
- **ORM**: Prisma with comprehensive schema

### Development Tools
- **Version Control**: Git
- **Package Manager**: npm
- **Dev Server**: Nodemon (backend), Vite (frontend)
- **Code Quality**: ESLint

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **PostgreSQL** (or Neon account)
- **Git**

### Installation

#### 1. Clone the Repository

```bash
git clone https://github.com/BalajiReddy1/stockmaster_odoo_hackathon.git
cd stockmaster_odoo_hackathon
```

#### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create .env file
cat > .env << EOL
# Database
DATABASE_URL="your_postgresql_connection_string"

# JWT Secrets
JWT_ACCESS_SECRET="your_access_secret_key_here"
JWT_REFRESH_SECRET="your_refresh_secret_key_here"

# JWT Expiry
JWT_ACCESS_EXPIRY="15m"
JWT_REFRESH_EXPIRY="7d"

# Cookie Settings
COOKIE_SECURE="false"  # Set to true in production
COOKIE_SAME_SITE="lax"

# Server Config
PORT=5000
NODE_ENV="development"
FRONTEND_URL="http://localhost:5173"

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000

# Email Configuration (Optional - for OTP)
EMAIL_SERVICE="gmail"
EMAIL_USER="your_email@gmail.com"
EMAIL_PASSWORD="your_app_password"
EMAIL_FROM="noreply@stockmaster.com"
EOL

# Generate Prisma Client
npm run db:generate

# Push database schema
npm run db:push

# Seed database with sample data
npm run db:seed

# Start backend server
npm run dev
```

Backend will start on `http://localhost:5000`

#### 3. Frontend Setup

```bash
cd ../frontend

# Install dependencies
npm install

# Start frontend development server
npm run dev
```

Frontend will start on `http://localhost:5173`

### 🎯 Quick Start Guide

#### Default Test Credentials

After seeding, use these accounts:

**Admin Account**
- Email: `admin@stockmaster.com`
- Password: `admin123`

**Test User Account**
- Email: `test@example.com`
- Password: `password123`

#### First Steps

1. **Login** at `http://localhost:5173/login`
2. **Dashboard** - View overview metrics
3. **Warehouses** - Explore the 3 seeded warehouses
4. **Stock** - Check inventory levels
5. **Delivery** - View 3 sample delivery orders
6. **Create Delivery** - Test the pick-pack-validate workflow

---

## 📁 Project Structure

```
stockmaster_odoo_hackathon/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma          # Database schema definition
│   │   └── seed.js                # Sample data generator
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js        # Prisma client configuration
│   │   ├── controllers/
│   │   │   ├── authController.js  # Authentication logic
│   │   │   ├── inventoryController.js  # Inventory operations
│   │   │   └── stockController.js # Stock management
│   │   ├── middleware/
│   │   │   ├── auth.js            # JWT authentication middleware
│   │   │   ├── errorHandler.js    # Global error handling
│   │   │   └── validation.js      # Request validation
│   │   ├── routes/
│   │   │   ├── auth.js            # Auth endpoints
│   │   │   ├── delivery.js        # Delivery operations
│   │   │   ├── customers.js       # Customer management
│   │   │   ├── locations.js       # Location management
│   │   │   ├── products.js        # Product management
│   │   │   ├── email.js           # Email operations
│   │   │   └── inventoryRoutes.js # Inventory dashboard
│   │   ├── utils/
│   │   │   ├── tokenService.js    # JWT token generation
│   │   │   ├── otpService.js      # OTP generation/validation
│   │   │   └── emailService.js    # Email sending
│   │   └── server.js              # Express app configuration
│   ├── .env                       # Environment variables
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── assets/                # Static assets
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── Layout.jsx     # Main layout wrapper
│   │   │   │   ├── Navbar.jsx     # Top navigation
│   │   │   │   └── Sidebar.jsx    # Side navigation menu
│   │   │   └── ui/                # shadcn/ui components
│   │   │       ├── button.jsx
│   │   │       ├── card.jsx
│   │   │       ├── input.jsx
│   │   │       ├── badge.jsx
│   │   │       ├── dialog.jsx
│   │   │       ├── select.jsx
│   │   │       ├── table.jsx
│   │   │       ├── tabs.jsx
│   │   │       └── ...
│   │   ├── contexts/
│   │   │   └── AuthContext.jsx    # Global auth state
│   │   ├── pages/
│   │   │   ├── auth/
│   │   │   │   ├── LoginPage.jsx          # Login form
│   │   │   │   ├── SignUpPage.jsx         # Registration
│   │   │   │   ├── ForgotPasswordPage.jsx # Password reset
│   │   │   │   └── OTPVerificationPage.jsx # OTP verification
│   │   │   ├── DashboardPage.jsx          # Main dashboard
│   │   │   ├── DeliveryPage.jsx           # Delivery list
│   │   │   ├── DeliveryDetailPage.jsx     # Delivery form
│   │   │   ├── WarehousePage.jsx          # Warehouse management
│   │   │   └── StockOverviewPage.jsx      # Stock overview
│   │   ├── services/
│   │   │   ├── api.js             # Axios configuration + auth API
│   │   │   └── inventoryService.js # Inventory API calls
│   │   ├── lib/
│   │   │   └── utils.js           # Utility functions (cn)
│   │   ├── App.jsx                # Root component + routing
│   │   ├── App.css                # Global styles
│   │   ├── main.jsx               # React entry point
│   │   └── index.css              # Tailwind imports
│   ├── public/                    # Public assets
│   ├── components.json            # shadcn/ui config
│   ├── vite.config.js             # Vite configuration
│   ├── tailwind.config.js         # Tailwind config
│   └── package.json
│
├── .git/                          # Git repository
├── .gitignore                     # Git ignore rules
└── README.md                      # This file
```

---

## 🗄️ Database Schema

### Core Entities

#### **User** - Authentication & Authorization
```prisma
- id: String (CUID)
- email: String (unique)
- password: String (hashed)
- name: String
- role: Enum (ADMIN, INVENTORY_MANAGER, WAREHOUSE_STAFF)
- isActive: Boolean
```

#### **Product** - Product Catalog
```prisma
- id: String
- name: String
- sku: String (unique)
- description: String
- category: ProductCategory (relation)
- unitOfMeasure: String
- initialStock: Float
- reorderLevel: Float
- reorderQuantity: Float
- isActive: Boolean
```

#### **Warehouse** - Facility Management
```prisma
- id: String
- name: String (unique)
- code: String (unique)
- address: String
- isActive: Boolean
- locations: Location[] (one-to-many)
```

#### **Location** - Storage Locations
```prisma
- id: String
- name: String
- code: String (unique)
- warehouse: Warehouse (relation)
- type: Enum (STORAGE, PRODUCTION, RECEIVING, SHIPPING, DAMAGED, QUARANTINE)
- isActive: Boolean
```

#### **StockLocation** - Inventory by Location
```prisma
- id: String
- product: Product (relation)
- location: Location (relation)
- quantity: Float
- reserved: Float
- available: Float (calculated: quantity - reserved)
- unique: (productId, locationId)
```

#### **DeliveryOrder** - Outgoing Shipments
```prisma
- id: String
- deliveryNumber: String (unique, auto-generated)
- customer: Customer (relation)
- location: Location (source)
- status: Enum (DRAFT, WAITING, READY, DONE, CANCELED)
- scheduledDate: DateTime
- deliveredDate: DateTime
- lines: DeliveryOrderLine[] (one-to-many)
- user: User (created by)
```

#### **StockLedger** - Audit Trail
```prisma
- id: String
- product: Product
- location: Location
- documentType: Enum (RECEIPT, DELIVERY, ADJUSTMENT, TRANSFER)
- documentId: String
- movementType: Enum (IN, OUT)
- quantity: Float
- balanceBefore: Float
- balanceAfter: Float
- reference: String
- createdAt: DateTime
```

### Entity Relationships

```
User ─────┬─────> DeliveryOrder
          ├─────> Receipt
          ├─────> StockAdjustment
          └─────> InternalTransfer

Product ──┬─────> StockLocation
          ├─────> DeliveryOrderLine
          ├─────> ReceiptLine
          └─────> StockLedger

Warehouse ─────> Location ─────┬─────> StockLocation
                               ├─────> DeliveryOrder
                               ├─────> Receipt
                               └─────> StockLedger

Customer ─────> DeliveryOrder ─────> DeliveryOrderLine ─────> Product

Supplier ─────> Receipt ─────> ReceiptLine ─────> Product
```

---

## 🔌 API Documentation

### Authentication Endpoints

#### `POST /api/auth/register`
Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "name": "John Doe",
  "role": "WAREHOUSE_STAFF"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "user": {
    "id": "clx...",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "WAREHOUSE_STAFF"
  },
  "tokens": {
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  }
}
```

#### `POST /api/auth/login`
Authenticate user and get tokens.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": "clx...",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "WAREHOUSE_STAFF",
    "isActive": true
  },
  "tokens": {
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  }
}
```

#### `POST /api/auth/logout`
Logout user and clear cookies.

**Response:**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

#### `GET /api/auth/profile` 🔒
Get current user profile (requires authentication).

**Headers:**
```
Cookie: accessToken=eyJhbGc...
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "clx...",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "WAREHOUSE_STAFF",
    "isActive": true,
    "createdAt": "2025-11-20T10:00:00Z"
  }
}
```

### Delivery Endpoints

#### `GET /api/deliveries` 🔒
Get all delivery orders with related data.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "clx...",
      "deliveryNumber": "WH/OUT/0001",
      "status": "READY",
      "scheduledDate": "2025-11-25T00:00:00Z",
      "customer": {
        "id": "clx...",
        "name": "Azure Interior",
        "code": "CUST001"
      },
      "location": {
        "id": "clx...",
        "name": "Stock Location 1",
        "code": "MW-A-01-01",
        "warehouse": {
          "name": "Main Warehouse"
        }
      },
      "lines": [
        {
          "id": "clx...",
          "quantity": 6,
          "picked": 6,
          "packed": 6,
          "delivered": 0,
          "product": {
            "name": "Desk",
            "sku": "DESK001"
          }
        }
      ]
    }
  ]
}
```

#### `GET /api/deliveries/:id` 🔒
Get single delivery order by ID.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "clx...",
    "deliveryNumber": "WH/OUT/0001",
    "status": "READY",
    "scheduledDate": "2025-11-25T00:00:00Z",
    "notes": "Urgent delivery",
    "customer": { /* ... */ },
    "location": { /* ... */ },
    "lines": [ /* ... */ ]
  }
}
```

#### `POST /api/deliveries` 🔒
Create new delivery order.

**Request Body:**
```json
{
  "customerId": "clx...",
  "locationId": "clx...",
  "scheduledDate": "2025-11-30T00:00:00Z",
  "notes": "Handle with care",
  "lines": [
    {
      "productId": "clx...",
      "quantity": 10
    }
  ]
}
```

#### `PUT /api/deliveries/:id` 🔒
Update delivery order.

**Request Body:**
```json
{
  "status": "WAITING",
  "scheduledDate": "2025-12-01T00:00:00Z",
  "notes": "Updated notes"
}
```

#### `POST /api/deliveries/:id/pick` 🔒
Mark items as picked.

**Request Body:**
```json
{
  "lineId": "clx...",
  "pickedQuantity": 5
}
```

#### `POST /api/deliveries/:id/pack` 🔒
Mark items as packed.

**Request Body:**
```json
{
  "lineId": "clx...",
  "packedQuantity": 5
}
```

#### `POST /api/deliveries/:id/validate` 🔒
Validate delivery and update stock.

**What happens:**
1. Updates delivery status to `DONE`
2. Sets `deliveredDate` to current time
3. For each line: reduces `StockLocation.quantity` by delivered amount
4. Creates `StockLedger` entries for audit trail
5. Recalculates `available` stock

**Response:**
```json
{
  "success": true,
  "message": "Delivery validated successfully",
  "data": { /* updated delivery */ }
}
```

#### `DELETE /api/deliveries/:id` 🔒
Delete delivery order (only if status is DRAFT).

### Product Endpoints

#### `GET /api/products` 🔒
Get all products.

#### `GET /api/products/:id` 🔒
Get product by ID.

#### `POST /api/products` 🔒
Create new product.

#### `PUT /api/products/:id` 🔒
Update product.

#### `DELETE /api/products/:id` 🔒
Delete product.

### Customer Endpoints

#### `GET /api/customers` 🔒
Get all customers.

#### `GET /api/customers/:id` 🔒
Get customer by ID.

#### `POST /api/customers` 🔒
Create new customer.

### Location Endpoints

#### `GET /api/locations` 🔒
Get all locations with warehouse data.

#### `GET /api/locations/:id` 🔒
Get location by ID.

### Inventory Dashboard Endpoints

#### `GET /api/inventory/dashboard` 🔒
Get dashboard metrics (total stock, warehouses, low stock alerts).

**Response:**
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalStock": 1450,
      "totalProducts": 12,
      "totalWarehouses": 3,
      "totalLocations": 14,
      "lowStockAlerts": 2
    },
    "warehouses": [
      {
        "id": "clx...",
        "name": "Main Warehouse",
        "code": "MW01",
        "totalStock": 850,
        "totalProducts": 10
      }
    ],
    "lowStockItems": [
      {
        "product": {
          "name": "Conference Table",
          "unitOfMeasure": "unit"
        },
        "location": {
          "name": "A-01-01",
          "warehouse": {
            "name": "Main Warehouse"
          }
        },
        "quantity": 15,
        "reorderLevel": 20
      }
    ]
  }
}
```

---

## 🔐 Authentication Flow

### Registration & Login

1. **User Registration**
   - User submits email, password, name, role
   - Backend validates input (Joi/Zod schemas)
   - Password hashed with bcrypt (12 salt rounds)
   - User created in database
   - JWT tokens generated (access + refresh)
   - Tokens stored in HTTP-only cookies
   - Welcome email sent (optional)

2. **User Login**
   - User submits email, password
   - Backend finds user by email
   - Password verified with bcrypt.compare()
   - JWT tokens generated
   - Tokens stored in HTTP-only cookies
   - User data returned (without password)

3. **Token Management**
   - **Access Token**: Short-lived (15 minutes), used for API requests
   - **Refresh Token**: Long-lived (7 days), used to get new access tokens
   - Stored in HTTP-only cookies (secure in production)
   - Automatic refresh via Axios interceptor on 401 errors

4. **Protected Routes**
   - Frontend: `ProtectedRoute` component checks `isAuthenticated`
   - Backend: `authenticate` middleware verifies JWT
   - Redirects to login if unauthorized

### Password Recovery Flow

1. **Forgot Password**
   - User enters email
   - Backend generates 6-digit OTP
   - OTP stored in database with expiry (10 minutes)
   - OTP sent via email

2. **Verify OTP**
   - User enters OTP
   - Backend validates OTP and checks expiry
   - Returns success if valid

3. **Reset Password**
   - User enters new password + OTP
   - Backend verifies OTP again
   - New password hashed with bcrypt
   - Password updated in database
   - OTP deleted from database
   - Password change notification email sent

---

## 🚚 Delivery Operations

### Workflow States

```
DRAFT → WAITING → READY → DONE
   ↓       ↓        ↓       ↓
   └──── CANCELED ──────────┘
```

- **DRAFT**: Initial state, being prepared
- **WAITING**: Awaiting warehouse processing
- **READY**: All items picked and packed, ready for shipment
- **DONE**: Validated and shipped, stock updated
- **CANCELED**: Order canceled

### Pick-Pack-Validate Process

#### 1. **Pick Phase**
```javascript
POST /api/deliveries/:id/pick
{
  "lineId": "clx123",
  "pickedQuantity": 5
}
```
- Warehouse staff picks items from storage
- Updates `picked` quantity on delivery line
- Can pick in multiple batches

#### 2. **Pack Phase**
```javascript
POST /api/deliveries/:id/pack
{
  "lineId": "clx123",
  "packedQuantity": 5
}
```
- Items packed for shipment
- Updates `packed` quantity
- Must have been picked first

#### 3. **Validate Phase** (Critical - Updates Stock!)
```javascript
POST /api/deliveries/:id/validate
```
- **Finalizes the delivery**
- **Updates stock levels** for all lines
- **Creates stock ledger entries** for audit trail
- Sets status to DONE
- Records `deliveredDate`

**Backend Logic:**
```javascript
// For each delivery line:
1. Get current StockLocation record
2. Reduce quantity by delivered amount
3. Create StockLedger entry:
   - documentType: "DELIVERY"
   - movementType: "OUT"
   - quantity: -delivered (negative for OUT)
   - balanceBefore: current quantity
   - balanceAfter: new quantity
4. Update available stock calculation
```

### Out-of-Stock Detection

Before allowing pick/pack/validate, system checks:
- Current `available` stock at source location
- Warns if insufficient stock
- Prevents over-delivery

---

## 📊 Inventory Management

### Stock Calculation

```javascript
Stock at Location:
- quantity: Physical quantity in location
- reserved: Quantity allocated to pending orders
- available: quantity - reserved

Examples:
- Location A has 100 chairs
- Pending delivery reserves 20
- Available = 80 (can create new orders for max 80)
```

### Stock Ledger Audit Trail

Every stock movement creates a ledger entry:

```javascript
{
  productId: "clx123",
  locationId: "clx456",
  documentType: "DELIVERY",  // or RECEIPT, ADJUSTMENT, TRANSFER
  documentId: "WH/OUT/0001",
  movementType: "OUT",        // or IN
  quantity: -10,              // Negative for OUT
  balanceBefore: 50,
  balanceAfter: 40,
  reference: "Validated delivery to Azure Interior",
  createdAt: "2025-11-22T14:30:00Z"
}
```

### Low Stock Monitoring

Dashboard automatically detects products below reorder level:

```javascript
if (stockLocation.quantity < product.reorderLevel) {
  // Show alert
  // Suggest reorder quantity
}
```

### Multi-warehouse Management

- Each warehouse has unique code
- Locations belong to specific warehouse
- Stock tracked per location (not per warehouse)
- Dashboard shows aggregated warehouse metrics

---

## 🤝 Contributing

### Development Workflow

1. **Create Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make Changes**
   - Follow existing code style
   - Add comments for complex logic
   - Update types/interfaces

3. **Test Locally**
   ```bash
   # Backend
   npm run dev
   
   # Frontend
   npm run dev
   ```

4. **Commit**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

5. **Push & Pull Request**
   ```bash
   git push origin feature/your-feature-name
   ```

### Commit Message Convention

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting)
- `refactor:` Code refactoring
- `test:` Adding tests
- `chore:` Maintenance tasks

---

## 👥 Team

### Hackathon Team - StockMaster

This project was built as a collaborative effort for the Odoo Hackathon:

- **Balaji** - Full-stack developer
  - Delivery operations module
  - Backend API development
  - Database schema design
  - Authentication system

- **Teammate** - Full-stack developer
  - Inventory management module
  - Warehouse management features
  - Dashboard analytics
  - Stock overview pages

**Repository**: [stockmaster_odoo_hackathon](https://github.com/BalajiReddy1/stockmaster_odoo_hackathon)

---

## 📝 License

This project is licensed under the ISC License.

---

## 🙏 Acknowledgments

- **Odoo Hackathon** for the opportunity and inspiration
- **Neon** for serverless PostgreSQL hosting
- **Prisma** for excellent ORM tooling
- **shadcn/ui** for beautiful React components
- **Radix UI** for accessible component primitives

---

## 📞 Support

For questions or issues:
- Open an issue on GitHub
- Check existing documentation
- Review API examples above

---

**Built with ❤️ for Odoo Hackathon 2025**

*StockMaster - Simplifying Inventory Management*
