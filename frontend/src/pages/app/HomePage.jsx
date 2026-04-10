import { 
    // wrapping components: 
    HStack, Box, Container, Carousel, Center, Flex,
    // typography components: 
    Heading, Text,  
    // functional components: 
    Image, Button, IconButton, useBreakpointValue
} from "@chakra-ui/react"
import Logo from "../../assets/images/LogoHorizontal.svg"
import MealCardMini from "../../components/MealCardMini"
import DishCard from "../../components/DishCard"
import { use, useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router"
import { getCookie } from "../../components/Methods";
import { useSessionExpireContext } from "../../context/SessionExpireContext";



export default function HomePage() {
    const apiUrl = import.meta.env.VITE_BASE_API_URL;
    const navigate = useNavigate();
    const location = useLocation(); 
    const showCarousel = useBreakpointValue({ base: true, md: false });
    const {setIsExpired} = useSessionExpireContext();

    // ---- Today's Meal Cards State --- 
    const today = new Date()
    const localDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const [mealCards, setMealCards] = useState([]); 
    const [mealCardsLoading, setMealCardsLoading] = useState(false);
    const [mealCardsError, setMealCardsError] = useState(null); 

    // --- Popular Dishes State --- 
    const [popularDishes, setPopularDishes] = useState([]); 
    const [popularDishesLoading, setPopularDishesLoading] = useState(false);
    const [popularDishesError, setPopularDishesError] = useState(null);

    // Reset scroll position of today meal cards Hstack to the begininning 
    const scrollRef = useRef(null);
        useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollLeft = 0;
        }
    }, [mealCards]);

    // param for popular dishes 
    const params = new URLSearchParams({
        q: 'noodle', 
        limit: 3
    });

    // Fetch popular dishes 
    useEffect(() => {
        const controler = new AbortController(); 
        const fetchPopularDishes = async () => {
            try {
                setPopularDishesLoading(true);
                setPopularDishesError(null); 
                const res = await fetch(`${apiUrl}dishes/search?${params}`, {signal: controler.signal}); 

                // Error handle: 
                if(!res.ok) {
                    if (res.status == 401) {
                        setIsExpired(true)
                        return
                    } 
                    throw new Error('Failed with status: ', + response.status); 
                }

                // Succeed 
                const data = await res.json();
                setPopularDishes(data.dishes);
            } catch (err) {
                if (err.name === 'AbortError') return;
                setPopularDishesError('Could not connect. Check your internet connection.'); 
            } finally {
                setPopularDishesLoading(false);
            }
        }; 
        fetchPopularDishes(); 
        return () => controler.abort(); 
    }, []); 

    // Fetch today's meal cards 
    useEffect(() => {
        const controller = new AbortController(); 

        const fetchResult = async () => {
            setMealCardsLoading(true); 
            setMealCardsError(null); 

            try {
                const res = await fetch(`${apiUrl}meal-cards/daily?date=${localDate}`, 
                        {
                            headers: {'Authorization': `Bearer ${getCookie('token')}`}, 
                            signal: controller.signal
                        }
                    ); 

                if(!res.ok) {
                    if (res.status == 401) {
                        setIsExpired(true)
                        return
                    } 
                    throw new Error('Failed with status: ', + response.status); 
                }

                const data = await res.json(); 
                setMealCards(data ?? []);
                
            } catch (err) {
                setMealCardsError(err.message); 
            } finally { 
                setMealCardsLoading(false); 
            }
        }; 
        fetchResult(); 
        return () => controller.abort(); 
    }, [])

    return (
        <Container centerContent  maxW="container.xl">
            {/* --- Logo ---  */}
            <Box >
                <Image src={Logo}  height="3rem" m="30px" ></Image>
            </Box>

            {/* --- Today meal cards area ---  */}
            <Container>
                <Container bg="gray.400" padding="4" borderRadius="md" mb="1rem">
                    <Heading>Today's meal cards</Heading>
                    <HStack 
                        ref={scrollRef}
                        gap="0.5rem"
                        overflowX="auto"
                        scrollSnapType="x mandatory"
                        pb={2} 
                        css={{ scrollbarWidth: "none", "&::-webkit-scrollbar": { display: "none" } }}
                    >
                        {mealCards.map((item) => (
                            <Box key={item.card_id} scrollSnapAlign="start" flexShrink={0}>
                                <MealCardMini
                                    cardId={item.card_id}
                                    title={item.title}
                                    dishes={item.dishes}
                                />
                            </Box>
                        ))}

                        <Center
                            scrollSnapAlign="start"
                            flexShrink={0}
                            border="dashed 2px"
                            rounded="md"
                            width="8rem"
                            height="8rem"
                            fontSize="4xl"
                            cursor="pointer"
                            onClick={() => navigate(`/app/meal-card/new`, { 
                                state: { 
                                    date: localDate,
                                    from: location.pathname
                                } 
                            })}
                        >
                            <i className="ri-add-line"></i>
                        </Center>
                    </HStack>
                </Container>
            </Container>

            {/* ---- Popular dishes area --- */}
            <Flex direction="column" align="left" w="90%">
                <Heading ml={4}>Popular Dishes</Heading>

                <Box centerContent>
                    {showCarousel ? (
                        // Carousel for mobile 
                        <Carousel.Root
                        align="center"  mx="auto" 
                        slideCount={popularDishes.length} 
                        >
                            <Carousel.ItemGroup overflow="hidden"
                            >
                                {popularDishes.map((dish, index) => (
                                    <Carousel.Item 
                                        m={4}
                                        px={2}
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
                    ) : (
                        // HStack for desktop 
                        <HStack gap={4} wrap="nowrap" overflowX="auto" px={4} py={3}>
                            {popularDishes.map((dish) => (
                            <Box key={dish.dish_id} flexShrink={0}>
                                <DishCard
                                dishName={dish.dish_name}
                                dishDescription={dish.description}
                                dishCourse={dish.course}
                                dishImage={dish.image}
                                dishID={dish.dish_id}
                                />
                            </Box>
                            ))}
                        </HStack>
                    )}
                </Box>
            </Flex>
        </Container>
    )
}