import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  ReactNode,
} from 'react';
import projectService from '../api/projectService'; // Adjust path as needed

interface ProjectContextType {
  totalProjects: number;
  loadingCount: boolean;
  fetchTotalProjects: () => void; // Function to allow manual refresh if needed
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [totalProjects, setTotalProjects] = useState(0);
  const [loadingCount, setLoadingCount] = useState(true);

  const fetchTotalProjects = async () => {
    setLoadingCount(true);
    try {
      // Fetch only 1 project to get the total count efficiently from 'results'
      const response = await projectService.getProjects({ limit: 1 });
      setTotalProjects(response.results || 0);
    } catch (error) {
      console.error('Failed to fetch total project count:', error);
      setTotalProjects(0); // Set to 0 on error
    } finally {
      setLoadingCount(false);
    }
  };

  useEffect(() => {
    fetchTotalProjects();
  }, []); // Fetch on initial mount

  return (
    <ProjectContext.Provider
      value={{ totalProjects, loadingCount, fetchTotalProjects }}
    >
      {children}
    </ProjectContext.Provider>
  );
};

export const useProjectContext = () => {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProjectContext must be used within a ProjectProvider');
  }
  return context;
};

export {}; // Add this line to treat the file as a module
