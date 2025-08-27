# PoaFix Database Credentials

## 🔐 Test User Credentials

> **Important**: These are test credentials for development and testing purposes only. 
> Change all passwords before deploying to production!

---

## 👑 ADMIN DASHBOARD ACCESS

### Super Admin
- **Email**: `admin@poafix.com`
- **Password**: `admin123`
- **Role**: `super_admin`
- **Permissions**: Full system access
  - User management
  - Provider verification
  - System analytics
  - Payment management
  - System configuration
- **Features**: Complete admin dashboard functionality

### Regular Admin #1
- **Email**: `john@poafix.com`
- **Password**: `admin123`
- **Role**: `admin`
- **Permissions**: Limited admin access
  - User management
  - Provider verification
  - Reports viewing
  - Suspension management
- **Features**: Standard admin operations

### Regular Admin #2
- **Email**: `sarah@poafix.com`
- **Password**: `admin123`
- **Role**: `admin`
- **Permissions**: Basic admin access
  - User viewing
  - Provider viewing
  - Reports viewing
- **Features**: Read-only admin access

---

## 👤 CLIENT ACCESS

### Alice Johnson (Active Client)
- **Email**: `alice@example.com`
- **Password**: `password123`
- **Status**: Active ✅
- **Location**: Westlands, Nairobi
- **Stats**: 
  - Total Bookings: 5
  - Completed: 3
  - Total Spent: KES 15,000
- **Features**: Full client functionality
  - Create service requests
  - Book services
  - Track job progress
  - Payment history
  - Notifications

### Bob Smith (Active Client)
- **Email**: `bob@example.com`
- **Password**: `password123`
- **Status**: Active ✅
- **Location**: Karen, Nairobi
- **Stats**: 
  - Total Bookings: 8
  - Completed: 6
  - Total Spent: KES 25,000
- **Features**: Full client functionality with active bookings

### Carol Williams (Blocked Client)
- **Email**: `carol@example.com`
- **Password**: `password123`
- **Status**: Blocked ❌
- **Location**: Kilimani, Nairobi
- **Block Reason**: Multiple spam complaints
- **Stats**: 
  - Total Bookings: 12
  - Completed: 4 (low completion rate)
  - Total Spent: KES 8,000
- **Features**: Limited access (for testing blocked user scenarios)

---

## 🔧 SERVICE PROVIDER ACCESS

### David Plumber (Verified Provider)
- **Email**: `david.plumber@example.com`
- **Password**: `provider123`
- **Business**: David's Professional Plumbing Services
- **Service**: Plumbing
- **Status**: Verified ✅ & Available
- **Location**: Industrial Area, Nairobi
- **Rating**: 4.5/5 (23 ratings)
- **Experience**: 5 years
- **Hourly Rate**: KES 1,500
- **Stats**: 
  - Total Jobs: 45
  - Completed: 41
  - Total Earnings: KES 125,000
- **Features**: Full provider functionality
  - Accept/reject bookings
  - Job management
  - Earnings tracking
  - Portfolio management

### Emma Electrician (Verified Provider)
- **Email**: `emma@electrical.com`
- **Password**: `provider123`
- **Business**: Emma's Electrical Solutions
- **Service**: Electrical
- **Status**: Verified ✅ & Available
- **Location**: Eastlands, Nairobi
- **Rating**: 4.8/5 (31 ratings)
- **Experience**: 7 years
- **Hourly Rate**: KES 2,000
- **Stats**: 
  - Total Jobs: 67
  - Completed: 63
  - Total Earnings: KES 185,000
- **Features**: Full provider functionality with active jobs

### Frank Painter (Pending Verification)
- **Email**: `frank@painting.com`
- **Password**: `provider123`
- **Business**: Frank's Premium Painting Works
- **Service**: Painting
- **Status**: Pending Verification ⏳
- **Location**: Kasarani, Nairobi
- **Rating**: 4.2/5 (18 ratings)
- **Experience**: 3 years
- **Hourly Rate**: KES 1,200
- **Stats**: 
  - Total Jobs: 28
  - Completed: 25
  - Total Earnings: KES 85,000
- **Features**: Limited access (for testing unverified provider scenarios)

### Grace Cleaner (Suspended Provider)
- **Email**: `grace@cleaning.com`
- **Password**: `provider123`
- **Business**: Grace's Premium Cleaning Services
- **Service**: Cleaning
- **Status**: Suspended ⛔
- **Suspension Reason**: Multiple customer complaints - under review
- **Location**: Kileleshwa, Nairobi
- **Rating**: 4.7/5 (42 ratings)
- **Experience**: 4 years
- **Hourly Rate**: KES 800
- **Stats**: 
  - Total Jobs: 89
  - Completed: 81
  - Total Earnings: KES 145,000
- **Features**: Suspended access (for testing suspension scenarios)

---

## 🧪 Testing Scenarios

### Admin Testing
1. **Login as Super Admin** → Full dashboard access
2. **User Management** → View/block clients, verify providers
3. **Analytics** → System reports and statistics
4. **Provider Verification** → Approve/reject Frank's verification

### Client Testing
1. **Login as Alice** → Create new service requests
2. **Login as Bob** → View active bookings and job progress
3. **Login as Carol** → Test blocked user experience

### Provider Testing
1. **Login as David** → Accept new bookings, manage jobs
2. **Login as Emma** → Track active job progress
3. **Login as Frank** → Limited access due to pending verification
4. **Login as Grace** → Suspended account experience

---

## 📱 API Endpoints for Authentication

### Admin Login
```bash
POST /admin/login
{
  "email": "admin@poafix.com",
  "password": "admin123"
}
```

### Client/Provider Login
```bash
POST /api/auth/login
{
  "email": "alice@example.com",
  "password": "password123"
}
```

---

## 🗄️ Database Information

- **Database**: `home_service_db`
- **Connection**: `mongodb://127.0.0.1:27017/home_service_db`
- **Collections**: 
  - `admins` (3 records)
  - `users` (3 client records)
  - `serviceproviders` (4 provider records)
  - `servicerequests` (2 records)
  - `bookings` (3 records)
  - `jobs` (2 records)
  - `notifications` (5 records)

---

## ⚠️ Security Notes

1. **Development Only**: These credentials are for development/testing
2. **Change Passwords**: Update all passwords before production
3. **Environment Variables**: Use `.env` files for production credentials
4. **JWT Secrets**: Generate secure JWT secrets for production
5. **Database Security**: Implement proper MongoDB authentication

---

## 🚀 Quick Start Testing

1. **Seed Database**: Run `node scripts/seed-complete-database.js`
2. **Start Server**: `npm start` or `node server.js`
3. **Test Admin**: Login with super admin credentials
4. **Test Client**: Login with Alice's credentials
5. **Test Provider**: Login with David's credentials

---

*Last Updated: August 3, 2025*
*Version: 1.0.0*