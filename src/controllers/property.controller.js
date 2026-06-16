import Property from '../models/Property.model.js';
import AppError from '../utils/AppError.js';
import catchAsync from '../utils/catchAsync.js';

export const createProperty = catchAsync(async (req, res, next) => {
  const property = await Property.create({
    ...req.body,
    ownerId: req.user._id
  });
  
  res.status(201).json({
    success: true,
    data: { property }
  });
});

export const getAllProperties = catchAsync(async (req, res, next) => {
  const properties = await Property.find({ isDeleted: false })
    .populate('ownerId', 'name email')
    .sort({ createdAt: -1 });
  
  res.status(200).json({
    success: true,
    data: { properties }
  });
});

export const getPropertyById = catchAsync(async (req, res, next) => {
  const property = await Property.findById(req.params.id)
    .populate('ownerId', 'name email phone');
  
  if (!property || property.isDeleted) {
    return next(new AppError('Property not found', 404));
  }
  
  res.status(200).json({
    success: true,
    data: { property }
  });
});

export const updateProperty = catchAsync(async (req, res, next) => {
  const property = await Property.findById(req.params.id);
  
  if (!property || property.isDeleted) {
    return next(new AppError('Property not found', 404));
  }
  
  if (property.ownerId.toString() !== req.user._id.toString()) {
    return next(new AppError('You can only update your own properties', 403));
  }
  
  const updatedProperty = await Property.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );
  
  res.status(200).json({
    success: true,
    data: { property: updatedProperty }
  });
});

export const deleteProperty = catchAsync(async (req, res, next) => {
  const property = await Property.findById(req.params.id);
  
  if (!property || property.isDeleted) {
    return next(new AppError('Property not found', 404));
  }
  
  if (property.ownerId.toString() !== req.user._id.toString()) {
    return next(new AppError('You can only delete your own properties', 403));
  }
  
  property.isDeleted = true;
  await property.save();
  
  res.status(200).json({
    success: true,
    message: 'Property deleted successfully'
  });
});

export const getMyProperties = catchAsync(async (req, res, next) => {
  const properties = await Property.find({ 
    ownerId: req.user._id, 
    isDeleted: false 
  }).sort({ createdAt: -1 });
  
  res.status(200).json({
    success: true,
    data: { properties }
  });
});