# Provider Suspension & Unsuspension Process

## Overview
This document describes the complete technical and user-facing workflow for suspending and unsuspending a provider in the PoaFix platform. It covers backend and frontend files, API endpoints, business logic, and notification flows.

---

## Backend

### Key Files
- `routes/admin/suspensions.js`: Handles suspend/unsuspend API endpoints.
- `models/ServiceProvider.js`: Provider schema, includes suspension fields and pre-save hook.
- `models/suspension.js`: Suspension record schema.
- `services/notification.service.js`: Emits notifications for suspension/unsuspension.
- `middleware/admin-auth.middleware.js`: Secures admin routes.

### Suspension Flow
1. **Admin triggers suspension** via POST `/api/admin/suspensions/suspend`.
2. **Validation**: Checks `providerId`, `reason`, `reasonType` (enum), and `duration`.
3. **Suspension record** created in `Suspension` collection.
4. **Provider document** updated:
   - `isSuspended: true`
   - `isAvailable: false`
   - `suspendedAt: <date>`
   - `currentSuspension: <suspensionId>`
5. **Pre-save hook** in `ServiceProvider.js` ensures `isSuspended` and `isAvailable` are set correctly.
6. **Notification** sent to provider via `NotificationService`.

### Unsuspension Flow
1. **Admin triggers unsuspend** via POST `/api/admin/suspensions/unsuspend/:providerId`.
2. **Suspension record** updated: `active: false`, `endDate: <date>`.
3. **Provider document** updated:
   - `suspendedAt: null`
   - `isSuspended: false` (via pre-save hook)
   - `isAvailable: true`
   - `currentSuspension: null`
4. **Notification** sent to provider.

---

## Frontend (Admin UI)

### Key Files
- `lib/screens/admin_panel.dart`: Main admin dashboard.
- `lib/services/admin_service.dart`: Handles API calls for provider management.
- `lib/screens/provider/availability_screen.dart`: Shows provider status.
- `lib/screens/notification/client_notifications_screen.dart`: Displays notifications.

### Suspension/Unsuspension UI
- Admin selects provider and chooses "Suspend" or "Unsuspend".
- Form validates reason, reasonType, and duration.
- API call made to backend endpoint.
- UI updates provider status and shows notification feedback.

---

## Notifications
- Real-time notification sent to provider on suspension/unsuspension.
- Notification appears in provider's app and admin dashboard.

---

## API Endpoints
- `POST /api/admin/suspensions/suspend`
- `POST /api/admin/suspensions/unsuspend/:providerId`

---

## Business Logic
- Only admins can suspend/unsuspend providers.
- Suspension reasonType must be one of:
  - Policy Violation
  - Poor Service Quality
  - Customer Complaints
  - Document Verification Issues
  - Other
- Suspension is idempotent and unsuspend is idempotent.
- All changes are logged and notifications are emitted.

---

## Troubleshooting
- Ensure correct model (`ServiceProvider`) is used in backend routes.
- Pre-save hook must update `isSuspended` based on `suspendedAt`.
- Frontend must use correct API endpoints and handle errors gracefully.

---

## Next Steps
- Move to "Active Clients" management after confirming provider suspension/unsuspension is robust.

---

## Revision History
- 2025-08-23: Initial documentation by GitHub Copilot

---

For further details, see referenced backend and frontend files in the codebase.
