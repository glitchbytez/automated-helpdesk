import mongoose from 'mongoose';
import User from '../models/User.model.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Admin user details
const ADMIN_USER = {
  firstName: 'Admin',
  lastName: 'User',
  email: 'admin@example.com',
  password: 'password', // This will be hashed by the User model
  role: 'admin',
  team: 'support', // Valid enum: "support", "technical", "billing"
  permissions: ['viewTickets', 'createTickets', 'assignTickets', 'deleteTickets', 'manageAgents', 'manageSettings'], // All available permissions
  requirePasswordChange: false
};

// Create admin user if it doesn't exist
async function createAdminUser() {
  try {
    await connectDB();
    
    // Check if admin user already exists
    const existingUser = await User.findOne({ email: ADMIN_USER.email });
    
    if (existingUser) {
      console.log('Admin user already exists:');
      console.log(`Email: ${existingUser.email}`);
      console.log(`Role: ${existingUser.role}`);
      console.log(`ID: ${existingUser._id}`);
      return existingUser._id;
    }
    
    // Create new admin user
    const newUser = await User.create(ADMIN_USER);
    console.log('Admin user created successfully:');
    console.log(`Email: ${newUser.email}`);
    console.log(`Role: ${newUser.role}`);
    console.log(`ID: ${newUser._id}`);
    console.log(`\nYou can now login with:`);
    console.log(`Email: ${ADMIN_USER.email}`);
    console.log(`Password: ${ADMIN_USER.password}`);
    
    return newUser._id;
  } catch (error) {
    console.error('Error creating admin user:', error);
    throw error;
  } finally {
    // Close MongoDB connection
    mongoose.connection.close();
  }
}

// Run the function
createAdminUser()
  .then(() => {
    console.log('\n✅ Setup complete!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n❌ Error:', err.message);
    process.exit(1);
  }); 