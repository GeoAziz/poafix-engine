# Client-Provider Booking Flow (Poafix)

## Overview
This document describes the end-to-end flow for booking a service between a client and a provider in the Poafix platform, including authentication, booking creation, provider acceptance, job creation, and notification delivery.

---

## 1. Client Login
- Endpoint: `POST /api/clients/login`
- Request:
  ```bash
  curl -X POST http://localhost:5000/api/clients/login \
    -H "Content-Type: application/json" \
    -d '{
      "email": "alice@example.com",
      "password": "password123"
    }'
  ```
- Response: Contains a JWT token and client user ID.

---

## 2. Provider Login
- Endpoint: `POST /api/providers/login`
- Request:
  ```bash
  curl -X POST http://localhost:5000/api/providers/login \
    -H "Content-Type: application/json" \
    -d '{
      "email": "grace@cleaning.com",
      "password": "provider123"
    }'
  ```
- Response: Contains a JWT token and provider user ID.

---

## 3. Client Creates a Booking
- Endpoint: `POST /api/bookings`
- Request:
  ```bash
  curl -X POST http://localhost:5000/api/bookings \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer <CLIENT_TOKEN>" \
    -d '{
      "providerId": "<PROVIDER_ID>",
      "clientId": "<CLIENT_ID>",
      "serviceType": "cleaning",
      "scheduledDate": "2025-08-13T10:00:00.000Z",
      "scheduledTime": "10:00 AM",
      "address": "123 Main St",
      "description": "Test booking for Grace Cleaner",
      "status": "pending",
      "payment": { "method": "mpesa", "status": "pending" },
      "location": { "type": "Point", "coordinates": [36.7689, -1.2674], "address": "123 Main St" }
    }'
  ```
- Response: Contains the booking object.

---

## 4. Provider Accepts the Booking
- Endpoint: `PATCH /api/bookings/:bookingId`
- Request:
  ```bash
  curl -X PATCH http://localhost:5000/api/bookings/<BOOKING_ID> \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer <PROVIDER_TOKEN>" \
    -d '{"status":"accepted","providerId":"<PROVIDER_ID>"}'
  ```
- Response: Contains the updated booking and the created job object.

---

## 5. Notifications
- When a booking is accepted, a notification is sent to the client in real time (via WebSocket and stored in the database).
- The client UI will display the notification in the notification bell area.

---

## Troubleshooting & Advice
- Always use fresh, full JWT tokens for authentication.
- Ensure all required fields (especially `location.coordinates`) are present in booking creation.
- If you see validation errors, check your request body and model enums (e.g., `recipientModel` must be lowercase).
- Restart your backend after code changes.
- Use logs to trace the flow and debug issues quickly.

---

## Motivation & Vyb
- Every bug you fix is a step closer to a seamless user experience.
- Celebrate the small wins—each successful booking is proof your system works!
- Keep your code clean, your tests sharp, and your vybz high.
- #vybcoding: Build with energy, learn from every error, and keep pushing forward!

---

**Happy coding!**
