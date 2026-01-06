import {Box, Button, Text, SimpleGrid, Center} from "@chakra-ui/react"
import IngredientCard from "../../components/IngredientCard"

export default function IngredientInputPage() {
    return (
        <>
            <Box
                width="100%"
                padding="30px 20px 20px"
                background="black"
                roundedBottom="18px"
                position="fixed"
                top="0">
                <Button
                    width="100%"
                    height="fit-content"
                    padding="10px"
                    background="crimsonred.500"
                    rounded="12px"
                    gap="10px">
                    <i className="ri-camera-4-line" style={{fontSize: "35px", lineHeight: 1}}></i>
                    <Text
                        justifyContent="stretch"
                        fontSize="22px"
                        fontWeight="semi">Ingredients from Image</Text>
                </Button>
            </Box>
            <Box
                width="100%"
                padding="10px 20px"
                position="absolute"
                top="110px">
                <Text
                    fontSize="28px"
                    fontWeight="bold">
                    Ingredient List
                </Text>
                <SimpleGrid 
                    minChildWidth="90px"
                    gap="15px" 
                    marginTop="15px"
                    gridAutoRows="1fr">
                    <IngredientCard />
                    <IngredientCard />
                    <IngredientCard />
                    <IngredientCard />
                    <IngredientCard />
                    <IngredientCard />
                    <IngredientCard />
                    <Center
                        className="custom-dashed-border">
                            <i className="ri-add-large-line" style={{fontSize: "25px", color: "#B0ABAB"}}></i>
                    </Center>
                </SimpleGrid>
            </Box>
        </>
    )
}