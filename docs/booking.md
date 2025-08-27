# 📖 PoaFix Booking Flow Documentation (#vybcoding)

---

## 📦 Backend Files Involved
- `models/booking.model.js` — Booking schema/model
- `controllers/booking.controller.js` — Booking logic (create, update, status)
- `routes/booking.routes.js` — Booking endpoints
- `services/notificationService.js` — Notifications for booking events
- `models/Job.js`, `services/jobService.js` — Job creation and updates
- `services/websocket.service.js` — Real-time booking updates
- `middleware/authMiddleware.js` — Route protection/auth
- `models/ServiceProvider.js`, `models/Client.js` — User info for bookings

## 💻 Frontend Files Involved (Flutter)
- `lib/providers/booking_provider.dart` — State management for bookings
- `lib/services/booking_service.dart`, `lib/core/services/booking_service.dart` — API calls
- `lib/models/booking.dart`, `lib/core/models/booking_model.dart` — Booking data models
- `lib/screens/client/booking_screen.dart`, `lib/screens/bookings/bookings_screen.dart` — Client booking UI
- `lib/screens/service_provider/booking_screen.dart` — Provider booking UI
- `lib/widgets/booking_card.dart` — Booking status display/action
- `lib/services/websocket_service.dart` — Real-time updates

---

Welcome to the PoaFix booking system! This guide explains how a client can create a booking, what happens behind the scenes, and how to troubleshoot common issues.

---

## 🚀 **Step 1: Select a Service**
- The client browses available services (e.g., Plumbing, Electrical).
- After choosing a service, the client selects a provider from the list of nearby or available professionals.

## 📝 **Step 2: Fill in Booking Details**
The client fills out a booking form with the following fields:
- **Service Type**: e.g., "plumbing"
- **Service Name**: e.g., "Plumbing"
- **Provider**: The selected provider's ID
## 📤 **Step 3: Submit the Booking**
When the client submits the form:
- The frontend sends a POST request to `/api/bookings` with all the above details.
- Example payload:
  ```json
    "clientId": "CLIENT_ID",
    "serviceType": "plumbing",
    "serviceName": "Plumbing",
    "scheduledDate": "2025-08-13T00:00:00.000",
    "scheduledTime": "6:23 AM",
    "notes": "",
    "totalAmount": 0,
    "amount": 0,
    "services": [],
    "status": "pending",
    "payment": { "method": "mpesa", "status": "pending" },
    "location": { "type": "Point", "coordinates": [36.8218983, -1.2921] },
    "provider": "PROVIDER_ID",
    "client": "CLIENT_ID"
  }
  ```

---

## 🛠️ **Step 4: Backend Processing**
- The backend receives the booking request.
- It parses the date and time into a single `schedule` field (e.g., `"2025-08-13T06:23:00.000Z"`).
- The booking is saved to the database with all relevant fields.
## ✅ **Step 5: Confirmation & Tracking**
- The client receives a confirmation that the booking was created.
- The booking appears in the client’s "My Bookings" list.
- The provider is notified and can accept, reject, or update the booking status.
## 🧩 **Troubleshooting**
- **Booking not created?**  
  - Ensure all required fields are filled.
  - Check your internet connection.
- **No providers found?**  
  - Try expanding your search radius or check your location settings.
- **Payment issues?**  


## 🛡️ **Security & Validation**
- All booking requests require a valid JWT token for authentication.
- The backend validates all fields and will return clear error messages if anything is missing or invalid.

## 🧑‍💻 **API Example (cURL)**
```bash
curl -X POST http://localhost:5000/api/bookings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <CLIENT_TOKEN>" \
  -d '{
    "providerId": "PROVIDER_ID",
    "clientId": "CLIENT_ID",
    "serviceType": "plumbing",
    "serviceName": "Plumbing",
    "scheduledDate": "2025-08-13T00:00:00.000",
    "scheduledTime": "6:23 AM",
    "notes": "",
    "totalAmount": 0,
    "amount": 0,
    "services": [],
    "status": "pending",
    "payment": { "method": "mpesa", "status": "pending" },
    "location": { "type": "Point", "coordinates": [36.8218983, -1.2921] },
    "provider": "PROVIDER_ID",
    "client": "CLIENT_ID"
  }'
```

---

## 🎉 **Congratulations!**
You’ve successfully created a booking with PoaFix.  
For more help, contact support or check the FAQ.

---

_Last