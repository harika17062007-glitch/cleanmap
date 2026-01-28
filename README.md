# CleanMap Backend

Backend API for CleanMap waste management system.

## Features

- User authentication (register/login)
- Admin panel with hardcoded credentials
- Waste reporting system
- User management
- Report management and analytics
- MongoDB integration

## Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file with the following variables:
```
MONGODB_URI=mongodb+srv://ramcharansanam18_db_user:SBANB3hCqhCNDQ3T@cluster0.gy5qr3h.mongodb.net/cleanmap
JWT_SECRET=your_jwt_secret_key_here_change_in_production
PORT=5000
```

3. Start the server:
```bash
npm run dev
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/admin-login` - Admin login (hardcoded: admin@cleanmap.com / admin123)
- `GET /api/auth/me` - Get current user profile

### Users
- `GET /api/users` - Get all users (admin only)
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user (admin only)

### Reports
- `POST /api/reports` - Create new report
- `GET /api/reports` - Get all reports (filtered by user role)
- `GET /api/reports/:id` - Get report by ID
- `PUT /api/reports/:id/status` - Update report status (admin only)
- `DELETE /api/reports/:id` - Delete report
- `GET /api/reports/stats/summary` - Get report statistics (admin only)

### Admin
- `GET /api/admin/dashboard` - Get dashboard data
- `GET /api/admin/users` - Get users with pagination
- `GET /api/admin/reports` - Get reports with filters
- `GET /api/admin/analytics` - Get analytics data

## Models

### User
- name, email, password, phone, address, role

### Report
- user, wasteType, quantity, location, latitude, longitude, description, imageUrl, status

## Admin Credentials

- Email: admin@cleanmap.com
- Password: admin123

## Security

- JWT authentication
- Password hashing with bcryptjs
- Role-based access control
- Input validation
