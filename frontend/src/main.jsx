import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router';
import router from './Router';
// Chakra UI 
import { ChakraProvider } from '@chakra-ui/react';
import { system } from "./theme";

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ChakraProvider value={system}>               
        <RouterProvider router={router} />
    </ChakraProvider>
  </StrictMode>,
);
 