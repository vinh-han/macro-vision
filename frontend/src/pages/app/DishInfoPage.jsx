import { 
    // frame: 
    Box, Container, HStack,
    // typography: 
    Heading, Text,
    // functional: 
    Image, Button, Tag
} from "@chakra-ui/react"
import { useNavigate, useParams } from "react-router"
import { useState, useEffect } from "react";
import { assetNameProcess } from "../../components/Methods";


export default function DishInfoPage() {
    const navigate = useNavigate();
    const apiUrl = import.meta.env.VITE_BASE_API_URL;
    const {dishID} = useParams(); 

    const [data, setData] = useState(null); 
    const [loading, setLoading] = useState(true); 
    const [error, setError] = useState(null); 

    const [dishName, setDishName] = useState('');

    const handleShare = async () => {
    if (navigator.share) {
        await navigator.share({
        title: document.title,
        url: window.location.href,
        });
    } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(window.location.href);
        alert("Link copied!");
    }
    };

    useEffect(() => {
        const controller = new AbortController(); 
        setLoading(true); 
        setError(null)

        const fetchData = async () => {
            try {
                const response = await fetch(`${apiUrl}dishes/${dishID}`, { signal: controller.signal })

                // TESTING (DELETE LATER): 
                console.log(`${apiUrl}dishes/${dishID}`);

                if(!response.ok) {
                    throw new Error('error'); 
                }
                const result = await response.json();
                setData(result); 
                setDishName(result.dish_name);
            } catch (err) {
                if (err.name !== 'AbortError') setError(err.message);
            } finally {
                setLoading(false);  
            }
        };
        fetchData();
        return () => controller.abort(); 
    },[dishID]);

// ==================================== View ===============================================
    // if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;
    
    return (
        <Box bg="white" minH="100vh">
            
            {/* --- Top header --- */}
            <Box bg="black" py={4} px={4}>
                <Box 
                    as="span" 
                    color="white" fontSize="24px" 
                    cursor="pointer" onClick={() => navigate(-1)} // Go back to previous page
                >
                    <i className="ri-arrow-left-line"></i>
                </Box>
            </Box>

            {/*--- Dish Image --- */}
            <Image 
                src= {`/assets/images/dishes/${assetNameProcess(dishName)}.webp`}
                alt="A bowl of bun cha Hanoi"
                width="100%" height="250px" 
                objectFit="cover" 
            />

            {/* --- Content area ---*/}
            <Container mt={6}>
                <Heading size="lg" mb={2}>{data?.dish_name} ({data?.alt_name?.String})</Heading>
                
                {/* Meta Data  */}
                <Text color="gray.500" fontSize="lg">
                    {data?.description}
                </Text>

                <Tag.Root mt={5} size="xl">
                    <Tag.Label> {data?.course} </Tag.Label>
                </Tag.Root>
 

                {/* Buttons */}
                <HStack mb={8} mt={5} spacing={4}>
                    <Button bg="red.700" rounded="md">
                        <i class="ri-calendar-view"></i>    
                        Add To Meal Plan
                    </Button>
                    <Button rounded="md" >
                        <i class="ri-bookmark-line"></i>
                        Save
                    </Button>
                    <Button 
                        variant="outline" rounded="md" 
                        onClick={() => window.print()}
                    >
                        <i class="ri-printer-fill"></i>
                    </Button>
                    <Button 
                        variant="outline" rounded="md"
                        onClick={handleShare}
                    >
                        <i class="ri-share-line"></i>
                    </Button>

                </HStack>

                <hr/>

                {/* Ingredient list */}
                <Heading size="md" mb={4} mt={4}>Ingredients</Heading>
                <Box as="ul" listStyleType="circle" ml={4} mb={4}>
                    {data?.full_recipe?.split('\n').filter(Boolean).map((ingredient, index) => (
                        <li key={index}>{ingredient}</li>
                    ))}
                </Box>
                <hr/>

                {/* Cooking steps  */}
                <Heading size="md" mb={4} mt={4}>Steps</Heading>
                <Button
                    isDisabled={!data?.source}
                    onClick={() => {window.open(data?.source, "_blank"); }}
                >Link to steps</Button>
            </Container>
        </Box>
    )
}