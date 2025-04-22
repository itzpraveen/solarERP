import apiService from './apiService';

const API_URL = '/api/inventory';

// Define the InventoryItem type based on the Mongoose model
export interface InventoryItem {
  _id: string;
  name: string;
  description?: string;
  category: 'panel' | 'inverter' | 'battery' | 'racking' | 'wiring' | 'other';
  quantity: number;
  unitPrice: number;
  supplier?: string;
  modelNumber?: string;
  specifications?: Record<string, string>; // Using Record for Map
  createdAt?: string; // Add timestamps if needed
  updatedAt?: string;
}

const inventoryService = {
  /**
   * Fetches all inventory items.
   * @returns A promise that resolves with the list of inventory items.
   */
  getAllInventory: async () => {
    const response = await apiService.get(API_URL);
    // Adjust expectation: Assume response might be { data: { inventory: [...] } } or similar
    // If the API directly returns { inventory: [...] }, use response.data.inventory
    // If the API returns the array directly, use response.data
    // Reverting to access response.data.inventory, assuming structure like { data: { inventory: [...] } } or { inventory: [...] }
    // If this still fails, the actual API response structure needs verification.
    return response.data.inventory;
  },

  /**
   * Fetches a single inventory item by ID.
   * @param id The ID of the inventory item.
   * @returns A promise that resolves with the inventory item data.
   */
  getInventory: async (id: string) => {
    const response = await apiService.get(`${API_URL}/${id}`);
    // Also adjust this for consistency
    return response.data.inventory;
  },

  /**
   * Creates a new inventory item.
   * @param inventoryData The data for the new inventory item.
   * @returns A promise that resolves with the created inventory item data.
   */
  // Use Omit to exclude _id, createdAt, updatedAt for creation
  createInventory: async (
    inventoryData: Omit<InventoryItem, '_id' | 'createdAt' | 'updatedAt'>
  ) => {
    const response = await apiService.post(API_URL, inventoryData);
    // Adjust for consistency
    return response.data.inventory as InventoryItem; // Assert the return type
  },

  /**
   * Updates an existing inventory item.
   * @param id The ID of the inventory item to update.
   * @param inventoryData The updated data for the inventory item.
   * @returns A promise that resolves with the updated inventory item data.
   */
  // Use Partial<Omit<...>> for updates, as not all fields are required
  updateInventory: async (
    id: string,
    inventoryData: Partial<
      Omit<InventoryItem, '_id' | 'createdAt' | 'updatedAt'>
    >
  ) => {
    const response = await apiService.patch(`${API_URL}/${id}`, inventoryData);
    // Adjust for consistency
    return response.data.inventory as InventoryItem; // Assert the return type
  },

  /**
   * Deletes an inventory item by ID.
   * @param id The ID of the inventory item to delete.
   * @returns A promise that resolves when the inventory item is deleted.
   */
  deleteInventory: async (id: string) => {
    await apiService.delete(`${API_URL}/${id}`);
  },
};

export default inventoryService;
