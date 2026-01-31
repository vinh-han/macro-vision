import { 
    // wrapping components: 
    Box, Container, HStack,
    // typography components: 
    Heading, Text,
    // functional components: 
    Image, Button
} from "@chakra-ui/react"
import dish from  "../../assets/images/dish/dish_1.jpg"
import { useNavigate } from "react-router"
import { useState, useEffect } from "react";

export default function DishInfoPage() {
    const navigate = useNavigate();

    const [data, setData] = useState(null); 
    const [loading, setLoading] = useState(true); 
    const [error, setError] = useState(null); 

    useEffect(() => {
        const fetchData = async () => {
            try {
                const reponse = await fetch('http://127.0.0.1:8000/v1/dishes/faee2d47-410d-4939-bbd5-d755f50269f1'); 

                if(!reponse.ok) {
                    throw new Error('Network error'); 
                }

                const result = await reponse.json();
                setData(result); 

            } catch (err) {
                setError(err.message); 
            } finally {
                setLoading(false); 
            }
        };

        fetchData();
    },[]);

    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <Box bg="white" minH="100vh">
            
            {/* Top header */}
            <Box bg="black" py={4} px={4}>
                <Box 
                    as="span" 
                    color="white" fontSize="24px" 
                    cursor="pointer" onClick={() => navigate(-1)} // Go back to previous page
                >
                    <i className="ri-arrow-left-line"></i>
                </Box>
            </Box>

            {/* Dish Image */}
            <Image 
                src={dish} alt="A bowl of bun cha Hanoi"
                width="100%" height="250px" 
                objectFit="cover" 
            />

            {/* Content area */}
            <Container mt={6}>
                <Heading size="lg" mb={2}>{data.dish_name} ({data.alt_name?.String})</Heading>
                
                {/* Meta Data  */}
                <Text color="gray.500" fontSize="lg">
                    {data.description}
                </Text>

                {/* Buttons */}
                <HStack mb={8} spacing={4}>
                    
                </HStack>

                <hr/>

                {/* Ingredient list */}
                <Heading size="md" mb={4} mt={4}>Ingredients</Heading>
                <Box as="ul" listStyleType="circle" ml={4} mb={4}>

                </Box>
                <hr/>

                {/* Cooking steps  */}
                <Heading size="md" mb={4} mt={4}>Steps</Heading>
                <Button
                    isDisabled={!data?.source}
                    onClick={() => {window.open(data.source, "_blank"); }}
                >Link to steps</Button>
            </Container>
        </Box>
    )
}