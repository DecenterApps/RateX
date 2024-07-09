import React, { createContext, useContext, useState, ReactNode } from 'react';

// Define a type for the context state
type GlobalStateType = {
  routeFindingStep: string;
  setRouteFindingStep: React.Dispatch<React.SetStateAction<string>>;
};

// Create the context with a default value
const GlobalStateContext = createContext<GlobalStateType | undefined>(undefined);

// Create a provider component
const GlobalStateProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [routeFindingStep, setRouteFindingStep] = useState<string>('default value');

  return (
    <GlobalStateContext.Provider value={{ routeFindingStep, setRouteFindingStep }}>
      {children}
    </GlobalStateContext.Provider>
  );
};

// Custom hook to use the global state
const useGlobalState = () => {
  const context = useContext(GlobalStateContext);
  if (!context) {
    throw new Error('useGlobalState must be used within a GlobalStateProvider');
  }
  return context;
};

export { GlobalStateProvider, useGlobalState };
