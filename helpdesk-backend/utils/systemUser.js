import mongoose from 'mongoose';
import User from '../models/User.model.js';

// System user details
const SYSTEM_USER = {
  firstName: 'System',
  lastName: 'Bot',
  email: 'system@glitchbytez.com',
  password: Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12),
  role: 'system',
  requirePasswordChange: false
};

// Fixed system user ID to use as fallback
const FALLBACK_SYSTEM_USER_ID = '000000000000000000000000';

/**
 * Get or create the system user
 * @returns {Promise<string>} The system user ID
 */
export const getSystemUserId = async () => {
  try {
    // Check if system user already exists
    let systemUser = await User.findOne({ email: SYSTEM_USER.email });
    
    // If system user doesn't exist, create it
    if (!systemUser) {
      try {
        systemUser = await User.create(SYSTEM_USER);
        console.log('System user created with ID:', systemUser._id);
      } catch (createError) {
        console.error('Error creating system user:', createError);
        // If we can't create the user, try to find a user with role 'system'
        systemUser = await User.findOne({ role: 'system' });
        
        if (!systemUser) {
          // If we still can't find a system user, use the fallback ID
          return FALLBACK_SYSTEM_USER_ID;
        }
      }
    }
    
    return systemUser._id.toString();
  } catch (error) {
    console.error('Error getting system user:', error);
    // Fallback to a valid ObjectId if we can't create or find the system user
    return FALLBACK_SYSTEM_USER_ID;
  }
};

// Cache the system user ID to avoid database lookups on every message
let cachedSystemUserId = null;

/**
 * Get the system user ID (cached version)
 * @returns {Promise<string>} The system user ID
 */
export const getCachedSystemUserId = async () => {
  if (!cachedSystemUserId) {
    try {
      cachedSystemUserId = await getSystemUserId();
    } catch (error) {
      console.error('Error in getCachedSystemUserId:', error);
      cachedSystemUserId = FALLBACK_SYSTEM_USER_ID;
    }
  }
  return cachedSystemUserId;
};

/**
 * Get the system user ID synchronously (for use in places where async/await can't be used)
 * @returns {string} The system user ID or fallback ID
 */
export const getSystemUserIdSync = () => {
  return cachedSystemUserId || FALLBACK_SYSTEM_USER_ID;
};
