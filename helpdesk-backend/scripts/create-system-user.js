import mongoose from 'mongoose';
import User from '../models/User.model.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
dotenv.config();

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

// System user details
const SYSTEM_USER = {
  firstName: 'System',
  lastName: 'Bot',
  email: 'system@glitchbytez.com',
  password: Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12),
  role: 'system',
  requirePasswordChange: false
};

// Create system user if it doesn't exist
async function createSystemUser() {
  try {
    // Check if system user already exists
    const existingUser = await User.findOne({ email: SYSTEM_USER.email });
    
    if (existingUser) {
      console.log('System user already exists with ID:', existingUser._id);
      return existingUser._id;
    }
    
    // Create new system user
    const newUser = await User.create(SYSTEM_USER);
    console.log('System user created with ID:', newUser._id);
    
    return newUser._id;
  } catch (error) {
    console.error('Error creating system user:', error);
    throw error;
  } finally {
    // Close MongoDB connection
    mongoose.connection.close();
  }
}

// Run the function
createSystemUser()
  .then((systemUserId) => {
    console.log('System user ID:', systemUserId);
    console.log('Please update your .env file with:');
    console.log(`SYSTEM_USER_ID=${systemUserId}`);
    process.exit(0);
  })
  .catch((err) => {
    console.error('Error:', err);
    process.exit(1);
  });
