import { useOutletContext } from "react-router"
import { Box, Text, Button } from "@chakra-ui/react";

export default function AddToExistingMealPlanPage() {
    const selectedRecipe = useOutletContext();
    console.log(selectedRecipe)
    return (
        <Box
            width="100%">
            <Box
                width="100%">
                <Text>
                    Meal Name
                </Text>
            </Box>

        </Box>
    )
}