/**
 * Utility to clear dummy data from localStorage
 * This can be imported and used in the application to ensure no mock data remains
 */

// Add empty export to make this a module
export {};

/**
 * Checks if a token is a mock token
 * @param token The token to check
 * @returns True if the token appears to be a mock token
 */
const isMockToken = (token: string): boolean => {
  // Check for common mock token patterns
  return (
    token.includes('mock') ||
    token.includes('dummy') ||
    token.includes('test') ||
    token === 'mock-jwt-token-for-development-only'
  );
};

/**
 * Clears any mock/dummy data from localStorage
 * @returns Object containing information about what was cleared
 */
export const clearDummyData = (): { cleared: boolean; items: string[] } => {
  const clearedItems: string[] = [];

  // Check for token
  const token = localStorage.getItem('token');
  if (token && isMockToken(token)) {
    localStorage.removeItem('token');
    clearedItems.push('token');
  }

  // Check for user data
  const userData = localStorage.getItem('user');
  if (userData) {
    try {
      const user = JSON.parse(userData);
      // Check if it's a mock user
      if (
        user.email === 'demo@example.com' ||
        user.name === 'Demo User' ||
        user.id === '1'
      ) {
        localStorage.removeItem('user');
        clearedItems.push('user');
      }
    } catch (e) {
      // If we can't parse it, better to remove it
      localStorage.removeItem('user');
      clearedItems.push('user');
    }
  }

  // Check for any other items that might be mock data
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) {
      const value = localStorage.getItem(key);
      if (
        value &&
        (value.includes('mock') ||
          value.includes('dummy') ||
          value.includes('demo@example.com'))
      ) {
        localStorage.removeItem(key);
        clearedItems.push(key);
      }
    }
  }

  return {
    cleared: clearedItems.length > 0,
    items: clearedItems,
  };
};

/**
 * Checks if the application is using mock data
 * @returns True if mock data is detected
 */
export const hasMockData = (): boolean => {
  // Check for token
  const token = localStorage.getItem('token');
  if (token && isMockToken(token)) {
    return true;
  }

  // Check for user data
  const userData = localStorage.getItem('user');
  if (userData) {
    try {
      const user = JSON.parse(userData);
      if (
        user.email === 'demo@example.com' ||
        user.name === 'Demo User' ||
        user.id === '1'
      ) {
        return true;
      }
    } catch (e) {
      // Ignore parsing errors
    }
  }

  // Check for any other items that might be mock data
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) {
      const value = localStorage.getItem(key);
      if (
        value &&
        (value.includes('mock') ||
          value.includes('dummy') ||
          value.includes('demo@example.com'))
      ) {
        return true;
      }
    }
  }

  return false;
};

export default clearDummyData;
