import User from '../models/User.model.js';

// Default accounts configuration
const DEFAULT_ACCOUNTS = [
  {
    firstName: 'System',
    lastName: 'Administrator',
    email: 'admin@example.com',
    password: 'admin123',
    role: 'admin',
    team: 'support',
    permissions: [
      'viewTickets',
      'createTickets', 
      'assignTickets',
      'deleteTickets',
      'manageAgents',
      'manageSettings',
      'manageKnowledgeBase'
    ],
    requirePasswordChange: true, // Force password change on first login
    status: 'active'
  },
  {
    firstName: 'Demo',
    lastName: 'Agent',
    email: 'agent@example.com',
    password: 'agent123',
    role: 'agent',
    team: 'support',
    permissions: [
      'viewTickets',
      'createTickets',
      'assignTickets'
    ],
    requirePasswordChange: true,
    status: 'active'
  },
  {
    firstName: 'Demo',
    lastName: 'User',
    email: 'user@example.com',
    password: 'user123',
    role: 'limited',
    team: 'support',
    permissions: [
      'viewTickets',
      'createTickets'
    ],
    requirePasswordChange: true,
    status: 'active'
  }
];

/**
 * Creates default accounts if the User collection is empty
 * @returns {Promise<boolean>} True if accounts were created, false if they already existed
 */
export async function createDefaultAccounts() {
  try {
    // Check if any users exist in the database
    const userCount = await User.countDocuments();
    
    if (userCount > 0) {
      console.log(`🔍 Found ${userCount} existing users. Skipping default account creation.`);
      return false;
    }

    console.log('📝 No users found in database. Creating default accounts...');

    // Create all default accounts
    const createdAccounts = [];
    
    for (const accountData of DEFAULT_ACCOUNTS) {
      try {
        // Check if account with this email already exists (extra safety)
        const existingUser = await User.findOne({ email: accountData.email });
        
        if (existingUser) {
          console.log(`⚠️  User with email ${accountData.email} already exists. Skipping.`);
          continue;
        }

        // Create the account
        const newUser = await User.create(accountData);
        createdAccounts.push({
          id: newUser._id,
          email: newUser.email,
          role: newUser.role,
          fullName: newUser.fullName
        });

        console.log(`✅ Created ${newUser.role} account: ${newUser.email}`);
        
      } catch (error) {
        console.error(`❌ Error creating account ${accountData.email}:`, error.message);
        // Continue creating other accounts even if one fails
      }
    }

    if (createdAccounts.length > 0) {
      console.log('\n🎉 Default accounts created successfully!');
      console.log('\n📋 Login Credentials:');
      console.log('==========================================');
      
      DEFAULT_ACCOUNTS.forEach(account => {
        const created = createdAccounts.find(c => c.email === account.email);
        if (created) {
          console.log(`👤 ${account.role.toUpperCase()}: ${account.email} / ${account.password}`);
        }
      });
      
      console.log('==========================================');
      console.log('⚠️  SECURITY WARNING: Change these passwords immediately after first login!');
      console.log('⚠️  Default accounts have requirePasswordChange=true for security.\n');
    }

    return createdAccounts.length > 0;
    
  } catch (error) {
    console.error('❌ Error in createDefaultAccounts:', error);
    throw error;
  }
}

/**
 * Creates a specific default account (used for individual account creation)
 * @param {string} accountType - 'admin', 'agent', or 'user'
 * @returns {Promise<Object|null>} Created user object or null if already exists
 */
export async function createDefaultAccount(accountType) {
  try {
    const accountData = DEFAULT_ACCOUNTS.find(account => {
      if (accountType === 'admin') return account.role === 'admin';
      if (accountType === 'agent') return account.role === 'agent';
      if (accountType === 'user') return account.role === 'limited';
      return false;
    });

    if (!accountData) {
      throw new Error(`Invalid account type: ${accountType}`);
    }

    // Check if account already exists
    const existingUser = await User.findOne({ email: accountData.email });
    
    if (existingUser) {
      console.log(`⚠️  ${accountType} account already exists: ${accountData.email}`);
      return null;
    }

    // Create the account
    const newUser = await User.create(accountData);
    
    console.log(`✅ Created ${accountType} account: ${newUser.email}`);
    console.log(`👤 Login: ${accountData.email} / ${accountData.password}`);
    console.log('⚠️  Change password after first login!');
    
    return {
      id: newUser._id,
      email: newUser.email,
      role: newUser.role,
      fullName: newUser.fullName
    };
    
  } catch (error) {
    console.error(`❌ Error creating ${accountType} account:`, error.message);
    throw error;
  }
}

/**
 * Checks if default accounts exist
 * @returns {Promise<Object>} Status of default accounts
 */
export async function checkDefaultAccounts() {
  try {
    const status = {};
    
    for (const account of DEFAULT_ACCOUNTS) {
      const exists = await User.findOne({ email: account.email });
      status[account.role] = {
        email: account.email,
        exists: !!exists,
        id: exists?._id
      };
    }
    
    return status;
    
  } catch (error) {
    console.error('❌ Error checking default accounts:', error);
    throw error;
  }
}

/**
 * Get default account credentials (for documentation/setup purposes)
 * @returns {Array} Array of account credentials
 */
export function getDefaultCredentials() {
  return DEFAULT_ACCOUNTS.map(account => ({
    role: account.role,
    email: account.email,
    password: account.password,
    description: `Default ${account.role} account for initial system access`
  }));
} 