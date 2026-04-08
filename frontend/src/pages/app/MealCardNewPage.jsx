import { 
    Box, HStack, Heading, Text, Input, Button, Flex,
    DatePicker, Portal, parseDate,
} from "@chakra-ui/react"
import DishCard from "../../components/DishCard";
import DishSearchDialog from "../../components/DishSearchDialog";
import { useNavigate, useLocation } from "react-router"
import { useState } from "react";
import { getCookie } from "../../components/Methods";

export default function MealCardNewPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const apiUrl = import.meta.env.VITE_BASE_API_URL;

    // --- Page state ---
    // Pre-fill date from MealPlannerPage if passed, otherwise blank
    const [title, setTitle] = useState('');
    const [date, setDate] = useState(location.state?.date ?? '');
    const [dishes, setDishes] = useState([]);

    // --- Status state ---
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState(null);
    const [showDishSearch, setShowDishSearch] = useState(false);

    // --- Functions ---
    const handleAddDish = (dish) => {
        setDishes(prev => [...prev, dish]);
    };

    const handleRemoveDish = (dishId) => {
        setDishes(prev => prev.filter(d => d.dish_id !== dishId));
    };

    const formatDateForAPI = (date) => {
        if (!date) return date;
        if (date.includes('T')) return date;
        return `${date}T07:00:50Z`;
    }

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
                    meal_date: formatDateForAPI(date),
                    dishes: dishes.map(d => d.dish_id)
                })
            });

            if (!response.ok) throw new Error('Failed to create meal card');

            const result = await response.json();
            console.log(result);
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
                                if (error) setError(null); // clear error as user types
                            }}
                            placeholder="Meal card title..."
                            fontSize="4xl"
                            fontWeight="bold"
                            borderColor={error ? 'red.400' : undefined}
                        />
                        {error && (
                            <Text color="red.400" fontSize="sm" mt={1}>
                                {error}
                            </Text>
                        )}
                    </Box>
                </HStack>

                {/* Date picker — initialized from planner date */}
                <DatePicker.Root
                    locale="en-GB"
                    defaultValue={date ? [parseDate(date)] : undefined}
                    onValueChange={(e) => {
                        if (e.value[0]) {
                            const { year, month, day } = e.value[0];
                            setDate(
                                `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                            );
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
                                    <DatePicker.Header />
                                    <DatePicker.DayTable />
                                </DatePicker.View>
                                <DatePicker.View view="month">
                                    <DatePicker.Header />
                                    <DatePicker.MonthTable />
                                </DatePicker.View>
                                <DatePicker.View view="year">
                                    <DatePicker.Header />
                                    <DatePicker.YearTable />
                                </DatePicker.View>
                            </DatePicker.Content>
                        </DatePicker.Positioner>
                    </Portal>
                </DatePicker.Root>

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
                <HStack mt={4} p={4}>
                    <Button
                        onClick={() => navigate(location.state?.from || "/app/meal-planner")}
                        disabled={isSaving}
                        opacity={isSaving ? 0.6 : 1}
                    >
                        Cancel
                    </Button>
                    <Button
                        bg="red.500"
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