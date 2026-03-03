import { Box, Image, Text } from "@chakra-ui/react"

export default function IngredientCard({ingred}) {
    return (
        <Box
            padding="0.3rem"
            display="flex"
            background="white"
            flexDirection="column"
            boxShadow="0 0 0.2rem 0.05rem #0000004d"
            rounded="8px">
            <Image src="/src/assets/images/ingredient/egg.png" />
            <Text fontWeight="bold" fontSize="1.1em" overflow="hidden" whiteSpace="nowrap"> 
                {ingred.ingredient_name}
            </Text>
        </Box>
    )
}