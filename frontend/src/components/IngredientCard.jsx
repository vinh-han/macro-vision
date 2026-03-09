import { Box, Image, Text } from "@chakra-ui/react"

export default function IngredientCard({addIngred, removeIngred, isEdit, isSelected, ingred}) {

    return (
        <Box
            position="relative"
            padding="0.3rem"
            display="flex"
            background="white"
            flexDirection="column"
            boxShadow="0 0 0.2rem 0.05rem #0000004d"
            rounded="8px"
            onClick={() => {
                if (isEdit) {
                    if (isSelected) {
                        removeIngred(ingred.ingredient_id)
                    }
                    else {
                        addIngred(ingred.ingredient_id)
                    }
                }
            }}>
            <Image src="/assets/images/ingredient/egg.png" />
            <Text fontWeight="bold" fontSize="1.1em" overflow="hidden" whiteSpace="nowrap"> 
                {ingred.ingredient_name}
            </Text>

            {(isEdit && isSelected) && (
                <>
                    <Box
                        position="absolute"
                        rounded="8px"
                        inset="0"
                        bgColor="white"
                        opacity="0.65">
                    </Box>

                    <Box
                        position="absolute"
                        top="0"
                        right="0">
                        <i className="ri-checkbox-fill" style={{fontSize: "2em", lineHeight: 1, color: "#ab3841"}}></i>
                    </Box>
                </>
            )}
        </Box>
    )
}