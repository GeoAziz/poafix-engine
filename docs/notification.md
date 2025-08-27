# Notification Logic

## Overview
This document outlines the notification logic for the Poafix application, including notification creation, types, recipients, and read/unread status handling.

## Notification Creation
Notifications are created in the following scenarios:
- **Booking Request**: When a client creates a booking for a provider.
- **Job Update**: When the status of a job changes (e.g., accepted, in progress, completed).

## Notification Types
- **BOOKING_REQUEST**: Sent to providers when a new booking is created.
- **JOB_UPDATE**: Sent to clients when there is an update on their job.

## Notification Recipients
- **Clients**: Receive notifications for job updates.
- **Providers**: Receive notifications for new bookings and job updates.

## Read/Unread Status
- Notifications are marked as unread by default when created.
- Users can mark notifications as read by interacting with them in the UI.

## Notification Count
- **Client UI**:
  - **Bookings Count**: Displays the count of pending bookings.
  - **Notification Count**: Displays the count of unread notifications.
- **Provider UI**:
  - **Notification Count**: Displays the count of unread notifications.

## Implementation Notes
- Notification counts are updated in real-time using WebSocket or polling mechanisms.
- The backend API provides endpoints to fetch notifications and update their read status.

## API Endpoints
- **GET /api/notifications**: Fetch notifications for a user.
- **PATCH /api/notifications/:id/read**: Mark a notification as read.

## Example Notification Object
```json
{
  "_id": "689b9ad59f1b2b030f314bc0",
  "recipient": "689adba75451102d5598fd6f",
  "recipientModel": "provider",
  "type": "BOOKING_REQUEST",
  "title": "New Booking Request",
  "message": "You have a new cleaning service request",
  "data": {
    "bookingId": "689b9ad49f1b2b030f314bbe",
    "serviceType": "cleaning",
    "schedule": "2025-08-13T10:00:00.000Z"
  },
  "read": false,
  "createdAt": "2025-08-12T19:49:41.056Z",
  "__v": 0
}
```
