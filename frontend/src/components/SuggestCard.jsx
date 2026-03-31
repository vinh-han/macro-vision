import { Card, Text, Image, Box, Button, CardDescription
} from "@chakra-ui/react"

import dishImg from  "../assets/images/dish/dish_1.jpg"
import { useNavigate, Link } from "react-router"
import { assetNameProcess } from "./Methods";

export default function SuggestCard({dish}) {
    const navigate = useNavigate(); 

    return (
        <Card.Root
        width="100%" 
        height={{base: "22rem", md: "27rem", lg: "32rem"}}
        rounded="12px"
        border="1.5px solid #d4d4d8"
        boxShadow="0.3rem 0.3rem 0.5rem #0000004d"
        display="flex"
        flexDirection="column"
        >
            <Image 
                src={`/assets/images/dishes/${assetNameProcess(dish.dish_name)}.webp`}
                alt="A bowl of bun cha Hanoi"
                roundedTop="12px"
                height="53%"
            />
            <Box
                flex="1"
                padding="0.5rem 0.8rem 0.8rem"
                display="flex"
                flexDirection="column"
                justifyContent="space-between">
                <Card.Body padding="0">
                    {(dish.dish_name.length > 35) ? (
                        <Card.Title>{dish.dish_name.substring(0, 35)}...</Card.Title>
                    ) : (
                        <Card.Title>{dish.dish_name}</Card.Title>
                    )}
                    
                    {(dish.description.length > 100) ? (
                        <CardDescription>{dish.description.substring(0, 100)}...</CardDescription>
                    ) : (
                        <CardDescription>{dish.description}</CardDescription>
                    )}
                </Card.Body>
                <Card.Footer 
                    padding="0"
                    width="100%"
                    display="flex"
                    justifyContent="space-between">
                        <Text bg="gray.300" paddingX="0.5em" rounded="6px" height="100%" alignContent="center">
                            {dish.course}
                        </Text>
                        <Button
                            fontSize="1rem"
                            fontWeight="bold"
                            rounded="6px"
                            padding="0.3rem 0.8rem"
                            onClick={() => {
                                localStorage.setItem("selected-recipe", JSON.stringify(dish))
                                navigate("../add-to-meal-plan/new-meal-plan")
                            }}>
                                Add to Meal Plan
                        </Button>
                </Card.Footer>
            </Box>
            
        </Card.Root>
    )
}