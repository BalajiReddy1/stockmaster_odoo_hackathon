# Stock Master Backend

A robust Express.js backend for Stock Master Inventory Management System with JWT authentication and PostgreSQL database.

## Features

- 🔐 JWT-based authentication with refresh tokens
- 🍪 HTTP-only cookie support for web security
- 🛡️ Role-based access control (ADMIN, INVENTORY_MANAGER, WAREHOUSE_STAFF)
- 📊 Comprehensive inventory management schema
- 🔒 Security middleware (Helmet, CORS, Rate limiting)
- ✅ Request validation with Joi
- 🗄️ Prisma ORM for database management
- 📝 Comprehensive error handling

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT + bcryptjs
- **Validation**: Joi
- **Security**: Helmet, CORS, Rate limiting

## Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Environment setup**:
   ```bash
   cp .env.example .env
   ```
   Update the `.env` file with your database URL and secrets.

3. **Database setup**:
   ```bash
   npm run db:generate
   npm run db:push
   ```

4. **Start development server**:
   ```bash
   npm run dev
   ```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/profile` - Get user profile (protected)

### Health Check
- `GET /health` - Server health status

## Database Schema

The application includes comprehensive models for:
- User management and authentication
- Product catalog and categories
- Warehouse and location management
- Stock tracking and ledger
- Receipt management (incoming goods)
- Delivery orders (outgoing goods)
- Internal transfers
- Stock adjustments

## Security Features

- JWT tokens stored in HTTP-only cookies
- Password hashing with bcrypt
- Rate limiting
- CORS protection
- Security headers with Helmet
- Input validation
- SQL injection protection via Prisma

## Development Scripts

- `npm run dev` - Start development server with nodemon
- `npm start` - Start production server
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema to database
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Prisma Studio
- `npm run db:reset` - Reset database