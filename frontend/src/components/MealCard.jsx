import { 
    // frame: 
    Card, Box, HStack, Flex,
    // typography: 
    Text, Heading, Image, 
    // functional: 
    Carousel, IconButton
} from "@chakra-ui/react"
import { useNavigate, useLocation } from "react-router"
import { assetNameProcess } from "./Methods";
const NO_IMAGE_PLACEHOLDER_URL = "../../assets/images/No-Image-Placeholder.jpg";

export default function MealCard({cardId, title, dishes}) {
    const navigate = useNavigate();
    const location = useLocation(); 

    return (
        <Box
            w="350px"
            h="260px"
            rounded="xl" p={5} pb={0}
            bg="crimsonred.500"
            boxShadow="4px 4px 12px rgba(0, 0, 0, 0.2)"
            cursor="pointer" onClick={() => navigate(`/app/meal-card/${cardId}`, {state: {from: location.pathname}})}
        > 
            {/* --- MealCard Title & number of dish */}

            <Heading color="whiteAlpha.900" size="2xl">{title}</Heading>
            <Text color="white" mb={2}>{dishes.length} dish</Text>


            {/* --- A carousel of dish --- */}
            <HStack w="100%" h="140px">
                {dishes.slice(0, 2).map((dish) => (
                    <Card.Root
                        key={dish.dish_id}
                        flex="0 0 120px"
                        h="100%"
                        rounded="xl" 
                        overflow="hidden"

                    >
                        <Image
                            src = {`/assets/images/dishes/${assetNameProcess(dish.dish_name)}.webp`}
                            alt={dish.alt_name}
                            objectFit="cover"
                            h="50%" w="100%"
                            onError={(e) => {
                                if (e.currentTarget.src !== NO_IMAGE_PLACEHOLDER_URL) {
                                    e.currentTarget.src = NO_IMAGE_PLACEHOLDER_URL;
                                }
                            }}
                        />
                        <Card.Body pl={1} pr={1} pt={2} >
                            <Card.Title lineClamp={3} textStyle="xs">
                                {dish.dish_name}
                            </Card.Title>
                        </Card.Body>
                    </Card.Root>
                ))}

                {dishes.length > 2 && (
                    <Flex
                    w="40%" h="60%"
                    rounded="xl"
                    align="center"
                    justify="center"
                    >
                    <Text color="white" fontWeight="bold" fontSize="lg">
                        +{dishes.length - 2}
                    </Text>
                    </Flex>
                )}
            </HStack>
        </Box>
    )
}
