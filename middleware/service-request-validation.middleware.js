import { body, param } from 'express-validator';

export const createRequestValidation = [
  body('clientId').isMongoId().withMessage('Valid client ID required'),
  body('providerId').isMongoId().withMessage('Valid provider ID required'),
  body('serviceType').notEmpty().withMessage('Service type is required'),
  body('scheduledDate').isISO8601().withMessage('Valid date required'),
  body('location.coordinates').isArray().withMessage('Valid coordinates required'),
  body('amount').isNumeric().withMessage('Valid amount required'),
];

export const updateStatusValidation = [
  param('id').isMongoId().withMessage('Valid request ID required'),
  body('status').isIn(['accepted', 'rejected', 'completed', 'cancelled'])
    .withMessage('Invalid status'),
  body('rejectionReason')
    .if(body('status').equals('rejected'))
    .notEmpty()
    .withMessage('Rejection reason required when rejecting'),
];
