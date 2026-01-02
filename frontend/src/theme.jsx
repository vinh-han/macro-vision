import { createSystem, defaultConfig, defineConfig } from "@chakra-ui/react"

// create custom theme 
const config = defineConfig({
  theme: {
    tokens: {
      colors: {
        crimsonred: {
          "500": { value: "#ab3841" },
          "600": { value: "#983139" }
        },
      },
      fonts: {
        body: { value: "Inter, sans-serif" },
        heading: { value: "Inter, sans-serif" },
      }
    },
  },
})

// create styling engine 
export const system = createSystem(defaultConfig, config)