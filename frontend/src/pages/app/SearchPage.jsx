import { use, useEffect, useState } from "react";
import {
    // frame: 
    Container, Flex, Box, HStack, VStack, Slider, ButtonGroup,
    // functional: 
    Input, Button, Collapsible, Pagination,IconButton, Tag, TagCloseTrigger,
    // typography: 
    Text, Separator
} from "@chakra-ui/react";
import DishCard from "../../components/DishCard";
import { useSessionExpireContext } from "../../context/SessionExpireContext";


export default function SearchPage() {
    const apiUrl = import.meta.env.VITE_BASE_API_URL;
    const {setIsExpired} = useSessionExpireContext();

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
    const courseTag = [
     'breakfast', 'main-dishes', 'side-dishes', 'appetizers', 
     'soups', 'salads', 'desserts'
    ];

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

    const [inputMaxIngredients, setInputMaxIngredients] = useState(15); 
    const [maxIngredients, setMaxIngredients] = useState(15); 
    const marks = [
        {value: 1, label: "1"},
        {value: 15, label: "15"}
    ]

    //  -- Pagination state & function --- 
    const [dishes, setDishes] = useState([]);
    const [page, setPage] = useState(1);
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
            if (course) params.set('course', course); 
            if (maxIngredients < 16) {
                params.set('max_ingredients', maxIngredients); 
                params.set('min_ingredients', 1); 
            }
            try {
                //  API call 
                setLoading(true); 
                setError(null); 
                const res = await fetch(`${apiUrl}dishes/search?${params.toString()}`, {signal: controller.signal}); 

                // Error handle: 
                if (!res.ok) {
                    if (res.status == 401) {
                        setIsExpired(true)
                        return
                    } 
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
    }, [query, course, maxIngredients, page]); 

    // --- Page View --- 
    // if (loading) return ;
    if (error) return <div>Error: {error}</div>;

    return (
        <Container maxW="container.xl" centerContent>
            
           <Flex direction="column" align="left" w={{base:"95%", lg:"90%"}}>
                {/* --- Search Box ---  */}
                <Box>
                    <Input 
                        type="text"
                        value={inputValue}  
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={(e) => {
                            if(e.key === 'Enter') {
                                setQuery(inputValue)
                                setInputValue('')
                            }
                        }}
                        placeholder="Search for recipes..." 
                        size="lg" 
                        w="100%"
                        mt={10}
                        rounded="md"
                        boxShadow="4px 4px 12px rgba(0, 0, 0, 0.15)"
                    />
                </Box>
                
                {/* --- Filter Box ---  */}
                <Box mt={2} mb={2} >
                    <Box textAlign="left">
                        <Collapsible.Root 
                            as="legend"
                            boxShadow={isOpen ? "4px 4px 12px rgba(0, 0, 0, 0.15)" : "none"}
                            border={isOpen ? "sm" : "none"} rounded="md"
                            padding= "8px 0"
                            open={isOpen} onOpenChange={(e) => setIsOpen(e.open)}
                        >
                                <Collapsible.Trigger>
                                <HStack gap={5}>
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
                                    {/* Filter tag show when chosen */}
                                    {!isOpen && course && <>
                                        <Separator orientation="vertical" height="4"/>
                                        <Tag.Root>
                                            {course}
                                            <Tag.EndElement>  
                                                <TagCloseTrigger
                                                    cursor="pointer"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setCourse(''); 
                                                        setInputCourse('');
                                                    }}
                                                />
                                            </Tag.EndElement>
                                        </Tag.Root>
                                    </>}
                                </HStack>
                                </Collapsible.Trigger>
                                
                                <Collapsible.Content >
                                    <VStack align="stretch" gap={6} padding="5">
                                        {/* Course Selection */}
                                        <Box>
                                            <Text fontWeight="bold" mb={3} fontSize="sm">Categories</Text>
                                            <Flex wrap="wrap" gap={2}>
                                                {courseTag.map(tag => (
                                                    <Button
                                                        key={tag}
                                                        size="sm"
                                                        rounded="md"
                                                        variant={inputCourse === tag ? 'solid' : 'outline'}
                                                        bg={inputCourse === tag ? 'gray.400' : 'transparent'}
                                                        color={inputCourse === tag ? 'white' : 'black'}
                                                        borderColor="gray.300"
                                                        onClick={() => togggleInputCourse(tag)}
                                                    >
                                                        {tag}
                                                    </Button>
                                                ))}
                                            </Flex>
                                        </Box>

                                        {/* Ingredient Count Slider */}
                                        <Box >
                                            <Text fontWeight="bold" mb={3} fontSize="sm"> Max Ingredients Count</Text>
                                            <Slider.Root 
                                                min={1} max={15} step={1}
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
                                                        setQuery('')
                                                        setCourse(inputCourse)
                                                        if (inputMaxIngredients) {setMaxIngredients(inputMaxIngredients)}
                                                    }, 300)
                                                }}
                                            >Done</Button>
                                        </HStack>
                                    </VStack>
                                </Collapsible.Content>
                        </Collapsible.Root>
                    </Box>
                </Box>
                
                {/* --- Search results count ----  */}
                {(query || course || maxIngredients) && (
                    <Text 
                        color="gray.500" 
                        fontStyle="italic"
                    >
                        {result.total_results} recipes found    
                    </Text>
                )}
            </Flex>

            {/* --- Dish cards --- */}
            <Flex 
                gap="3" 
                w={{base:"95%", lg:"90%"}} 
                mt="2" mb="5"
                wrap="wrap" 
                justify="center"
            >
                {dishes.map((dish, index) => (
                    <DishCard key={index} 
                    dishName={dish.dish_name}
                    dishDescription={dish.description}
                    dishCourse={dish.course} 
                    dishImage={dish.image}
                    dishID={dish.dish_id}/>
                ))} 
            </Flex>

            {/* --- Pagination control --- */}
            <Pagination.Root 
                count={result.total_results || 0} // total num of data items 
                pageSize={limit} //  num of data per page 
                page = {page}
                onPageChange={(e) =>setPage(e.page)}
            >
                <ButtonGroup gap="4" size="lg" variant="outline">
                    <Pagination.PrevTrigger asChild>
                        <IconButton>
                            <i className="ri-arrow-left-long-line"></i>
                        </IconButton>
                    </Pagination.PrevTrigger>

                    <Pagination.PageText />

                    <Pagination.NextTrigger asChild>
                        <IconButton>
                            <i className="ri-arrow-right-long-line"></i>
                        </IconButton>
                    </Pagination.NextTrigger>
                </ButtonGroup>
            </Pagination.Root>

        </Container>
    );
}