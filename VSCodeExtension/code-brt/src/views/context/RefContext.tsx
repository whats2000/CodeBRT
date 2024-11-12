import React, { createContext, useContext, useRef, useCallback } from 'react';

type RefRegistry = {
  [id: string]: React.RefObject<any>;
};

const RefContext = createContext<{
  registerRef: (id: string) => React.RefObject<any>;
  getRefById: (id: string) => React.RefObject<any> | null;
}>({
  registerRef: () => ({ current: null }),
  getRefById: () => null,
});

export const RefProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const refs = useRef<RefRegistry>({});

  const registerRef = useCallback((id: string) => {
    if (!refs.current[id]) {
      refs.current[id] = React.createRef<any>();
    }
    return refs.current[id];
  }, []);

  const getRefById = useCallback((id: string) => {
    return refs.current[id] || null;
  }, []);

  return (
    <RefContext.Provider value={{ registerRef, getRefById }}>
      {children}
    </RefContext.Provider>
  );
};

export const useRefs = () => useContext(RefContext);
