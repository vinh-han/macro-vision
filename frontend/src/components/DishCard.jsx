import { 
    // wrapping components: 
    HStack, Box, Container, Center, Carousel, 
    // typography components: 
    Heading, Text,  
    // functional components: 
    Image, Button 
} from "@chakra-ui/react"

export default function DishCard() {
    return (
        <HStack gap="1rem">
            {/* individual meal card  */}
            <Text>Dish Card 1</Text>
        </HStack>
    )
}