// Import all models first - FIXED CASE SENSITIVITY
import Job from './job.js';
import { ServiceProvider } from './ServiceProvider.js';
import { ServiceArea } from './service-area.model.js';
import Review from './Review.js';
import { Admin } from './admin.model.js';
// ...existing code...
import Payment from './Payment.js';
import { Transaction } from './transaction.model.js';
import { Client } from './client.model.js';
import { ClientReview } from './clientReview.model.js';
import { User } from './User.js';
import { Booking, VALID_STATUSES } from './booking.model.js';
import { Certification } from './certification.model.js';
import { Availability } from './Availability.js';
import { ServiceRequest } from './serviceRequest.js';
import { ActivityLog } from './activityLog.js';
import { Notification } from './notification.model.js';
import Rating from './rating.model.js';
import Chat from './chat.model.js';
import Message from './message.model.js';

// Create Service model if it doesn't exist - map to ServiceProvider for compatibility
const Service = ServiceProvider;

// Service configurations
const SERVICE_REQUESTS_COLLECTION = 'servicerequests';
const CLIENT_REVIEWS_COLLECTION = 'clientReviews';

// Export everything
export {
  ServiceProvider,
  ServiceProvider as Provider, // Alias export
  Service, // Export the Service model
  ServiceArea,
  Review,
  Admin,
  Job,
  Payment,
  Transaction,
  Client,
  ClientReview,
  User,
  Booking,
  VALID_STATUSES,
  Certification,
  Availability,
  ServiceRequest,
  ActivityLog,
  Notification,
  Rating,
  Chat,
  Message
};

// Export models with different names to avoid conflicts
export { User as UserModel } from './User.js';
export { Client as ClientModel } from './client.model.js';
export { ServiceProvider as ServiceProviderModel } from './ServiceProvider.js';
export { ServiceProvider as ServiceModel } from './ServiceProvider.js';
export { Admin as AdminModel } from './admin.model.js';
export { Booking as BookingModel } from './booking.model.js';
// Removed duplicate import
// ...existing code...
export { Notification as NotificationModel } from './notification.model.js';
export { default as Suspension } from './suspension.js';
export { BlockedClient } from './blocked-client.js';
export { default as ProviderDocument } from './provider_document.js';

// Export default exports for models that need them
export { default as RatingDefault } from './rating.model.js';
export { default as ChatDefault } from './chat.model.js';
export { default as MessageDefault } from './message.model.js';

// Export constants
export const BOOKING_STATUSES = ['pending', 'accepted', 'in_progress', 'completed', 'cancelled'];
export const NOTIFICATION_TYPES = [
  'BOOKING_REQUEST',
  'NEW_BOOKING',
  'BOOKING_ACCEPTED', 
  'BOOKING_REJECTED',
  'BOOKING_CANCELLED',
  'JOB_CREATED',
  'JOB_UPDATE',
  'PAYMENT_RECEIVED',
  'PAYMENT_REQUEST',
  'ACCOUNT_BLOCKED',
  'SUSPENSION_ALERT',
  'SYSTEM_ALERT',
  'ERROR',
  'NEW_RATING'
];

// Initialize models - call only once
const initializeModels = (() => {
  let initialized = false;
  return () => {
    if (!initialized) {
      const collections = { SERVICE_REQUESTS_COLLECTION, CLIENT_REVIEWS_COLLECTION };
      console.log('🔄 Initializing models with collections:', collections);
      const timestamp = new Date().toISOString();
      console.log('Models initialized:', { timestamp });
      initialized = true;
    }
  };
})();

initializeModels();
