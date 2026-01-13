import { 
    // wrapping components: 
    HStack, Box, Container,
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
            <Container bg="gray.400" padding="5" borderRadius="xl" mb="3rem">
                <Heading>Today's meal cards</Heading>
                <MealCardMini/>
            </Container>

            {/* Popular dishes area  */}
            <Container>
                <Heading>Popular Dishes</Heading>
                <DishCard/>
            </Container>
        </Container>
    )
}