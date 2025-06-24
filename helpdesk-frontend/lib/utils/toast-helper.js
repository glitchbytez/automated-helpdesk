/**
 * Toast helper utility to standardize toast notifications across the application
 * This ensures compatibility with the sonner toast library
 */
import { toast } from 'sonner';

export const showToast = {
  /**
   * Show a success toast notification
   * @param {string} message - The message to display
   */
  success: (message) => {
    toast.success(message);
  },

  /**
   * Show an error toast notification
   * @param {string} message - The message to display
   */
  error: (message) => {
    toast.error(message);
  },

  /**
   * Show an info toast notification
   * @param {string} message - The message to display
   */
  info: (message) => {
    toast.info(message);
  },

  /**
   * Show a warning toast notification
   * @param {string} message - The message to display
   */
  warning: (message) => {
    toast.warning(message);
  },

  /**
   * Show a custom toast notification
   * For backward compatibility with the old toast format
   * @param {Object} options - Toast options
   * @param {string} options.title - Toast title
   * @param {string} options.description - Toast description
   * @param {string} options.variant - Toast variant (success, error, etc.)
   */
  custom: (options) => {
    const { title, description, variant } = options;
    
    // Combine title and description if both are provided
    const message = description 
      ? `${title ? title + ': ' : ''}${description}`
      : title;
    
    // Map variant to the appropriate toast type
    if (variant === 'destructive') {
      toast.error(message);
    } else if (variant === 'success') {
      toast.success(message);
    } else {
      toast(message);
    }
  }
};
