import { createContext, useContext } from 'react';

// Kept in its own module so WhatsNew.jsx only exports components, which keeps
// React Fast Refresh working during development.
export const WhatsNewContext = createContext(null);

export const useWhatsNew = () => useContext(WhatsNewContext);
