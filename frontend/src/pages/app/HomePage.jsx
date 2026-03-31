import { 
    // wrapping components: 
    HStack, Box, Container, Carousel, Center, Flex,
    // typography components: 
    Heading, Text,  
    // functional components: 
    Image, Button, IconButton
} from "@chakra-ui/react"

import Logo from "../../assets/images/LogoHorizontal.svg"
import MealCardMini from "../../components/MealCardMini"
import DishCard from "../../components/DishCard"

import { use, useState, useEffect } from "react"

export default function HomePage() {

    const apiUrl = import.meta.env.VITE_BASE_API_URL;
    const [popularDishes, setPopularDishes] = useState([]); 
    const [loading, setLoading] = useState(false); 
    const [error, setError] = useState(null)
    const params = new URLSearchParams({
        q: 'noodle', 
        limit: 3
    });

    useEffect(() => {
        const controler = new AbortController(); 
        const fetchPopularDishes = async () => {
            try {
                setLoading(true);
                setError(null); 
                const res = await fetch(`${apiUrl}dishes/search?${params}`, {signal: controler.signal}); 

                // Error handle: 
                if (!res.ok) {
                    if (res.status >= 400 && res.status < 500) {
                        let errorMessage = 'Invalid search. Please check your input'; 
                        try {
                            const body = await res.json(); 
                            errorMessage = body.message || errorMessage;
                        } catch(err) {       
                        }
                        setError(errorMessage); 
                    } else {
                        setError(`Server error: ${res.status}`);
                    }
                    return; 
                }

                // Succeed 
                const data = await res.json();
                setPopularDishes(data.dishes);
            } catch (err) {
                if (err.name === 'AbortError') return;
                console.error(err);
                setError('Could not connect. Check your internet connection.'); 
            } finally {
                setLoading(false);
            }
        }; 
        fetchPopularDishes(); 
        return () => controler.abort(); 
    }, []); 

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
                                <i className="ri-add-line"></i>
                        </Center>
                    </HStack>
                </Container>
            </Container>

            {/* Popular dishes area  */}
            <Flex direction="column" align="left" w="95%">
                <Heading>Popular Dishes</Heading>

                <Box centerContent>
                    <Carousel.Root align="center" slideCount={popularDishes.length} maxW="xl" mx="auto">
                        <Carousel.ItemGroup>
                            {popularDishes.map((dish, index) => (
                                <Carousel.Item 
                                    m={4}
                                    key={dish.dish_id} index={index}>
                                    <DishCard 
                                    dishName={dish.dish_name}
                                    dishDescription={dish.description}
                                    dishCourse={dish.course} 
                                    dishImage={dish.image}
                                    dishID={dish.dish_id}/>
                                </Carousel.Item>
                            ))}
                        </Carousel.ItemGroup>

                        <Carousel.Control justifyContent="center" gap="4">
                            <Carousel.PrevTrigger asChild>
                                <IconButton variant="ghost">
                                    <i className="ri-arrow-left-long-line"></i>
                                </IconButton>
                            </Carousel.PrevTrigger>

                            <Carousel.Indicators/>

                            <Carousel.NextTrigger asChild>
                                <IconButton variant="ghost">
                                    <i className="ri-arrow-right-long-line"></i>
                                </IconButton>
                            </Carousel.NextTrigger>
                        </Carousel.Control>
                    </Carousel.Root>
                </Box>
            </Flex>
        </Container>
    )
}