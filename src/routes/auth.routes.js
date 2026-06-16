import express from 'express';
import User from '../models/User.model.js';
import jwt from 'jsonwebtoken';

const router = express.Router();

router.post('/register', async (req, res) => {
  console.log('🚀 Register endpoint HIT!');
  console.log('Body:', req.body);
  
  try {
    const { name, email, password, phone, role } = req.body;
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }
    
    const user = new User({ name, email, password, phone, role: role || 'tenant' });
    await user.save();
    
    const token = jwt.sign({ id: user._id }, 'secret123', { expiresIn: '7d' });
    
    res.status(201).json({
      success: true,
      message: 'User registered',
      data: { user: { id: user._id, name, email, role: user.role }, token }
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/login', async (req, res) => {
  console.log('🔐 Login endpoint HIT!');
  
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    
    const token = jwt.sign({ id: user._id }, 'secret123', { expiresIn: '7d' });
    
    res.json({
      success: true,
      message: 'Login successful',
      data: { user: { id: user._id, name: user.name, email, role: user.role }, token }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;