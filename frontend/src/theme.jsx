import { createSystem, defaultConfig, defineConfig } from "@chakra-ui/react"

const config = defineConfig({
  theme: {
    tokens: {
      colors: {
        crimsonred: {
          "500": { value: "#ab3841" },
        },
      },
    },
  },
})

export const system = createSystem(defaultConfig, config)