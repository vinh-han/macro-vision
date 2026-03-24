import { Box, Text, Button } from "@chakra-ui/react"
import SuggestCard from "../../components/SuggestCard"
import { useLocation, useNavigate } from "react-router"
import { useEffect, useState } from "react";

export default function RecipeSuggestPage() {
    const navigate = useNavigate();
    const [suggestedRecipe, setSuuggestedRecipe] = useState([]);
    
    useEffect(() => {
        const data = localStorage.getItem("suggested-recipe")
        if (data) {
            setSuuggestedRecipe(JSON.parse(data))
        } else {
            navigate('../ingredient-input')
        }
    }, [])
    

    return (
        <Box
            width="100%"
            bgColor="black"
            display="flex"
            flexDirection="column">
            <Box
                width="100%"
                height="5rem"
                display="flex"
                alignItems="center"
                justifyContent="center"
                position="relative">
                    <i className="ri-arrow-left-long-line" 
                        style={{color: "white", 
                                fontSize: "2rem",
                                position: "absolute",
                                left: 15,
                        }}
                        onClick={() => navigate('../ingredient-input')}></i>
                    <Text
                        color="white"
                        textAlign="center"
                        fontSize="1.6rem"
                        fontWeight="bold">
                        Results
                    </Text>
                
            </Box>
            <Box
                flex="1"
                bgColor="white"
                roundedTop="25px"
                padding="1.5rem 1.1rem 1.5rem">
                    <Text
                        fontSize="1.7rem"
                        fontWeight="semibold">
                        Suggested Recipes
                    </Text>
                    <Box
                        width="100%"
                        height="4px"
                        bgColor="black" />
                    <Text
                        width="100%"
                        textAlign="right">
                        {suggestedRecipe.length} Recipes
                    </Text>
                    <Box
                        marginTop="1rem"
                        display="flex"
                        flexDirection="column"
                        gap="5">
                        {suggestedRecipe.map((dish, index) => (
                            <SuggestCard key={index} dish={dish} />      
                        ))}
                    </Box>
            </Box>
        </Box>
    )
}