import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

const propertySchema = new mongoose.Schema({
  title: String,
  description: String,
  type: { type: String, default: 'apartment' },
  status: { type: String, default: 'available' },
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String
  },
  details: {
    bedrooms: Number,
    bathrooms: Number,
    area: Number,
    furnishing: String
  },
  rent: {
    amount: Number,
    deposit: Number,
    maintenance: Number
  },
  images: [String],
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  views: { type: Number, default: 0 },
  isDeleted: { type: Boolean, default: false }
});

const Property = mongoose.model('Property', propertySchema);

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  phone: String,
  role: { type: String, default: 'tenant' }
});

const User = mongoose.model('User', userSchema);

const propertyImages = [
  "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=800&h=600&fit=crop"
];

// Default properties (50 properties)
const defaultProperties = [
  { title: "Luxury Apartment in DHA", description: "Beautiful 3 bedroom apartment with modern amenities", city: "Karachi", state: "Sindh", rent: 85000, beds: 3, baths: 2, area: 1500 },
  { title: "Family House in Gulshan", description: "Spacious house with garden", city: "Karachi", state: "Sindh", rent: 65000, beds: 4, baths: 3, area: 2000 },
  { title: "Studio Apartment Clifton", description: "Perfect for singles and couples", city: "Karachi", state: "Sindh", rent: 45000, beds: 1, baths: 1, area: 800 },
  { title: "Penthouse in Bahria Town", description: "Luxury penthouse with sea view", city: "Lahore", state: "Punjab", rent: 120000, beds: 4, baths: 4, area: 2500 },
  { title: "Modern Apartment in Gulberg", description: "Newly built modern apartment", city: "Lahore", state: "Punjab", rent: 70000, beds: 2, baths: 2, area: 1200 },
  { title: "Commercial Office Space", description: "Prime location office space", city: "Karachi", state: "Sindh", rent: 150000, beds: 0, baths: 2, area: 3000 },
  { title: "Beach View Villa", description: "Luxury villa with private beach access", city: "Karachi", state: "Sindh", rent: 200000, beds: 5, baths: 5, area: 4000 },
  { title: "Affordable Apartment", description: "Budget friendly apartment", city: "Rawalpindi", state: "Punjab", rent: 25000, beds: 2, baths: 1, area: 900 },
  { title: "Townhouse in E-11", description: "Modern townhouse", city: "Islamabad", state: "ICT", rent: 90000, beds: 3, baths: 3, area: 1800 },
  { title: "Farmhouse on M2", description: "Peaceful farmhouse getaway", city: "Lahore", state: "Punjab", rent: 180000, beds: 6, baths: 5, area: 5000 },
  { title: "Corporate Office F-10", description: "Premium office space", city: "Islamabad", state: "ICT", rent: 130000, beds: 0, baths: 3, area: 2800 },
  { title: "Studio in Johar Town", description: "Compact studio", city: "Lahore", state: "Punjab", rent: 35000, beds: 1, baths: 1, area: 650 },
  { title: "Duplex in Defence", description: "Double story luxury home", city: "Karachi", state: "Sindh", rent: 160000, beds: 5, baths: 4, area: 3200 },
  { title: "Apartment Near Airport", description: "Convenient location", city: "Karachi", state: "Sindh", rent: 55000, beds: 2, baths: 2, area: 1100 },
  { title: "House in Askari", description: "Secure gated community", city: "Rawalpindi", state: "Punjab", rent: 75000, beds: 4, baths: 3, area: 2200 },
  { title: "Penthouse in Mall Road", description: "Central location penthouse", city: "Lahore", state: "Punjab", rent: 110000, beds: 3, baths: 3, area: 2100 },
  { title: "Cozy Home in PECHS", description: "Family friendly neighborhood", city: "Karachi", state: "Sindh", rent: 50000, beds: 3, baths: 2, area: 1400 },
  { title: "Luxury Condo in Blue Area", description: "High-end condo", city: "Islamabad", state: "ICT", rent: 95000, beds: 2, baths: 2, area: 1300 },
  { title: "Shop in Saddar", description: "Commercial shop", city: "Rawalpindi", state: "Punjab", rent: 80000, beds: 0, baths: 1, area: 500 },
  { title: "Warehouse in Industrial Area", description: "Large storage space", city: "Karachi", state: "Sindh", rent: 100000, beds: 0, baths: 2, area: 5000 },
  { title: "Apartment in F-7", description: "Upscale apartment", city: "Islamabad", state: "ICT", rent: 105000, beds: 3, baths: 3, area: 1700 },
  { title: "House in DHA Phase 8", description: "Modern home", city: "Karachi", state: "Sindh", rent: 140000, beds: 5, baths: 4, area: 3500 },
  { title: "Studio in North Nazimabad", description: "Affordable studio", city: "Karachi", state: "Sindh", rent: 30000, beds: 1, baths: 1, area: 700 },
  { title: "Townhouse in G-13", description: "Family townhouse", city: "Islamabad", state: "ICT", rent: 70000, beds: 3, baths: 2, area: 1600 },
  { title: "Apartment in Model Town", description: "Peaceful area", city: "Lahore", state: "Punjab", rent: 60000, beds: 2, baths: 2, area: 1250 },
  { title: "Cottage in Bhurban", description: "Mountain view cottage", city: "Murree", state: "Punjab", rent: 50000, beds: 3, baths: 2, area: 1500 },
  { title: "Office in I-8", description: "Corporate office", city: "Islamabad", state: "ICT", rent: 85000, beds: 0, baths: 2, area: 2000 },
  { title: "Apartment in Satellite Town", description: "Convenient location", city: "Rawalpindi", state: "Punjab", rent: 40000, beds: 2, baths: 1, area: 950 },
  { title: "House in Bahadurabad", description: "Established neighborhood", city: "Karachi", state: "Sindh", rent: 80000, beds: 4, baths: 3, area: 2300 },
  { title: "Penthouse in G-10", description: "Modern penthouse", city: "Islamabad", state: "ICT", rent: 115000, beds: 3, baths: 3, area: 2200 },
  { title: "Studio in F-11", description: "Compact living", city: "Islamabad", state: "ICT", rent: 38000, beds: 1, baths: 1, area: 750 },
  { title: "Shop in Tariq Road", description: "Commercial shop", city: "Karachi", state: "Sindh", rent: 90000, beds: 0, baths: 1, area: 450 },
  { title: "Apartment in Hussainabad", description: "Affordable living", city: "Karachi", state: "Sindh", rent: 35000, beds: 2, baths: 1, area: 850 },
  { title: "House in Wapda Town", description: "Family home", city: "Lahore", state: "Punjab", rent: 65000, beds: 4, baths: 3, area: 2100 },
  { title: "Office in Civic Center", description: "Prime location", city: "Islamabad", state: "ICT", rent: 95000, beds: 0, baths: 2, area: 2200 },
  { title: "Apartment in KDA Scheme", description: "Modern apartment", city: "Karachi", state: "Sindh", rent: 48000, beds: 2, baths: 2, area: 1050 },
  { title: "House in Askari 10", description: "Army housing scheme", city: "Rawalpindi", state: "Punjab", rent: 85000, beds: 4, baths: 3, area: 2400 },
  { title: "Studio in Clifton Block 4", description: "Luxury studio", city: "Karachi", state: "Sindh", rent: 55000, beds: 1, baths: 1, area: 850 },
  { title: "Penthouse in DHA Phase 2", description: "Premium penthouse", city: "Islamabad", state: "ICT", rent: 130000, beds: 4, baths: 4, area: 2800 },
  { title: "Shop in Liberty Market", description: "Commercial property", city: "Lahore", state: "Punjab", rent: 120000, beds: 0, baths: 1, area: 600 },
  { title: "House in Gulshan-e-Maymar", description: "Spacious home", city: "Karachi", state: "Sindh", rent: 45000, beds: 3, baths: 2, area: 1800 },
  { title: "Apartment in E-11", description: "Modern apartment", city: "Islamabad", state: "ICT", rent: 65000, beds: 2, baths: 2, area: 1200 },
  { title: "Office in DHA", description: "Corporate office", city: "Karachi", state: "Sindh", rent: 140000, beds: 0, baths: 3, area: 3200 },
  { title: "House in Johar Town Block A", description: "Family home", city: "Lahore", state: "Punjab", rent: 70000, beds: 4, baths: 3, area: 2200 },
  { title: "Studio in I-9", description: "Budget studio", city: "Islamabad", state: "ICT", rent: 28000, beds: 1, baths: 1, area: 650 },
  { title: "Apartment in Gulshan-e-Iqbal", description: "Central location", city: "Karachi", state: "Sindh", rent: 52000, beds: 2, baths: 2, area: 1100 },
  { title: "Townhouse in G-11", description: "Modern townhouse", city: "Islamabad", state: "ICT", rent: 80000, beds: 3, baths: 3, area: 1800 },
  { title: "House in Askari 11", description: "Secure community", city: "Rawalpindi", state: "Punjab", rent: 75000, beds: 4, baths: 3, area: 2300 },
  { title: "Penthouse in Shahrah-e-Faisal", description: "Luxury penthouse", city: "Karachi", state: "Sindh", rent: 170000, beds: 4, baths: 4, area: 3200 }
];

