// Placeholder for sequence generator utility
// This file is created to resolve linting errors.
// Actual implementation for getNextSequenceValue should be added here.

// eslint-disable-next-line no-unused-vars
const getNextSequenceValue = async (sequenceName) => {
  // In a real implementation, this would interact with a database
  // or a persistent counter to get the next value for a given sequence.
  // For now, returning a placeholder.
  console.warn(`Placeholder getNextSequenceValue called for ${sequenceName}`);
  if (sequenceName === 'invoice') {
    return `INV-${Date.now()}`;
  }
  return `SEQ-${Date.now()}`;
};

module.exports = {
  getNextSequenceValue,
};
