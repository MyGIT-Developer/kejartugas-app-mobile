// VisibilityContext.js
import React, { createContext, useState, useContext } from 'react';

const VisibilityContext = createContext();

export const VisibilityProvider = ({ children }) => {
    const [isNavigatorVisible, setIsNavigatorVisible] = useState(true);

    return (
        <VisibilityContext.Provider value={{ isNavigatorVisible, setIsNavigatorVisible }}>
            {children}
        </VisibilityContext.Provider>
    );
};

export const useVisibility = () => useContext(VisibilityContext);
