# Delivery Operations Feature

## Overview
The Delivery Operations feature manages outgoing shipments from the warehouse to customers. It implements a complete workflow for picking, packing, and validating deliveries with automatic stock reduction.

## Features

### 1. **Delivery Order Management**
- Create new delivery orders with customer and location details
- Add multiple product lines to each delivery
- Schedule delivery dates
- Track delivery status through workflow stages

### 2. **Status Workflow**
Deliveries progress through the following statuses:
- **DRAFT** - Initial state, order is being prepared
- **WAITING** - Order confirmed, waiting to be picked
- **READY** - Items picked and packed, ready for shipment
- **DONE** - Delivered successfully, stock reduced
- **CANCELED** - Order canceled

### 3. **Delivery Process**

#### Step 1: Pick Items
- Assign items to be picked from warehouse
- Mark quantities as "picked"
- Updates delivery status to READY

#### Step 2: Pack Items
- Pack picked items for shipment
- Mark quantities as "packed"
- Ensures items are ready for delivery

#### Step 3: Validate & Ship
- **Final validation automatically reduces stock**
- Creates stock ledger entries
- Updates delivery status to DONE
- Records delivery date

### 4. **View Modes**

#### List View
- Table format showing all deliveries
- Search by reference or contact
- Filter by status
- Quick actions for each delivery

#### Kanban View
- Visual board organized by status
- Drag-and-drop functionality (visual only)
- Quick status overview
- One-click validation for ready deliveries

### 5. **Stock Integration**
When a delivery is validated:
- Stock quantities are automatically reduced at the source location
- Stock ledger entries are created for audit trail
- Available stock is recalculated (quantity - reserved)

## API Endpoints

### Delivery Orders
- `GET /api/deliveries` - Get all deliveries
- `GET /api/deliveries/:id` - Get single delivery
- `POST /api/deliveries` - Create delivery
- `PUT /api/deliveries/:id` - Update delivery
- `DELETE /api/deliveries/:id` - Delete delivery (only if not DONE)
- `PATCH /api/deliveries/:id/status` - Update status
- `POST /api/deliveries/:id/pick` - Pick items
- `POST /api/deliveries/:id/pack` - Pack items
- `POST /api/deliveries/:id/validate` - Validate & reduce stock

### Supporting Endpoints
- `GET /api/customers` - Get all customers
- `GET /api/locations` - Get all locations
- `GET /api/products` - Get all products

## Database Schema

### DeliveryOrder
```prisma
model DeliveryOrder {
  id              String
  deliveryNumber  String              @unique
  customerId      String?
  customer        Customer?
  locationId      String
  location        Location
  status          DocumentStatus      @default(DRAFT)
  scheduledDate   DateTime?
  deliveredDate   DateTime?
  notes           String?
  userId          String
  user            User
  lines           DeliveryOrderLine[]
}
```

### DeliveryOrderLine
```prisma
model DeliveryOrderLine {
  id              String
  deliveryId      String
  delivery        DeliveryOrder
  productId       String
  product         Product
  quantity        Float
  picked          Float         @default(0)
  packed          Float         @default(0)
  delivered       Float         @default(0)
  notes           String?
}
```

## UI Components Used

### Shadcn Components
- `Button` - Action buttons
- `Card` - Content containers
- `Badge` - Status indicators
- `Dialog` - Modals for create/view
- `Select` - Dropdowns for filters and forms
- `Input` - Form inputs
- `Table` - List view data display
- `Tabs` - View mode switching
- `Label` - Form labels

### Icons (Lucide React)
- `Truck` - Delivery
- `Package` - Items
- `PackageOpen` - Picking
- `PackageCheck` - Packed
- `CheckCircle2` - Validated/Done
- `Clock` - Scheduled
- `AlertCircle` - Waiting/Issues
- `Search` - Search functionality
- `Filter` - Status filters
- `List` - List view
- `LayoutGrid` - Kanban view

## Usage Example

### Creating a Delivery Order
1. Navigate to Delivery Operations page
2. Click "NEW" button
3. Fill in:
   - Customer (optional)
   - Source Location (required)
   - Scheduled Date (optional)
   - Product Lines (at least one required)
4. Click "Create Delivery"

### Processing a Delivery
1. Delivery starts in DRAFT status
2. Mark as WAITING when ready to process
3. Click "Pick Items" to mark items as picked
4. Optionally click "Pack Items" to mark as packed
5. Click "Validate & Ship" to:
   - Mark delivery as DONE
   - Reduce stock automatically
   - Record delivery date
   - Create stock ledger entries

### Example Scenario
```
Sales order for 10 chairs:
1. Create delivery order for 10 chairs
2. Pick 10 chairs from warehouse
3. Pack them for shipment
4. Validate delivery → Stock reduced by 10 chairs
```

## Stock Movement

When validating a delivery:
```javascript
// Before validation
Stock: 100 chairs (available: 100)

// After validating delivery of 10 chairs
Stock: 90 chairs (available: 90)
```

Stock ledger entry created:
- Document Type: DELIVERY
- Movement Type: OUT
- Quantity: 10
- Balance Before: 100
- Balance After: 90

## Search & Filter

### Search
Search across:
- Delivery reference number (e.g., WH/OUT/0001)
- Customer name
- Customer code

### Filter
Filter by status:
- All Status
- Draft
- Waiting
- Ready
- Done
- Canceled

## Navigation

Access Delivery Operations from:
- Dashboard → "Delivery Operations" button
- Direct URL: `/delivery`

## Permissions

All delivery operations require authentication. The authenticated user is automatically recorded as the user who created/modified the delivery.

## Future Enhancements

Potential improvements:
1. Partial deliveries (deliver less than ordered quantity)
2. Delivery routes and scheduling
3. Shipping label generation
4. Tracking numbers
5. Customer notifications
6. Returns/reverse logistics
7. Batch picking for multiple deliveries
8. Real-time stock availability check
9. Integration with shipping carriers
10. Delivery performance analytics
