import {
    // frame:
    Box, Flex, VStack, HStack,
    // functional:
    Input, Button, Dialog, Portal, Tag, TagCloseTrigger,
    // typography:
    Text
} from "@chakra-ui/react";
import { useState, useEffect } from "react";
import DishCard from "./DishCard";

export default function DishSearchDialog({ isOpen, onClose, onSelect, excludeIds = [] }) {
    const apiUrl = import.meta.env.VITE_BASE_API_URL;

    // --- Search State ---
    const [inputValue, setInputValue] = useState('');
    const [query, setQuery] = useState('');
    const courseTag = ['breakfast', 'main-dishes', 'side-dishes', 'appetizers', 'soups', 'salads', 'desserts'];
    const [selectedCourse, setSelectedCourse] = useState('');

    // --- Results state ---
    const [dishes, setDishes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // --- Reset when dialog opens ---
    useEffect(() => {
        if (isOpen) {
            setInputValue('');
            setQuery('');
            setSelectedCourse('');
            setDishes([]);
        }
    }, [isOpen]);


    // --- Fetch Data ---
    useEffect(() => {

        if (!isOpen) return;
        const controller = new AbortController();

        const fetchResults = async () => {

            const params = new URLSearchParams();
            params.set('limit', 15);
            params.set('page', 1);
            if (query) params.set('q', query);
            if (selectedCourse) params.set('course', selectedCourse);

            try {
                setLoading(true);
                setError(null);
                const res = await fetch(`${apiUrl}dishes/search?${params.toString()}`, {
                    signal:     controller.signal
                });

                if (!res.ok) throw new Error('Search failed');

                const data = await res.json();
                setDishes(data.dishes);

            } catch (err) {
                if (err.name === 'AbortError') return;
                setError('Search failed, try again.');
            } finally {
                setLoading(false);
            }
        };

        fetchResults();
        return () => controller.abort();

    }, [query, selectedCourse, isOpen]); 

    return (
        // onOpenChange allows multiple ways to close Dialog (Esc key, click outside, click close button)
        <Dialog.Root size={{base: "sm", lg: "lg"}} open={isOpen} onOpenChange={(e) => { if (!e.open) onClose(); }} >
            <Portal>
                <Dialog.Backdrop />
                <Dialog.Positioner>
                    <Dialog.Content borderRadius="2xl" p={2} maxH="85vh" overflow="hidden" display="flex" flexDirection="column">

                        {/* Header */}
                        <Dialog.Header>
                            <Dialog.Title>Add a Dish</Dialog.Title>
                            <Dialog.CloseTrigger />
                        </Dialog.Header>

                        <Dialog.Body flex="1" overflow="hidden" display="flex" flexDirection="column" gap={3}>

                            {/* Search Input */}
                            <Input
                                type="text"
                                placeholder="Search for a dish..."
                                value={inputValue}
                                size = "lg"
                                minH="40px"
                                maxH="40px"
                                w="100%"
                                rounded="md"
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        setQuery(inputValue);
                                    }
                                }}
                            />

                            {/* Course Filter Tags */}
                            <Flex wrap="wrap" gap={2}>
                                {courseTag.map(tag => (
                                    <Button
                                        key={tag}
                                        size="sm"
                                        rounded="md"
                                        variant={selectedCourse === tag ? 'solid' : 'outline'}
                                        bg={selectedCourse === tag ? 'gray.400' : 'transparent'}
                                        color={selectedCourse === tag ? 'white' : 'black'}
                                        borderColor="gray.300"
                                        onClick={() => setSelectedCourse(prev => prev === tag ? '' : tag)}
                                    >
                                        {tag}
                                    </Button>
                                ))}
                            </Flex>

                            {/* Results */}
                            <Box flex="1" overflowY="auto">
                                {/* {loading && <Text color="gray.400">Searching...</Text>} */}
                                {error && <Text color="red.400">{error}</Text>}
                                {!loading && !error && dishes.length === 0 && query && (
                                    <Text color="gray.400">No dishes found.</Text>
                                )}
                                <Flex gap={4} wrap="wrap" justify="center">
                                    {dishes
                                        .filter(d => !excludeIds.includes(d.dish_id))
                                        .map(dish => (
                                            <DishCard
                                                key={dish.dish_id}
                                                dishName={dish.dish_name}
                                                dishDescription={dish.description}
                                                dishCourse={dish.course}
                                                dishImage={dish.image}
                                                dishID={dish.dish_id}
                                                onAdd={() => {
                                                    onSelect(dish);
                                                    onClose();
                                                }}
                                            />
                                        ))
                                    }
                                </Flex>
                            </Box>
                        </Dialog.Body>
                    </Dialog.Content>
                </Dialog.Positioner>
            </Portal>
        </Dialog.Root>
    );
}