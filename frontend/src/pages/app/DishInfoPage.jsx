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
import { getCookie } from "../../components/Methods";
const NO_IMAGE_PLACEHOLDER_URL ="../../../public/assets/images/No-Image-Placeholder.jpg"; 

export default function DishInfoPage() {
    const navigate = useNavigate();
    const apiUrl = import.meta.env.VITE_BASE_API_URL;
    const {dishID} = useParams(); 

    const [data, setData] = useState(null); 
    const [loading, setLoading] = useState(true); 
    const [error, setError] = useState(null); 

    const [dishName, setDishName] = useState('');
    const [isFavorited, setIsFavorited] = useState(false);

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

    const handleFavorite = async () => {

        try {
            const response = await fetch(`${apiUrl}users/favorites/${dishID}`, {
                method: isFavorited ? 'DELETE' : 'PATCH',
                headers: { 'Authorization': `Bearer ${getCookie('token')}` },
            });

            if (!response.ok) throw new Error('Failed to update favorite');
            
            setIsFavorited(prev => !prev);  // toggle the state
        } catch (err) {
            console.error(err.message);
        }
    };

    useEffect(() => {
        const controller = new AbortController(); 
        setLoading(true); 
        setError(null)

        const fetchData = async () => {
            try {
                const response = await fetch(`${apiUrl}dishes/${dishID}`, { signal: controller.signal })

                if(!response.ok) {
                    throw new Error('error'); 
                }
                const result = await response.json();
                setData(result); 
                setDishName(result.dish_name);

                // check if already favorited
                const favResponse = await fetch(`${apiUrl}users/favorites/${dishID}`, {
                    headers: { 'Authorization': `Bearer ${getCookie('token')}` },
                    signal: controller.signal
                });
                setIsFavorited(favResponse.ok); // true if 200, false if 404
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
                onError={(e) => {
                    if (e.currentTarget.src !== NO_IMAGE_PLACEHOLDER_URL) {
                        e.currentTarget.src = NO_IMAGE_PLACEHOLDER_URL;
                    }
                }}

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
                    {/* navigate to Add To Meal Plan Page - AN */}
                    <Button rounded="md">
                        <i class="ri-calendar-view"></i>    
                        Add To Meal Plan
                    </Button>

                    {/* Add to favorite button  */}
                    <Button 
                        rounded="md" 
                        bg={isFavorited ? "red.400" : "red.700"}
                        onClick={handleFavorite}
                    >
                        <i className={isFavorited ? "ri-poker-hearts-fill" : "ri-poker-hearts-line"}></i>
                        {isFavorited ? "Added to Favorites" : "Add to Favorite"}
                    </Button>

                    {/* Print button  */}
                    <Button 
                        variant="outline" rounded="md" 
                        onClick={() => window.print()}
                    >
                        <i class="ri-printer-fill"></i>
                    </Button>
                    {/* Share button  */}
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