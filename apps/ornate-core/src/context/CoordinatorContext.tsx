'use client';

import { createContext, useContext, useState } from 'react';

interface Coordinator {
  id: string | number;
  email: string;
  name?: string;
  phone?: string;
  assignedEvent?: string;
  status?: string;
  [key: string]: any;
}

interface CoordinatorContextType {
  coordinators: Coordinator[];
  addCoordinator: (newCoordinator: Omit<Coordinator, 'id' | 'status'>) => void;
  updateCoordinator: (id: string | number, updatedData: Partial<Coordinator>) => void;
  removeCoordinator: (id: string | number) => void;
  setCoordinators: React.Dispatch<React.SetStateAction<Coordinator[]>>;
}

const CoordinatorContext = createContext<CoordinatorContextType | undefined>(undefined);

const initialCoordinators: Coordinator[] = [];

export function CoordinatorProvider({ children }: { children: React.ReactNode }) {
  const [coordinators, setCoordinators] = useState<Coordinator[]>(initialCoordinators);

  const addCoordinator = (newCoordinator: Omit<Coordinator, 'id' | 'status'>) => {
    setCoordinators(prev => {
      // Check if coordinator already exists by email
      const exists = prev.find(c => c.email.toLowerCase() === newCoordinator.email.toLowerCase());
      if (exists) return prev;

      return [...prev, {
        ...newCoordinator,
        id: `temp-${Date.now()}`,
        status: 'Active'
      } as Coordinator];
    });
  };

  const updateCoordinator = (id: string | number, updatedData: Partial<Coordinator>) => {
    setCoordinators(prev => prev.map(c => c.id === id ? { ...c, ...updatedData } : c));
  };

  const removeCoordinator = (id: string | number) => {
    setCoordinators(prev => prev.filter(c => c.id !== id));
  };

  return (
    <CoordinatorContext.Provider value={{
      coordinators,
      addCoordinator,
      updateCoordinator,
      removeCoordinator,
      setCoordinators
    }}>
      {children}
    </CoordinatorContext.Provider>
  );
}

export function useCoordinators() {
  const context = useContext(CoordinatorContext);
  if (!context) {
    throw new Error('useCoordinators must be used within a CoordinatorProvider');
  }
  return context;
}
