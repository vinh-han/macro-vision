import { 
    // wrapping components: 
    HStack, Box, Container, Center, Carousel, 
    // typography components: 
    Heading, Text,  
    // functional components: 
    Image, Button 
} from "@chakra-ui/react"

export default function MealCardMini() {
    return (
        <HStack gap="1rem">
            {/* individual meal card  */}
            <Box width="8rem" height="8rem" background="white" p="0.5rem" rounded="md">
                <Heading>Lunch</Heading>

                <Box background="black" bottom="0" left="0" right="0" >
                    <Text color="white">3 dishes</Text>
                </Box>
            </Box>
            {/* add new mmeal card button  */}
            <Center border="dashed 2px" rounded="md" width="8rem" height="8rem" fontSize="4xl" >
                    <i class="ri-add-line"></i>
            </Center>
        </HStack>
    )
}
