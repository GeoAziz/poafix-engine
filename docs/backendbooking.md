# Complete Backend Booking Flow Documentation

This document describes the end-to-end backend booking flow in the PoaFix Node.js/Express app, highlighting the exact backend files involved and their roles.

---

## 1. Booking Model
- **File:** `models/Booking.js`
- **Role:** Defines the Booking schema, including fields for provider, client, service type, schedule, status, payment, location, and more. Handles indexes and query helpers for efficient lookups.

## 2. Booking Controller
- **File:** `controllers/booking.controller.js`
- **Role:** Contains core logic for booking creation, status updates, fetching bookings, and business rules. Handles validation, notification triggers, and job creation when bookings are accepted or completed.

## 3. Booking Routes
- **File:** `routes/booking.routes.js`
- **Role:** Defines all REST API endpoints for bookings:
  - `POST /api/bookings` (create booking)
  - `GET /api/bookings/:bookingId` (fetch single booking)
  - `GET /api/bookings/client/:clientId` (fetch all bookings for a client)
  - `GET /api/bookings/provider/:providerId` (fetch all bookings for a provider)
  - `PATCH /api/bookings/:bookingId` (update booking status)
  - Additional endpoints for rating, cancellation, and payment.

## 4. Notification Service
- **File:** `services/notificationService.js`
- **Role:** Handles creation and delivery of notifications for booking events (e.g., new booking, booking accepted, completed). Integrates with WebSocket for real-time updates.

## 5. Notification Model
- **File:** `models/Notification.js`
- **Role:** Defines the Notification schema, including recipient, type, message, related booking, and status.

## 6. Job Model & Service
- **File:** `models/Job.js`, `services/jobService.js`
- **Role:** When a booking is accepted, a Job is created for the provider. Handles job creation, updates, and completion logic.

## 7. WebSocket Service
- **File:** `services/websocket.service.js`
- **Role:** Emits real-time booking and notification events to clients and providers.

## 8. Auth Middleware
- **File:** `middleware/authMiddleware.js`
- **Role:** Ensures all booking routes are protected and only authenticated users can create or update bookings.

## 9. Supporting Models
- **Files:** `models/ServiceProvider.js`, `models/Client.js`
- **Role:** Used for populating provider/client info in bookings and notifications.

---

### Notes
- All booking creation and updates trigger notifications and socket events for real-time UX.
- The backend robustly parses schedule fields and validates all required data.
- Enum values (e.g., `recipientModel`, `status`, `type`) must match backend expectations for successful booking and notification creation.
- Legacy or deprecated files (e.g., old booking controllers or routes) are not used in the main flow and can be archived.

---

This documentation ensures clarity for future backend development and