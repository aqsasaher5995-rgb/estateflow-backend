require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');

const app = express();

// ============ CORS FIX ============
app.use(cors({
  origin: ['http://localhost:5173', 'https://estateflow-frontend.vercel.app'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// ============ VERCEL COMPATIBLE MULTER SETUP ============
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only images are allowed'), false);
  }
};

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: fileFilter
});

console.log('📁 Running on Vercel - using memory storage for uploads');

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB Connected to Atlas'))
  .catch(err => console.log('❌ MongoDB Error:', err));

// ============ USER SCHEMA ============
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  phone: String,
  role: { type: String, default: 'tenant' }
});

const User = mongoose.model('User', userSchema);

// ============ PROPERTY SCHEMA ============
const propertySchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  type: { type: String, enum: ['apartment', 'house', 'commercial', 'land'], default: 'apartment' },
  status: { type: String, enum: ['available', 'rented', 'maintenance', 'sold'], default: 'available' },
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
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  views: { type: Number, default: 0 },
  isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

const Property = mongoose.model('Property', propertySchema);

// ============ PUBLIC STATS ROUTES ============
app.get('/api/users/count', async (req, res) => {
  try {
    const count = await User.countDocuments();
    res.json({ success: true, count });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/users/agents/count', async (req, res) => {
  try {
    const count = await User.countDocuments({ role: 'agent' });
    res.json({ success: true, count });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============ MAINTENANCE SCHEMA ============
const maintenanceRequestSchema = new mongoose.Schema({
  propertyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true },
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  category: { type: String, required: true },
  priority: { type: String, required: true },
  description: { type: String, required: true },
  status: { type: String, enum: ['pending', 'in_progress', 'resolved'], default: 'pending' }
}, { timestamps: true });

const MaintenanceRequest = mongoose.model('MaintenanceRequest', maintenanceRequestSchema);

// ============ REVIEW SCHEMA ============
const reviewSchema = new mongoose.Schema({
  propertyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userName: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true }
}, { timestamps: true });

const Review = mongoose.model('Review', reviewSchema);

// ============ RENT PAYMENT SCHEMA ============
const rentPaymentSchema = new mongoose.Schema({
  propertyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true },
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  month: { type: String, required: true },
  status: { type: String, default: 'paid' },
  cardLast4: { type: String, default: '4242' },
  transactionId: { type: String, required: true }
}, { timestamps: true });

const RentPayment = mongoose.model('RentPayment', rentPaymentSchema);

// ============ AUTH MIDDLEWARE ============

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }
    const decoded = jwt.verify(token, 'secret123');
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

