import { Card, Text, Image, Box, Button, CardDescription
} from "@chakra-ui/react"



import { assetNameProcess } from "./Methods";

export default function RecipeCard({dish}) {
    
    return (
        <Card.Root
        width="100%" 
        height={{base: "20rem", md: "25rem", lg: "30rem"}}
        rounded="12px"
        cursor="pointer"
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
                        <Text bg="gray.300" padding="0.5rem 0.6rem" rounded="6px" height="100%" alignContent="center">
                            {dish.course}
                        </Text>
                </Card.Footer>
            </Box>
            
        </Card.Root>
    )
}