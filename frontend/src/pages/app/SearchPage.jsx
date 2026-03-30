import { use, useEffect, useState } from "react";
import {
    // frame: 
    Container, Flex, Box, HStack, VStack, Slider, ButtonGroup,
    // functional: 
    Input, Button, Collapsible, Pagination,IconButton, 
    // typography: 
    Text, Separator
} from "@chakra-ui/react";
import DishCard from "../../components/DishCard";


export default function SearchPage() {
    const apiUrl = import.meta.env.VITE_BASE_API_URL;

    // --- Search box state --- 
    const [inputValue, setInputValue] = useState(''); 
    const [query, setQuery] = useState(''); 

    // --- Page state -- 
    const [result, setResult] = useState([])
    const [loading, setLoading] = useState(false); 
    const [error, setError] = useState(null); 

    // --- Filter Box state  ---
    const [isOpen, setIsOpen] = useState(false);
    const handleClose = () => setIsOpen(false);
    // recheck these course later in databse, some might not exist 
    const courseTag = [
    'appetizers', 'breakfast', 'desserts', 'drinks', 
    'salads', 'side-dishes', 'snacks', 'soups'
    ];

    // Course state  & function 
    const [inputCourse, setInputCourse] = useState('');
    const [course, setCourse] = useState(''); 
    const togggleInputCourse = (tag) => {
        const isSelected = inputCourse === tag 

        if(isSelected) {
            setInputCourse('')
        } else {
            setInputCourse(tag)
        }
    }
    // Ingredients count state 
    // const [minIgredients, setMinIngredients] = useState(''); 
    const [inputMaxIngredients, setInputMaxIngredients] = useState(''); 
    const [maxIngredients, setMaxIngredients] = useState(''); 
    const marks = [
        {value: 1, label: "1"},
        {value: 10, label: "10"}
    ]

    //  -- Pagination state & function --- 
    const [dishes, setDishes] = useState([]);
    const [page, setPage] = useState(1); // current page 
    const limit = 6; // items per page 
    useEffect(() => {
        setPage(1);
    }, [query, course])


    // --- Searching Function --- 
    useEffect(() => {

        const controller = new AbortController(); 

        const fetchResults = async () => {

            // specify the search params 
            const params = new URLSearchParams(); 
            params.set('limit', limit);
            params.set('page', page)
            if (query) params.set('q', query); 
            if (course && course.length > 0) params.set('course', course); 
            // if (minIgredients) params.set('min_ingredients', minIgredients); 
            if (maxIngredients) params.set('max_ingredients', maxIngredients); 

            try {
                //  API call 
                setLoading(true); 
                setError(null); 
                const res = await fetch(`${apiUrl}dishes/search?${params.toString()}`, {signal: controller.signal}); 

                // TESTING (DELETE LATER): 
                console.log(`${apiUrl}dishes/search?${params.toString()}`);

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
                setResult(data);
                setDishes(data.dishes);
            } catch (err) {
                if (err.name === 'AbortError') return;
                console.error(err);
                setError('Could not connect. Check your internet connection.'); 
            } finally {
                setLoading(false);
            }
        };

        fetchResults();
        return () => controller.abort(); 
    }, [query, course, page, maxIngredients]); 

    // --- Page View --- 
    // Create these components later 
    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <Container centerContent maxW="container.xl">
            
            {/* --- Search Box ---  */}
            <Container centerContent maxW="full">
                <Input 
                    type="text"
                    // save input value 
                    onChange={(e) => setInputValue(e.target.value)}
                    // transform input value into query and send it 
                    onKeyDown={(e) => {
                        if(e.key === 'Enter') {
                            setQuery(inputValue)
                        }
                    }}
                    placeholder="Search for recipes..." 
                    size="lg" 
                    w={{ base: "95%", md: "70%", lg: "60%" }}
                    mt={10}
                    rounded="md"
                    boxShadow="4px 4px 12px rgba(0, 0, 0, 0.15)"
                />
            </Container>
            
            {/* --- Filter Box ---  */}
            {/* Filter button */}
            {/* Contain a button and an array of tag if exists */}
            {/* Expanding panel */}
            {/* A list of tags button which can be selected or deselected */}
            {/* A slider to specify min ingredient and max ingredient */}
            {/* Cancel and Done button */}
            <Container w={{ base: "95%", md: "70%", lg: "60%" }} mt={4} mb={4}>
                <Collapsible.Root 
                    as="legend"
                    boxShadow={isOpen ? "4px 4px 12px rgba(0, 0, 0, 0.15)" : "none"}
                    border={isOpen ? "sm" : "none"} rounded="md"
                    padding= "8px 8px"
                    open={isOpen} onOpenChange={(e) => setIsOpen(e.open)}
                >
                        <Collapsible.Trigger cursor="pointer">
                        <HStack>
                            {/* Filter Button */}
                            <Button 
                                variant={isOpen ? "ghost" : "outline"}
                                size="sm" rounded="md" 
                                onClick={() => setIsOpen(!isOpen)}
                                fontWeight={isOpen ? "bold" : "none"}
                                boxShadow={isOpen ? "none" : "4px 4px 12px rgba(0, 0, 0, 0.15)"}
                            >
                                <i className="ri-equalizer-line"></i>
                                Filter
                            </Button>    
                        </HStack>
                        </Collapsible.Trigger>
                        
                        <Collapsible.Content >
                            <VStack align="stretch" gap={6} padding="3">
                                {/* Course Selection */}
                                <Box>
                                    <Text fontWeight="bold" mb={3} fontSize="sm">Categories</Text>
                                    <Flex wrap="wrap" gap={2}>
                                        {courseTag.map(tag => (
                                            <Button
                                                key={tag}
                                                size="sm"
                                                variant={inputCourse === tag ? 'solid' : 'outline'}
                                                bg={inputCourse === tag ? 'gray.400' : 'transparent'}
                                                color={inputCourse === tag ? 'white' : 'black'}
                                                borderColor="gray.300"
                                                borderRadius="full"
                                                onClick={() => togggleInputCourse(tag)}
                                            >
                                                {tag}
                                            </Button>
                                        ))}
                                    </Flex>
                                </Box>

                                {/* Ingredient Count Slider */}
                                <Box >
                                    <Text fontWeight="bold" mb={3} fontSize="sm">Ingredient Number</Text>
                                    <Slider.Root 
                                        min={1} max={10} step={1}
                                        value = {[inputMaxIngredients]}
                                        onValueChange={(details) => setInputMaxIngredients(details.value[0])}
                                    >
                                        <Slider.Control>
                                            <Slider.Track bg="gray.200">
                                                <Slider.Range bg="gray.200" />
                                            </Slider.Track>
                                            
                                            <Slider.Thumb idex={1} bg="red.700">
                                                <Slider.DraggingIndicator
                                                    layerStyle="fill.solid"
                                                    top="6"
                                                    rounded="sm"
                                                    px="1.5"
                                                >
                                                    <Slider.ValueText/>
                                                </Slider.DraggingIndicator>
                                            </Slider.Thumb>

                                            <Slider.Marks marks={marks}/>
                                        </Slider.Control>
                                    </Slider.Root>
                                </Box>
                                
                                {/* Action Buttons */}
                                <HStack justify="space-evenly">
                                    <Button variant="ghost" size="sm" onClick={handleClose}>Cancel</Button>
                                    <Button 
                                        variant="ghost" size="sm" 
                                        onClick={() => {
                                            // close panel 
                                            handleClose()
                                            setTimeout(() => {
                                            // sent course 
                                            if (inputCourse) {setCourse(inputCourse)}
                                            // sent max ingredients 
                                            if (inputMaxIngredients) {setMaxIngredients(inputMaxIngredients)}
                                            }, 300)
                                        }}
                                    >Done</Button>
                                </HStack>
                            </VStack>
                        </Collapsible.Content>
                </Collapsible.Root>
            </Container>
            
            {/* --- Search results count ----  */}
            {/* DELETE THE QUERY LATER */}
            { query && (
                <Text color="gray.600" fontStyle="italic">{result.total_results} recipes found for "{query}"</Text>
            )}

            {/* --- Dish cards --- */}
            <Flex gap="5" wrap="wrap" justify="center" maxW="100%" mt="2">
                {dishes.map((dish, index) => (
                    <DishCard key={index} 
                    dishName={dish.dish_name}
                    dishDescription={dish.description}
                    dishCourse={dish.course} 
                    dishImage={dish.image}/>
                ))} 
            </Flex>

            {/* --- Pagination control --- */}
            <Pagination.Root 
                count={result.total_results || 0} // total num of data items 
                pageSize={limit} //  num of data per page 
                page = {page}
                onPageChange={(e) =>setPage(e.page)}
            >
                <ButtonGroup gap="4" size="sm" variant="ghost">
                    <Pagination.PrevTrigger asChild>
                        <IconButton>
                            <Text> Prev </Text>
                        </IconButton>
                    </Pagination.PrevTrigger>

                    <Pagination.PageText />

                    <Pagination.NextTrigger asChild>
                        <IconButton>
                            <Text> Next </Text>
                        </IconButton>
                    </Pagination.NextTrigger>
                </ButtonGroup>
            </Pagination.Root>

        </Container>
    );
}