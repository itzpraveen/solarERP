// import API from './apiService'; // Removed unused import

export interface Document {
  id: string;
  type: 'proposal' | 'contract' | 'invoice' | 'other';
  title: string;
  description: string;
  projectId: string;
  customerId: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  fileUrl: string;
  status: 'draft' | 'sent' | 'signed' | 'expired';
  tags: string[];
}

// For now, we'll use placeholder functions since backend API isn't ready
export const getDocuments = async (): Promise<Document[]> => {
  // try {
  // When API endpoint is available:
  // const response = await API.get('/api/documents');
  // return response.data;

  // Return empty array for now
  return [];
  // } catch (error) {
  //   console.error('Error fetching documents:', error);
  //   throw error;
  // }
};

export const getDocumentById = async (id: string): Promise<Document | null> => {
  // try {
  // When API endpoint is available:
  // const response = await API.get(`/api/documents/${id}`);
  // return response.data;

  // Return null for now
  return null;
  // } catch (error) {
  //   console.error(`Error fetching document with ID ${id}:`, error);
  //   throw error;
  // }
};

export const createDocument = async (
  document: Omit<Document, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Document> => {
  try {
    // When API endpoint is available:
    // const response = await API.post('/api/documents', document);
    // return response.data;

    // Throw error for now
    throw new Error('API not implemented yet');
  } catch (error) {
    console.error('Error creating document:', error);
    throw error;
  }
};

export const updateDocument = async (
  id: string,
  document: Partial<Document>
): Promise<Document> => {
  try {
    // When API endpoint is available:
    // const response = await API.put(`/api/documents/${id}`, document);
    // return response.data;

    // Throw error for now
    throw new Error('API not implemented yet');
  } catch (error) {
    console.error(`Error updating document with ID ${id}:`, error);
    throw error;
  }
};

export const deleteDocument = async (id: string): Promise<void> => {
  try {
    // When API endpoint is available:
    // await API.delete(`/api/documents/${id}`);

    // Throw error for now
    throw new Error('API not implemented yet');
  } catch (error) {
    console.error(`Error deleting document with ID ${id}:`, error);
    throw error;
  }
};
