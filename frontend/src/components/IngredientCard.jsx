import { Box, Image, Text } from "@chakra-ui/react"

export default function IngredientCard() {
    return (
        <Box
            padding="5px"
            display="flex"
            flexDirection="column"
            boxShadow="0px 0px 4px 0.5px #0000004d"
            rounded="8px">
            <Image src="/src/assets/images/ingredient/egg.png" />
            <Text fontWeight="bold">
                Egg
            </Text>
        </Box>
    )
}