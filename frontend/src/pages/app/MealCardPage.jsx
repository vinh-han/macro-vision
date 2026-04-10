import { 
    // frame: 
    Box, Container, HStack, Flex, VStack,
    // typography: 
    Heading, Text,
    // functional: 
    Image, Button, Tag, Menu, Portal, DatePicker, parseDate, Input, 
} from "@chakra-ui/react"
import DishCard from "../../components/DishCard";
import DishSearchDialog from "../../components/DishSearchDialog";
import { useNavigate, useLocation, useParams } from "react-router"
import { useState, useEffect } from "react";
import { getCookie } from "../../components/Methods";


export default function MealCardPage() {
    const navigate = useNavigate(); 
    const location = useLocation()
    const apiUrl = import.meta.env.VITE_BASE_API_URL;
    const {cardID} = useParams(); 

    // --- States --- 
    // Page state  
    const [loading, setLoading] = useState(true); 
    const [error, setError] = useState(null); 
    const [metadata, setMetadata] = useState(null); // title, date 
    const [dishes, setDishes] = useState([]); 

    // Edit mode  state 
    const [isEditing, setIsEditing] = useState(false);
    // Temp edit state (initialized from metadata/dishes when entering edit mode)
    const [editTitle, setEditTitle] = useState('');
    const [editDate, setEditDate] = useState('');
    const [editDishes, setEditDishes] = useState([]);
    const [showDishSearch, setShowDishSearch] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

const [editTime, setEditTime] = useState('07:00');

// Initialize when entering edit mode
useEffect(() => {
  if (isEditing && editDate) {
    const timeStr = editDate.split('T')[1]?.substring(0, 5) || '07:00';
    setEditTime(timeStr);
  }
}, [isEditing, editDate]);
        
    // --- Functions ---- 
    // Display mode: Format date for Frontend display 
    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        return new Date(dateStr).toLocaleDateString('en-GB', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    };
    
    // Save mode: Format date for API 
    const formatDateForAPI = (date) => {
        if (!date) return date;
        if (date.includes('T')) return date; 
        return `${date}T07:00:50Z`; 
    }

    // Edit mode: Remove dish 
    const handleRemoveDish = (dishId) => {
        setEditDishes(prev => prev.filter(d => d.dish_id !== dishId));
    };

    // Edit mode: Add dish 
    const handleAddDish = (dish) => {
        setEditDishes(prev => [...prev, dish]);
    };

    // --- API call --- 
    // Fetch data for display mode 
    useEffect(() => {
        const controller = new AbortController(); 
        setLoading(true); 
        setError(null)

        const fetchData = async() => {
            try {
                const response = await fetch(`${apiUrl}meal-cards/${cardID}`, { 
                    signal: controller.signal , 
                    method: 'GET',
                    headers: { 'Authorization': `Bearer ${getCookie('token')}` },
                })

                if(!response.ok) {
                    throw new Error('Failed with status: ', + response.status); 
                }

                const result = await response.json(); 
                setMetadata(result.MealCard); 
                setDishes(result.Dishes)
                console.log(result.MealCard)

            } catch (err) {
                if (err.name !== 'AbortError') 

                if (err.message.includes("404")){
                    setError("Meal Card not found"); 
                } else if (error.message.includes("401")) {
                    setError("Please login first"); 
                } else {
                    setError("Something went wrong")
                }
            } finally {
                setLoading(false)
            }
        }; 

        fetchData(); 
        return () => controller.abort(); 

    }, [cardID]); 

    // Delete entire meal card
    const handleDeleteMealCard = async () => {
        if (!window.confirm("Are you sure you want to delete this meal card?")) return;

        try {
            const response = await fetch(`${apiUrl}meal-cards/${cardID}`,  {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${getCookie('token')}`
                }
            });
            if (!response.ok) {
                throw new Error(res.status);
            }

            navigate('/app/meal-planner');

        } catch (error) {
            console.error('Error deleting meal card:', error);
        }
    };

    // Save everything from edit mode 
    const handleSave = async () => {
        setIsSaving(true);
        try {
            // Diff against original dishes to find deleted and added
            const deletedIds = dishes
                .filter(d => !editDishes.find(e => e.dish_id === d.dish_id))
                .map(d => d.dish_id);

            const addedDishes = editDishes
                .filter(e => !dishes.find(d => d.dish_id === e.dish_id));

            // 1. DELETE removed dishes in parallel
            await Promise.all(
                deletedIds.map(id =>
                    fetch(`${apiUrl}meal-cards/dishes`, {
                        method: 'DELETE',
                        headers: {
                            'Authorization': `Bearer ${getCookie('token')}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ card_id: cardID, dish_id: id })
                    })
                )
            );

            // 2. PUT title + date
            await fetch(`${apiUrl}meal-cards/${cardID}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${getCookie('token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    title: editTitle, 
                    meal_date: formatDateForAPI(editDate)
                })
            });

            // 3. POST added dishes in parallel
            await Promise.all(
                addedDishes.map(dish =>
                    fetch(`${apiUrl}meal-cards/dishes`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${getCookie('token')}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ card_id: cardID, dish_id: dish.dish_id })
                    })
                )
            );

            // 4. Update to to confirmed state / Update to display mode 
            setMetadata(prev => ({ ...prev, title: editTitle, meal_date: editDate }));
            setDishes(editDishes);
            setIsEditing(false);

        } catch (err) {
            console.error('Save failed:', err);
            setError('Failed to save changes. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    // ---- VIEW ---- 
     if (error) return <Text>Error: {error} </Text>

    return (
        <Box bg="white" minH="100vh">

            {/* --- Top header --- */}
            {isEditing ? (
                <Box bg="grey" py={4} px={4}>
                    <Text color="white" fontWeight="bold" textAlign="center" fontSize="lg">
                        Editing
                    </Text>
                </Box>
            ) : (
                <Box bg="black" py={4} px={4}>
                    <Box 
                        as="span" 
                        color="white" fontSize="24px" 
                        cursor="pointer" onClick={() => navigate(location.state?.from || "/app/meal-planner")}
                    >
                        <i className="ri-arrow-left-line"></i>
                    </Box>
                </Box>
            )}

            {/* --- Page Content --- */}
            <Box px={6} pt={6} maxW="90%" mx="auto">

                <HStack gap={5} pt={5}>

                    {/* Title */}
                    {isEditing 
                        ? <Input 
                            value={editTitle} 
                            onChange={e => setEditTitle(e.target.value)}
                            fontSize="4xl"
                            fontWeight="bold"
                        />
                        : <Heading fontSize="4xl">{metadata?.title}</Heading>
                    }


                    {/* Setting Options */}
                    <Menu.Root>

                        <Menu.Trigger asChild>
                            <Button variant="ghost" borderRadius="full" p={2}>
                                <i className="ri-more-fill"></i>
                            </Button>
                        </Menu.Trigger>

                        <Portal>
                            <Menu.Positioner>
                                <Menu.Content bg="white" borderRadius="2xl"
                                    boxShadow="lg" p={2} minW="200px"
                                >
                                    <Text fontSize="sm" color="gray.400"
                                        px={3} py={2}>
                                        Meal Card Options: 
                                    </Text>

                                    <Menu.Item
                                        value="edit"
                                        fontWeight="bold"
                                        px={3}
                                        py={2}
                                        borderRadius="lg"
                                        _hover={{ bg: "gray.100" }}
                                        onClick={() => {
                                            setIsEditing(true);
                                            // Initialized when entering Edit mode 
                                            setEditDate(metadata.meal_date);
                                            setEditTitle(metadata.title); 
                                            setEditDishes([...dishes]); 
                                        }}
                                    >
                                        Edit
                                    </Menu.Item>

                                    <Menu.Item
                                        value="delete"
                                        fontWeight="bold"
                                        px={3}
                                        py={2}
                                        borderRadius="lg"
                                        _hover={{ bg: "gray.100" }}
                                        onClick={handleDeleteMealCard} 
                                    >
                                        Delete meal card
                                    </Menu.Item>
                                </Menu.Content>
                            </Menu.Positioner>
                        </Portal>
                    </Menu.Root>
                </HStack>

                {/* Date */}
                {isEditing
                    ? <DatePicker.Root
                        view="day"  // Lock to day view
                        locale="en-GB"
                        timeZone="Asia/Ho_Chi_Minh"
                        defaultValue={editDate ? [parseDate(editDate.split('T')[0])] : undefined}
                        onValueChange={(e) => {
                            if (e.value[0]) {
                            const { year, month, day } = e.value[0];
                            const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                            
                            // Preserve existing time if it exists, otherwise use current time or default
                            const existingTime = editDate?.split('T')[1] || editTime || '07:00:00Z';
                            setEditDate(`${dateStr}T${existingTime}`);
                            }
                        }}
                        >
                        <DatePicker.Control>
                            <DatePicker.Input />
                            <DatePicker.IndicatorGroup>
                            <DatePicker.Trigger>
                                <i className="ri-calendar-view"></i>
                            </DatePicker.Trigger>
                            </DatePicker.IndicatorGroup>
                        </DatePicker.Control>
                        <Portal>
                            <DatePicker.Positioner>
                            <DatePicker.Content>
                                <DatePicker.View view="day">
                                <DatePicker.Header/>
                                <DatePicker.DayTable/>
                                {/*  Custom hour/minute input */}
                                <HStack p={3} gap={3} bg="gray.50" borderRadius="md">
                                    <VStack gap={0}>
                                        <Text fontSize="xs" color="gray.500" fontWeight="medium">Hour</Text>
                                        <Input
                                            type="number"
                                            min={0}
                                            max={23}
                                            value={editTime.split(':')[0]}
                                            onChange={(e) => {
                                                let hour = parseInt(e.target.value) || 0;
                                                hour = Math.max(0, Math.min(23, hour));
                                                const minute = editTime.split(':')[1] || '00';
                                                const newTime = `${String(hour).padStart(2, '0')}:${minute}`;
                                                setEditTime(newTime);
                                                if (editDate) {
                                                    const dateStr = editDate.split('T')[0];
                                                    setEditDate(`${dateStr}T${newTime}:00Z`);
                                                }
                                            }}
                                            width="80px"
                                            height="50px"
                                            textAlign="center"
                                            fontSize="xl"
                                            fontWeight="bold"
                                        />
                                    </VStack>
                                    
                                    <Text fontWeight="bold" fontSize="2xl" pt={5}>:</Text>
                                    
                                    <VStack gap={0}>
                                        <Text fontSize="xs" color="gray.500" fontWeight="medium">Minute</Text>
                                        <Input
                                            type="number"
                                            min={0}
                                            max={59}
                                            value={editTime.split(':')[1]}
                                            onChange={(e) => {
                                                const hour = editTime.split(':')[0] || '00';
                                                let minute = parseInt(e.target.value) || 0;
                                                minute = Math.max(0, Math.min(59, minute));
                                                const newTime = `${hour}:${String(minute).padStart(2, '0')}`;
                                                setEditTime(newTime);
                                                if (editDate) {
                                                    const dateStr = editDate.split('T')[0];
                                                    setEditDate(`${dateStr}T${newTime}:00Z`);
                                                }
                                            }}
                                            width="80px"
                                            height="50px"
                                            textAlign="center"
                                            fontSize="xl"
                                            fontWeight="bold"
                                        />
                                    </VStack>
                                </HStack>
                                </DatePicker.View>
                            </DatePicker.Content>
                            </DatePicker.Positioner>
                        </Portal>
                        </DatePicker.Root>
                    : <Text color="gray.600" mt={1} mb={4}>{formatDate(metadata?.meal_date)}</Text>
                }
                
                {/* Dish Count */}
                {isEditing 
                    ? <Text fontWeight="bold" fontSize="lg" mb={4}>
                        {editDishes?.length} dish: 
                    </Text>
                    :  <Text fontWeight="bold" fontSize="lg" mb={4}>
                        {dishes?.length} dish: 
                    </Text>
                }

                {/* --- Dish Cards ---  */}
                <Flex 
                    gap="5"
                    wrap="wrap" 
                >
                    {(isEditing ? editDishes : dishes).map((dish) => (
                        <DishCard
                            key={dish.dish_id}
                            dishName={dish.dish_name}
                            dishDescription={dish.description}
                            dishCourse={dish.course}
                            dishImage={dish.image}
                            dishID={dish.dish_id}
                            onRemove={isEditing ? () => handleRemoveDish(dish.dish_id) : undefined}
                        />
                    ))}
                </Flex>

                {/* --- Add new dish Button --- */}
                {isEditing && (
                    <>
                        <Box
                            mt={4}
                            border="2px dashed"
                            borderColor="gray.300"
                            borderRadius="2xl"
                            h="120px"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                            cursor="pointer"
                            onClick={() => setShowDishSearch(true)}
                        >
                            <i className="ri-add-line" style={{ fontSize: '24px', color: 'gray' }}></i>
                        </Box>

                        <DishSearchDialog
                            isOpen={showDishSearch}
                            onClose={() => setShowDishSearch(false)}
                            onSelect={handleAddDish}
                            excludeIds={editDishes.map(d => d.dish_id)}
                        />
                    </>
                )}

                {/* --- Buttons in Editing mode ---  */}
                {isEditing && (
                    <HStack mt={4} p={4}>
                        <Button 
                            mt={2} 
                            onClick={() => {
                            setIsEditing(false);
                            setEditDishes([]);
                            setEditTitle('');
                            setEditDate('');
                            }}
                            disabled={isSaving}
                            opacity={isSaving ? 0.6 : 1}
                        >
                            Cancel
                        </Button>
                        <Button 
                            mt={2} 
                            bg="red.500" 
                            onClick={handleSave}
                            disabled={isSaving}
                            opacity={isSaving ? 0.6 : 1}
                        >
                            {isSaving ? 'Saving...' : 'Save'}
                        </Button>
                    </HStack>
                )}
            </Box>
        </Box>
    )
}