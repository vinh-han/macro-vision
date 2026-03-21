import { Box, Text, Button } from "@chakra-ui/react"
import SuggestCard from "../../components/SuggestCard"

export default function RecipeSuggestPage() {
    const mockData = [
        {
            dish_id: "7749",
            dish_name: "Pepepopopipip",
            description: "Lorem ipsum dolor sit amet",
            date_created: "Testest",
            course: "appetizer",
            alt_name: "Pompompom"
        },
        {
            dish_id: "7749",
            dish_name: "Cupcakke Kimchi",
            description: "Lorem ipsum dolor sit amet Dolor dolor ipsum",
            date_created: "Testest",
            course: "appetizer",
            alt_name: "Pompompom"
        },
        {
            dish_id: "7749",
            dish_name: "Jiafei Remix",
            description: "Lorem ipsum dolor sit amet asmmsld alslod lslams lslal dsdaj sslsl",
            date_created: "Testest",
            course: "main-dish",
            alt_name: "Pompompom"
        },
        {
            dish_id: "7749",
            dish_name: "Pootaxie",
            description: "Lorem ipsum dolor sit amet",
            date_created: "Testest",
            course: "breakfast",
            alt_name: "Pompompom"
        },
        {
            dish_id: "7749",
            dish_name: "Deborah Rahh",
            description: "Lorem ipsum dolor sit amet",
            date_created: "Testest",
            course: "soups",
            alt_name: "Pompompom"
        }
    ]
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
                        }}></i>
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
                        10 Recipes
                    </Text>
                    <Box
                        marginTop="1rem"
                        display="flex"
                        flexDirection="column"
                        gap="5">
                        {mockData.map((dish) => (
                            <SuggestCard key={dish.id} dish={dish} />
                        ))}
                    </Box>
            </Box>
        </Box>
    )
}