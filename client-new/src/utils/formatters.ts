import { getSystemSettings, getCurrencySymbol } from '../api/settingsService';

/**
 * Formats a number as currency using the system's currency settings
 * @param amount The amount to format
 * @param overrideCurrency Optional currency code to override system settings
 * @returns Formatted currency string
 */
export const formatCurrency = async (
  amount: number, 
  overrideCurrency?: string
): Promise<string> => {
  try {
    // Get system settings to determine currency
    const settings = await getSystemSettings();
    const currencyCode = overrideCurrency || settings.unitPreferences.currency;
    const symbol = getCurrencySymbol(currencyCode);
    
    // Format the amount with the appropriate currency symbol
    // For INR, the convention is to use ₹ before the amount without a space
    if (currencyCode === 'INR') {
      return `₹${amount.toLocaleString('en-IN')}`;
    }
    
    // For other currencies, use the standard format
    return `${symbol}${amount.toLocaleString()}`;
  } catch (error) {
    console.error('Error formatting currency:', error);
    // Fallback to INR format if system settings can't be loaded
    return `₹${amount.toLocaleString('en-IN')}`;
  }
};

/**
 * Synchronous version of formatCurrency that doesn't require async/await
 * Uses a default symbol if settings aren't available
 * @param amount The amount to format
 * @param currencyCode The currency code to use
 * @returns Formatted currency string
 */
export const formatCurrencySync = (
  amount: number,
  currencyCode = 'INR'
): string => {
  const symbol = getCurrencySymbol(currencyCode);
  
  // Format the amount with the appropriate currency symbol
  // For INR, the convention is to use ₹ before the amount without a space
  if (currencyCode === 'INR') {
    return `₹${amount.toLocaleString('en-IN')}`;
  }
  
  // For other currencies, use the standard format
  return `${symbol}${amount.toLocaleString()}`;
};