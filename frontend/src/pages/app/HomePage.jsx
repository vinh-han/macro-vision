import { 
    // wrapping components: 
    HStack, Box, Container, Carousel, Center, 
    // typography components: 
    Heading, Text,  
    // functional components: 
    Image, Button 
} from "@chakra-ui/react"

import Logo from "../../assets/images/LogoHorizontal.svg"
import MealCardMini from "../../components/MealCardMini"
import DishCard from "../../components/DishCard"

export default function HomePage() {
    return (
        <Container centerContent>
            {/* Logo */}
            <Box >
                <Image src={Logo}  height="3rem" m="30px" ></Image>
            </Box>

            {/* Today meal cards area */}
            <Container>
                <Container bg="gray.400" padding="4" borderRadius="md" mb="1rem">
                    <Heading>Today's meal cards</Heading>

                    <HStack gap="1rem">
                        {/* meal cards mini */}
                        <MealCardMini/>
                        {/* add new mmeal card button  */}
                        <Center border="dashed 2px" rounded="md" width="8rem" height="8rem" fontSize="4xl" >
                                <i class="ri-add-line"></i>
                        </Center>
                    </HStack>
                </Container>
            </Container>

            {/* Popular dishes area  */}
            <Container>
                <Heading>Popular Dishes</Heading>
                <DishCard/>
            </Container>
        </Container>
    )
}