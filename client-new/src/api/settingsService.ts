// import API from './apiService'; // Removed unused import

export interface UserSettings {
  id?: string;
  userId: string;
  displayTheme: 'light' | 'dark' | 'system';
  emailNotifications: boolean;
  dashboardLayout: {
    widgets: string[];
    layout: 'grid' | 'list';
  };
  defaultView: string;
  language: string;
}

export interface CompanySettings {
  id?: string;
  companyName: string;
  logo: string;
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  phone: string;
  email: string;
  website: string;
  taxId: string;
  companyRegistrationNumber: string;
}

export interface SystemSettings {
  id?: string;
  pricingDefaults: {
    taxRate: number;
    hourlyRate: number;
    margins: {
      equipment: number;
      labor: number;
      permits: number;
    };
  };
  unitPreferences: {
    currency: string;
    distance: string;
    power: string;
    energy: string;
  };
  documentTemplates: {
    proposal: string;
    contract: string;
    invoice: string;
  };
}

// For now, we'll use local storage for settings since backend API isn't ready
const STORAGE_KEYS = {
  USER_SETTINGS: 'user_settings',
  COMPANY_SETTINGS: 'company_settings',
  SYSTEM_SETTINGS: 'system_settings',
};

// Default settings
export const DEFAULT_USER_SETTINGS: UserSettings = {
  userId: '',
  displayTheme: 'light',
  emailNotifications: true,
  dashboardLayout: {
    widgets: ['calendar', 'tasks', 'leads', 'projects'],
    layout: 'grid',
  },
  defaultView: 'calendar',
  language: 'en',
};

export const DEFAULT_COMPANY_SETTINGS: CompanySettings = {
  companyName: '',
  logo: '',
  address: {
    street: '',
    city: '',
    state: '',
    zip: '',
    country: '',
  },
  phone: '',
  email: '',
  website: '',
  taxId: '',
  companyRegistrationNumber: '',
};

export const DEFAULT_SYSTEM_SETTINGS: SystemSettings = {
  pricingDefaults: {
    taxRate: 18.0, // Default to 18% GST for India
    hourlyRate: 1200.0, // Default hourly rate in INR
    margins: {
      equipment: 0.2,
      labor: 0.3,
      permits: 0.1,
    },
  },
  unitPreferences: {
    currency: 'INR',
    distance: 'ft',
    power: 'kW',
    energy: 'kWh',
  },
  documentTemplates: {
    proposal: 'default',
    contract: 'default',
    invoice: 'default',
  },
};

// User Settings Functions
export const getUserSettings = async (): Promise<UserSettings> => {
  try {
    // When API endpoint is available:
    // const response = await API.get('/api/settings/user');
    // return response.data;

    // Using localStorage for now
    const settings = localStorage.getItem(STORAGE_KEYS.USER_SETTINGS);
    if (settings) {
      return JSON.parse(settings);
    }

    // If no settings found, return defaults with current user ID
    const userId = JSON.parse(localStorage.getItem('user') || '{}').id || '';
    const defaultSettings = { ...DEFAULT_USER_SETTINGS, userId };
    localStorage.setItem(
      STORAGE_KEYS.USER_SETTINGS,
      JSON.stringify(defaultSettings)
    );
    return defaultSettings;
  } catch (error) {
    console.error('Error fetching user settings:', error);
    throw error;
  }
};

export const updateUserSettings = async (
  settings: UserSettings
): Promise<UserSettings> => {
  try {
    // When API endpoint is available:
    // const response = await API.put('/api/settings/user', settings);
    // return response.data;

    // Using localStorage for now
    localStorage.setItem(STORAGE_KEYS.USER_SETTINGS, JSON.stringify(settings));
    return settings;
  } catch (error) {
    console.error('Error updating user settings:', error);
    throw error;
  }
};

// Company Settings Functions
export const getCompanySettings = async (): Promise<CompanySettings> => {
  try {
    // When API endpoint is available:
    // const response = await API.get('/api/settings/company');
    // return response.data;

    // Using localStorage for now
    const settings = localStorage.getItem(STORAGE_KEYS.COMPANY_SETTINGS);
    if (settings) {
      return JSON.parse(settings);
    }

    // If no settings found, return defaults
    localStorage.setItem(
      STORAGE_KEYS.COMPANY_SETTINGS,
      JSON.stringify(DEFAULT_COMPANY_SETTINGS)
    );
    return DEFAULT_COMPANY_SETTINGS;
  } catch (error) {
    console.error('Error fetching company settings:', error);
    throw error;
  }
};

export const updateCompanySettings = async (
  settings: CompanySettings
): Promise<CompanySettings> => {
  try {
    // When API endpoint is available:
    // const response = await API.put('/api/settings/company', settings);
    // return response.data;

    // Using localStorage for now
    localStorage.setItem(
      STORAGE_KEYS.COMPANY_SETTINGS,
      JSON.stringify(settings)
    );
    return settings;
  } catch (error) {
    console.error('Error updating company settings:', error);
    throw error;
  }
};

// System Settings Functions
export const getSystemSettings = async (): Promise<SystemSettings> => {
  try {
    // When API endpoint is available:
    // const response = await API.get('/api/settings/system');
    // return response.data;

    // Using localStorage for now
    const settings = localStorage.getItem(STORAGE_KEYS.SYSTEM_SETTINGS);
    if (settings) {
      return JSON.parse(settings);
    }

    // If no settings found, return defaults
    localStorage.setItem(
      STORAGE_KEYS.SYSTEM_SETTINGS,
      JSON.stringify(DEFAULT_SYSTEM_SETTINGS)
    );
    return DEFAULT_SYSTEM_SETTINGS;
  } catch (error) {
    console.error('Error fetching system settings:', error);
    throw error;
  }
};

export const updateSystemSettings = async (
  settings: SystemSettings
): Promise<SystemSettings> => {
  try {
    // When API endpoint is available:
    // const response = await API.put('/api/settings/system', settings);
    // return response.data;

    // Using localStorage for now
    localStorage.setItem(
      STORAGE_KEYS.SYSTEM_SETTINGS,
      JSON.stringify(settings)
    );
    return settings;
  } catch (error) {
    console.error('Error updating system settings:', error);
    throw error;
  }
};

// Utility function to get currency symbol from currency code
export const getCurrencySymbol = (currencyCode: string): string => {
  const currencySymbols: Record<string, string> = {
    USD: '$',
    INR: '₹',
    EUR: '€',
    GBP: '£',
    CAD: 'C$',
    AUD: 'A$',
    // Add more currencies as needed
  };

  return currencySymbols[currencyCode] || currencyCode;
};