async function addDefaultProperties() {
  try {
    await mongoose.connect('mongodb://localhost:27017/real_estate_db');
    console.log('✅ MongoDB Connected');

    // Get owner or admin user, create if none exists
    let owner = await User.findOne({ role: 'owner' });
    if (!owner) {
      owner = await User.findOne({ role: 'admin' });
    }
    if (!owner) {
      const hashedPassword = await bcrypt.hash('password123', 10);
      owner = new User({
        name: 'EstateFlow Partner',
        email: 'owner@estateflow.com',
        password: hashedPassword,
        phone: '03001234567',
        role: 'owner'
      });
      await owner.save();
      console.log('✅ Created default owner user: owner@estateflow.com');
    }
    const ownerId = owner._id;

    let added = 0;
    for (let i = 0; i < defaultProperties.length; i++) {
      const prop = defaultProperties[i];
      const existing = await Property.findOne({ title: prop.title });
      if (!existing) {
        const property = new Property({
          title: prop.title,
          description: prop.description,
          type: prop.title.toLowerCase().includes('office') || prop.title.toLowerCase().includes('warehouse') || prop.title.toLowerCase().includes('shop') ? 'commercial' : prop.title.toLowerCase().includes('land') ? 'land' : 'apartment',
          status: 'available',
          address: { street: 'Main Street', city: prop.city, state: prop.state, pincode: '44000' },
          details: { bedrooms: prop.beds, bathrooms: prop.baths, area: prop.area, furnishing: 'unfurnished' },
          rent: { amount: prop.rent, deposit: prop.rent * 2, maintenance: Math.round(prop.rent * 0.05) },
          images: [propertyImages[i % propertyImages.length]],
          ownerId: ownerId,
          views: Math.floor(Math.random() * 200) + 15,
          isDeleted: false
        });
        await property.save();
        added++;
      }
    }
    console.log(`✅ Added ${added} new properties`);
    console.log(`Total properties in DB: ${await Property.countDocuments()}`);
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
}

addDefaultProperties();