// ============ REGISTER ============
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, phone, role } = req.body;
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashedPassword, phone, role: role || 'tenant' });
    await user.save();
    
    const token = jwt.sign({ id: user._id }, 'secret123', { expiresIn: '7d' });
    res.json({ 
      success: true, 
      message: 'User registered successfully', 
      data: { 
        user: { id: user._id, name, email, role: user.role }, 
        token 
      } 
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============ LOGIN ============
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: user._id }, 'secret123', { expiresIn: '7d' });
    res.json({ 
      success: true, 
      message: 'Login successful', 
      data: { 
        user: { id: user._id, name: user.name, email: user.email, role: user.role }, 
        token 
      } 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============ GET ME ROUTE ============
app.get('/api/auth/me', authMiddleware, async (req, res) => {
  res.json({ success: true, data: { user: req.user } });
});

// ============ UPDATE PROFILE ROUTE ============
app.put('/api/auth/update-profile', authMiddleware, async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    if (name) user.name = name;
    if (email) user.email = email;
    if (phone) user.phone = phone;
    
    await user.save();
    
    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { 
        user: { 
          id: user._id, 
          name: user.name, 
          email: user.email, 
          phone: user.phone, 
          role: user.role 
        } 
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============ PROPERTY ROUTES ============

app.get('/api/properties', async (req, res) => {
  try {
    const properties = await Property.find({ isDeleted: false }).populate('ownerId', 'name email').sort({ createdAt: -1 });
    res.json({ success: true, data: { properties } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/properties/:id', async (req, res) => {
  try {
    const property = await Property.findById(req.params.id).populate('ownerId', 'name email phone');
    if (!property) {
      return res.status(404).json({ success: false, message: 'Property not found' });
    }
    property.views += 1;
    await property.save();
    res.json({ success: true, data: { property } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============ CREATE PROPERTY WITH IMAGE ============
app.post('/api/properties', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    if (req.user.role !== 'owner' && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only owners can create properties' });
    }
    
    let body = req.body;
    
    if (typeof body.address === 'string') {
      body.address = JSON.parse(body.address);
    }
    if (typeof body.details === 'string') {
      body.details = JSON.parse(body.details);
    }
    if (typeof body.rent === 'string') {
      body.rent = JSON.parse(body.rent);
    }
    
    const propertyData = { ...body, ownerId: req.user._id };
    
    if (req.file) {
      propertyData.images = [`https://via.placeholder.com/400x300?text=${encodeURIComponent(body.title)}`];
    }
    
    const property = new Property(propertyData);
    await property.save();
    res.status(201).json({ success: true, message: 'Property created', data: { property } });
  } catch (error) {
    console.error('Create property error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.put('/api/properties/:id', authMiddleware, async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) {
      return res.status(404).json({ success: false, message: 'Property not found' });
    }
    if (property.ownerId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }
    const updated = await Property.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, message: 'Property updated', data: { property: updated } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.delete('/api/properties/:id', authMiddleware, async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) {
      return res.status(404).json({ success: false, message: 'Property not found' });
    }
    if (property.ownerId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }
    property.isDeleted = true;
    await property.save();
    res.json({ success: true, message: 'Property deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/properties/my/properties', authMiddleware, async (req, res) => {
  try {
    const properties = await Property.find({ ownerId: req.user._id, isDeleted: false }).sort({ createdAt: -1 });
    res.json({ success: true, data: { properties } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/properties/my/stats', authMiddleware, async (req, res) => {
  try {
    const total = await Property.countDocuments({ ownerId: req.user._id, isDeleted: false });
    const available = await Property.countDocuments({ ownerId: req.user._id, status: 'available', isDeleted: false });
    const rented = await Property.countDocuments({ ownerId: req.user._id, status: 'rented', isDeleted: false });
    res.json({ success: true, data: { total, available, rented, occupancyRate: total > 0 ? (rented / total) * 100 : 0 } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============ MAINTENANCE ENDPOINTS ============
app.post('/api/maintenance', authMiddleware, async (req, res) => {
  try {
    const { propertyId, title, category, priority, description } = req.body;
    
    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({ success: false, message: 'Property not found' });
    }
    
    const request = new MaintenanceRequest({
      propertyId,
      tenantId: req.user._id,
      ownerId: property.ownerId,
      title,
      category,
      priority,
      description,
      status: 'pending'
    });
    
    await request.save();
    res.status(201).json({ success: true, message: 'Maintenance request submitted', data: { request } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/maintenance/my', authMiddleware, async (req, res) => {
  try {
    const requests = await MaintenanceRequest.find({ tenantId: req.user._id })
      .populate('propertyId', 'title address')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: { requests } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/maintenance/owner', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'owner' && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }
    const requests = await MaintenanceRequest.find({ ownerId: req.user._id })
      .populate('propertyId', 'title address')
      .populate('tenantId', 'name email phone')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: { requests } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.put('/api/maintenance/:id/status', authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    const request = await MaintenanceRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }
    
    if (request.ownerId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }
    
    request.status = status;
    await request.save();
    res.json({ success: true, message: 'Status updated', data: { request } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============ REVIEWS ENDPOINTS ============
app.post('/api/properties/:id/reviews', authMiddleware, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const propertyId = req.params.id;
    
    const review = new Review({
      propertyId,
      userId: req.user._id,
      userName: req.user.name,
      rating: parseInt(rating),
      comment
    });
    
    await review.save();
    res.status(201).json({ success: true, message: 'Review added successfully', data: { review } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/properties/:id/reviews', async (req, res) => {
  try {
    const reviews = await Review.find({ propertyId: req.params.id }).sort({ createdAt: -1 });
    res.json({ success: true, data: { reviews } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============ PAYMENTS ENDPOINTS ============
app.post('/api/payments', authMiddleware, async (req, res) => {
  try {
    const { propertyId, amount, month, cardLast4 } = req.body;
    
    const payment = new RentPayment({
      propertyId,
      tenantId: req.user._id,
      amount,
      month,
      cardLast4: cardLast4 || '4242',
      transactionId: 'TXN-' + Math.random().toString(36).substr(2, 9).toUpperCase()
    });
    
    await payment.save();
    res.status(201).json({ success: true, message: 'Payment recorded successfully', data: { payment } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/payments/my', authMiddleware, async (req, res) => {
  try {
    const payments = await RentPayment.find({ tenantId: req.user._id })
      .populate('propertyId', 'title address')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: { payments } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============ LEASE SCHEMA ============
const leaseSchema = new mongoose.Schema({
  propertyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true },
  tenantId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  ownerId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  startDate:  { type: Date, required: true },
  endDate:    { type: Date, required: true },
  monthlyRent:{ type: Number, required: true },
  deposit:    { type: Number, default: 0 },
  status:     { type: String, enum: ['active', 'expired', 'terminated'], default: 'active' },
  notes:      { type: String, default: '' }
}, { timestamps: true });

const Lease = mongoose.model('Lease', leaseSchema);

// ============ LEASE ENDPOINTS ============
app.post('/api/leases', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'owner' && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only owners can create leases' });
    }
    const lease = new Lease({ ...req.body, ownerId: req.user._id });
    await lease.save();
    res.status(201).json({ success: true, message: 'Lease created', data: { lease } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/leases/my', authMiddleware, async (req, res) => {
  try {
    const query = req.user.role === 'tenant'
      ? { tenantId: req.user._id }
      : { ownerId: req.user._id };
    const leases = await Lease.find(query)
      .populate('propertyId', 'title address images rent')
      .populate('tenantId', 'name email phone')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: { leases } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.put('/api/leases/:id', authMiddleware, async (req, res) => {
  try {
    const lease = await Lease.findById(req.params.id);
    if (!lease) return res.status(404).json({ success: false, message: 'Lease not found' });
    if (lease.ownerId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }
    const updated = await Lease.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, message: 'Lease updated', data: { lease: updated } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============ ADMIN ENDPOINTS ============
const adminOnly = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin access required' });
  }
  next();
};

app.get('/api/admin/stats', authMiddleware, adminOnly, async (req, res) => {
  try {
    const [users, properties, maintenance, payments] = await Promise.all([
      User.countDocuments(),
      Property.countDocuments({ isDeleted: false }),
      MaintenanceRequest.countDocuments(),
      RentPayment.find({ status: 'paid' })
    ]);
    const revenue = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    res.json({ success: true, data: { users, properties, maintenance, revenue } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/admin/users', authMiddleware, adminOnly, async (req, res) => {
  try {
    const users = await User.find({}, '-password').sort({ createdAt: -1 });
    res.json({ success: true, data: { users } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.put('/api/admin/users/:id/role', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { role } = req.body;
    if (!['tenant', 'owner', 'agent', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true, select: '-password' });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, message: 'Role updated', data: { user } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/admin/maintenance', authMiddleware, adminOnly, async (req, res) => {
  try {
    const requests = await MaintenanceRequest.find()
      .populate('propertyId', 'title address')
      .populate('tenantId', 'name email phone')
      .populate('ownerId', 'name email')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: { requests } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============ OWNER PAYMENTS ENDPOINT ============
app.get('/api/payments/owner', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'owner' && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }
    const myProperties = await Property.find({ ownerId: req.user._id, isDeleted: false }, '_id');
    const propertyIds = myProperties.map(p => p._id);
    const payments = await RentPayment.find({ propertyId: { $in: propertyIds } })
      .populate('propertyId', 'title')
      .populate('tenantId', 'name email')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: { payments } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/', (req, res) => {
  res.json({ message: 'Real Estate API is running! 🏠' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

module.exports = app;