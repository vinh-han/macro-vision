import { 
    Box, HStack, Heading, Text, Input, Button, Flex,
    DatePicker, Portal, parseDate,
} from "@chakra-ui/react"
import DishCard from "../../components/DishCard";
import DishSearchDialog from "../../components/DishSearchDialog";
import { useNavigate, useLocation } from "react-router"
import { useState } from "react";
import { getCookie } from "../../components/Methods";
import { useSessionExpireContext } from "../../context/SessionExpireContext";


export default function MealCardNewPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const apiUrl = import.meta.env.VITE_BASE_API_URL;
    const {setIsExpired} = useSessionExpireContext();

    // --- Page state ---
    const [title, setTitle] = useState('');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('07:00'); // Default time for new cards
    const [dishes, setDishes] = useState([]);

    // --- Status state ---
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState(null);
    const [showDishSearch, setShowDishSearch] = useState(false);
    const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

    // --- Functions ---
    // Formatter for display
    const formatter = new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
    })

    // Format display value
    const getDisplayValue = () => {
        if (!date) return "Select date and time";
        const [year, month, day] = date.split('-');
        const [hours, minutes] = time.split(':');
        const dateObj = new Date(year, month - 1, day, hours, minutes);
        return formatter.format(dateObj);
    }

    const handleAddDish = (dish) => {
        setDishes(prev => [...prev, dish]);
    };

    const handleRemoveDish = (dishId) => {
        setDishes(prev => prev.filter(d => d.dish_id !== dishId));
    };

    const formatDateForAPI = (date, time) => {
        if (!date) return date;
        const dateStr = date.split('T')[0];
        return `${dateStr}T${time}:00Z`;
    }

    // Create new meal card
    const handleCreate = async () => {
        // basic validation before sending to api 
        if (!title.trim()) return setError('Please add a title.');
        if (!date) return setError('Please select a date.');

        setIsSaving(true);
        setError(null);

        try {
            const response = await fetch(`${apiUrl}meal-cards/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${getCookie('token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    title: title.trim(),
                    meal_date: formatDateForAPI(date, time),
                    dishes: dishes.map(d => d.dish_id)
                })
            });

            if (!response.ok) {
                if (response.status == 401) {
                    setIsExpired(true)
                    return
                } 
                throw new Error('Failed to create meal card');
            }

            const result = await response.json();
            navigate(`/app/meal-card/${result.MealCard.card_id}`);

        } catch (err) {
            console.error('Create failed:', err);
            setError('Failed to create meal card. Please try again.');
        } finally {
            setIsSaving(false);
        }
    }

    return (
        <Box bg="white" minH="100vh">

            {/* --- Top header --- */}
            <Box bg="grey" py={4} px={4}>
                <Text color="white" fontWeight="bold" textAlign="center" fontSize="lg">
                    New Meal Card
                </Text>
            </Box>

            {/* --- Page Content --- */}
            <Box px={6} pt={6} maxW="90%" mx="auto">

                <HStack gap={5} pt={5}>
                    {/* Title input */}
                    <Box w="100%">
                        <Input
                            value={title}
                            onChange={e => {
                                setTitle(e.target.value);
                                if (error) setError(null);
                            }}
                            placeholder="Meal card title..."
                            fontSize="4xl"
                            fontWeight="bold"
                            height="50px"
                            borderColor={error ? 'red.400' : undefined}
                        />
                        {error && (
                            <Text color="red.400" fontSize="sm" mt={1}>
                                {error}
                            </Text>
                        )}
                    </Box>
                </HStack>

                {/* Date & Time picker */}
                <DatePicker.Root
                    view="day"
                    locale="en-GB"
                    timeZone="Asia/Ho_Chi_Minh"
                    onValueChange={(e) => {
                        if (e.value[0]) {
                            const { year, month, day } = e.value[0];
                            const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                            setDate(dateStr);
                        }
                    }}
                    open={isDatePickerOpen}
                    onOpenChange={(details) => setIsDatePickerOpen(details.open)}
                >
                    <DatePicker.Control>
                        <DatePicker.Trigger asChild>
                            <Button
                                variant="outline"
                                width="full"
                                height="50px"
                                justifyContent="space-between"
                                mt={2}
                            >
                                {getDisplayValue()}
                                <i className="ri-calendar-view"></i>
                            </Button>
                        </DatePicker.Trigger>
                    </DatePicker.Control>
                    <Portal>
                        <DatePicker.Positioner>
                            <DatePicker.Content>
                                <DatePicker.View view="day">
                                    <DatePicker.Header />
                                    <DatePicker.DayTable />
                                    {/* Time input */}
                                    <Input
                                        type="time"
                                        value={time}
                                        onChange={(e) => {
                                            const newTime = e.target.value;
                                            if (!newTime) return;
                                            setTime(newTime);
                                        }}
                                        mt="2"
                                    />
                                </DatePicker.View>
                            </DatePicker.Content>
                        </DatePicker.Positioner>
                    </Portal>
                </DatePicker.Root>

                {/* Manual backdrop when picker is open */}
                {isDatePickerOpen && (
                    <Box
                        position="fixed"
                        top={0}
                        left={0}
                        right={0}
                        bottom={0}
                        bg="blackAlpha.600"
                        backdropFilter="blur(4px)"
                        zIndex={999}
                        onClick={() => setIsDatePickerOpen(false)}
                    />
                )}

                {/* Dish count */}
                <Text fontWeight="bold" fontSize="lg" mb={4} mt={4}>
                    {dishes.length} dishes
                </Text>

                {/* --- Dish Cards --- */}
                <Flex gap="5" wrap="wrap">
                    {dishes.map((dish) => (
                        <DishCard
                            key={dish.dish_id}
                            dishName={dish.dish_name}
                            dishDescription={dish.description}
                            dishCourse={dish.course}
                            dishImage={dish.image}
                            dishID={dish.dish_id}
                            onRemove={() => handleRemoveDish(dish.dish_id)}
                        />
                    ))}
                </Flex>

                {/* --- Add dish button --- */}
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
                    excludeIds={dishes.map(d => d.dish_id)}
                />

                {/* --- Action buttons --- */}
                <HStack mt={4} p={4} gap={10} justify="center">
                    <Button
                        w="90px"
                        h="50px"
                        p={5}
                        bg="gray"
                        round="md"
                        onClick={() => navigate(location.state?.from || "/app/meal-planner")}
                        disabled={isSaving}
                        opacity={isSaving ? 0.6 : 1}
                    >
                        Cancel
                    </Button>
                    <Button
                        w="90px"
                        h="50px"
                        p={5}
                        round="md"
                        bg="crimsonred.500"
                        onClick={handleCreate}
                        disabled={isSaving}
                        opacity={isSaving ? 0.6 : 1}
                    >
                        {isSaving ? 'Creating...' : 'Create'}
                    </Button>
                </HStack>

            </Box>
        </Box>
    )
}