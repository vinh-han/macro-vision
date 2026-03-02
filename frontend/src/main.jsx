import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router";
import router from "./Router";
// Chakra UI
import { ChakraProvider } from "@chakra-ui/react";
import { system } from "./theme";

if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker
            .register("/sw.js")
            .then((reg) => {
                console.log("SW registered:", reg.scope);
            })
            .catch((err) => {
                console.error("SW registration failed:", err);
            });
    });
}
createRoot(document.getElementById("root")).render(
    <StrictMode>
        <ChakraProvider value={system}>
            <RouterProvider router={router} />
        </ChakraProvider>
    </StrictMode>,
);

