import { Box, Button } from "@chakra-ui/react"
import { useIngredInputContext } from "../context/IngredientInputContext"

export default function IngredientInputActionBox({selectedIngred, setSelectedIngred}) {
    const {ingredList, removeIngred} = useIngredInputContext()

    return (
        <Box
            width="100%"
            display="flex"
            justifyContent="space-between"
            gap="1rem">
            <Button 
                flex="1"
                background="white"
                border="solid"
                color="black"
                rounded="7px"
                fontSize="1.2em"
                fontWeight="semibold"
                onClick={() => { 
                    const data = ingredList.map((ingred) => (
                        ingred.ingredient_id
                    ))
                    setSelectedIngred(data)
                }}>Select All</Button>
            <Button 
                flex="1"
                background="crimsonred.500"
                rounded="7px"
                fontSize="1.2em"
                fontWeight="semibold"
                onClick={() => {
                    removeIngred(selectedIngred)
                    setSelectedIngred([])
                }}>Delete</Button>
        </Box>
    )
}