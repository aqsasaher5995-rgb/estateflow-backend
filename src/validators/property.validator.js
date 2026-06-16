import { body } from 'express-validator';

export const createPropertyValidator = [
  body('title')
    .notEmpty().withMessage('Title is required')
    .isLength({ min: 5, max: 100 }).withMessage('Title must be 5-100 characters'),
  
  body('description')
    .notEmpty().withMessage('Description is required')
    .isLength({ min: 20 }).withMessage('Description must be at least 20 characters'),
  
  body('type')
    .notEmpty().withMessage('Property type is required')
    .isIn(['apartment', 'house', 'commercial', 'land']).withMessage('Invalid property type'),
  
  body('address.street')
    .notEmpty().withMessage('Street address is required'),
  
  body('address.city')
    .notEmpty().withMessage('City is required'),
  
  body('address.state')
    .notEmpty().withMessage('State is required'),
  
  body('address.pincode')
    .notEmpty().withMessage('Pincode is required')
    .isLength({ min: 6, max: 6 }).withMessage('Pincode must be 6 digits'),
  
  body('details.bedrooms')
    .optional()
    .isInt({ min: 0 }).withMessage('Bedrooms must be a positive number'),
  
  body('details.bathrooms')
    .optional()
    .isInt({ min: 0 }).withMessage('Bathrooms must be a positive number'),
  
  body('details.area')
    .notEmpty().withMessage('Area is required')
    .isFloat({ min: 0 }).withMessage('Area must be a positive number'),
  
  body('rent.amount')
    .notEmpty().withMessage('Rent amount is required')
    .isFloat({ min: 0 }).withMessage('Rent amount must be positive'),
  
  body('rent.deposit')
    .optional()
    .isFloat({ min: 0 }).withMessage('Deposit must be positive'),
  
  body('rent.maintenance')
    .optional()
    .isFloat({ min: 0 }).withMessage('Maintenance must be positive')
];

export const updatePropertyValidator = [
  body('title')
    .optional()
    .isLength({ min: 5, max: 100 }).withMessage('Title must be 5-100 characters'),
  
  body('description')
    .optional()
    .isLength({ min: 20 }).withMessage('Description must be at least 20 characters'),
  
  body('status')
    .optional()
    .isIn(['available', 'rented', 'maintenance', 'sold']).withMessage('Invalid status'),
  
  body('rent.amount')
    .optional()
    .isFloat({ min: 0 }).withMessage('Rent amount must be positive')
];