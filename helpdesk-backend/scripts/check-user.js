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

async function checkUser() {
  try {
    await connectDB();
    
    // Find the admin user
    const user = await User.findOne({ email: 'admin@example.com' }).select('+password');
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }
    
    console.log('✅ User found:');
    console.log(`Email: ${user.email}`);
    console.log(`Role: ${user.role}`);
    console.log(`Password hash: ${user.password}`);
    console.log(`First name: ${user.firstName}`);
    console.log(`Last name: ${user.lastName}`);
    
    // Test password comparison
    const testPassword = 'password';
    const isMatch = await user.correctPassword(testPassword, user.password);
    
    console.log(`\nPassword test with "${testPassword}": ${isMatch ? '✅ MATCH' : '❌ NO MATCH'}`);
    
    // Test with wrong password
    const wrongPassword = 'wrongpassword';
    const wrongMatch = await user.correctPassword(wrongPassword, user.password);
    
    console.log(`Password test with "${wrongPassword}": ${wrongMatch ? '✅ MATCH' : '❌ NO MATCH'}`);
    
  } catch (error) {
    console.error('Error checking user:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the function
checkUser()
  .then(() => {
    console.log('\n✅ Check complete!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n❌ Error:', err.message);
    process.exit(1);
  }); 