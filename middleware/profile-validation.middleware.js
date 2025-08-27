import { body, validationResult } from 'express-validator';

// Validation rules
const validationRules = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),

  body('phoneNumber')
    .optional()
    .matches(/^\+?[\d\s-]{10,}$/)
    .withMessage('Invalid phone number format'),

  body('backupContact')
    .optional()
    .matches(/^\+?[\d\s-]{10,}$/)
    .withMessage('Invalid backup contact format'),

  body('preferredCommunication')
    .optional()
    .isIn(['SMS', 'Email', 'Both'])
    .withMessage('Invalid communication preference'),

  body('timezone')
    .optional()
    .custom((value) => {
      try {
        Intl.DateTimeFormat(undefined, { timeZone: value });
        return true;
      } catch (e) {
        throw new Error('Invalid timezone');
      }
    }),

  body('location')
    .optional()
    .isObject()
    .withMessage('Location must be an object')
    .custom((value) => {
      if (value.type !== 'Point' || !Array.isArray(value.coordinates)) {
        throw new Error('Invalid location format');
      }
      const [lng, lat] = value.coordinates;
      if (lng < -180 || lng > 180 || lat < -90 || lat > 90) {
        throw new Error('Invalid coordinates');
      }
      return true;
    })
];

export const validateProfileUpdate = [
  ...validationRules,
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    next();
  }
];

export default validateProfileUpdate;
