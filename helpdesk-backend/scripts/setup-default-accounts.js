import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { createDefaultAccounts, createDefaultAccount, checkDefaultAccounts, getDefaultCredentials } from '../utils/createDefaultAccounts.js';

// Load environment variables from root .env file
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('🔗 Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Main setup function
async function setupDefaultAccounts() {
  try {
    await connectDB();
    
    // Get command line arguments
    const args = process.argv.slice(2);
    const command = args[0];
    
    switch (command) {
      case 'create':
        const accountType = args[1]; // admin, agent, user, or all
        if (accountType && accountType !== 'all') {
          await createDefaultAccount(accountType);
        } else {
          await createDefaultAccounts();
        }
        break;
        
      case 'check':
        const status = await checkDefaultAccounts();
        console.log('\n📋 Default Account Status:');
        console.log('=============================');
        Object.entries(status).forEach(([role, info]) => {
          const statusIcon = info.exists ? '✅' : '❌';
          console.log(`${statusIcon} ${role.toUpperCase()}: ${info.email} ${info.exists ? '(exists)' : '(missing)'}`);
        });
        break;
        
      case 'credentials':
        const credentials = getDefaultCredentials();
        console.log('\n🔑 Default Account Credentials:');
        console.log('===============================');
        credentials.forEach(cred => {
          console.log(`👤 ${cred.role.toUpperCase()}: ${cred.email} / ${cred.password}`);
          console.log(`   ${cred.description}`);
        });
        console.log('\n⚠️  SECURITY WARNING: Change these passwords immediately!');
        break;
        
      case 'help':
      default:
        console.log('\n🛠️  Default Accounts Setup Script');
        console.log('==================================');
        console.log('Usage: npm run setup-accounts [command] [options]');
        console.log('');
        console.log('Commands:');
        console.log('  create [type]    Create default accounts');
        console.log('                   type: admin, agent, user, or all (default)');
        console.log('  check           Check which default accounts exist');
        console.log('  credentials     Show default account credentials');
        console.log('  help            Show this help message');
        console.log('');
        console.log('Examples:');
        console.log('  npm run setup-accounts create        # Create all default accounts');
        console.log('  npm run setup-accounts create admin  # Create only admin account');
        console.log('  npm run setup-accounts check         # Check account status');
        console.log('  npm run setup-accounts credentials   # Show credentials');
        break;
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  } finally {
    // Close MongoDB connection
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('\n🔗 MongoDB connection closed');
    }
  }
}

// Run the setup
setupDefaultAccounts()
  .then(() => {
    console.log('\n✅ Setup complete!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n❌ Setup failed:', err.message);
    process.exit(1);
  }); 