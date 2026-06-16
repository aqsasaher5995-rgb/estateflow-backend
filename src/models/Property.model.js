import mongoose from 'mongoose';

const propertySchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Description is required']
  },
  type: {
    type: String,
    enum: ['apartment', 'house', 'commercial', 'land'],
    required: true
  },
  status: {
    type: String,
    enum: ['available', 'rented', 'maintenance', 'sold'],
    default: 'available'
  },
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String
  },
  details: {
    bedrooms: { type: Number, default: 0 },
    bathrooms: { type: Number, default: 0 },
    area: Number,
    furnishing: String
  },
  rent: {
    amount: { type: Number, required: true },
    deposit: Number,
    maintenance: Number
  },
  images: [String],
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  views: { type: Number, default: 0 },
  isDeleted: { type: Boolean, default: false }
}, {
  timestamps: true
});

const Property = mongoose.model('Property', propertySchema);
export default Property;