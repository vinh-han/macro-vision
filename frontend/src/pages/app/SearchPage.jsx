import { useState } from "react";
import {
    Container, Flex, Box, HStack, VStack,
    Input, Button, Collapsible, Text, Separator,
    Slider
} from "@chakra-ui/react";
import DishCard from "../../components/DishCard";

export default function SearchPage() {
    
    // --- Filter State ---
    const [isOpen, setIsOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(''); 
    const [ingredientsNum, setIngredientsNum] = useState(6);

    const categories = [
        'appetizers', 'breakfast', 'desserts', 'drinks', 
        'salads', 'side-dishes', 'snacks', 'soups'
    ];

    const handleClose = () => setIsOpen(false);

    return (
        <Container centerContent maxW="container.xl">
            {/* Search Box */}
            <Container centerContent maxW="full">
                <Input 
                    placeholder="Search for recipes..." 
                    size="lg" 
                    w={{ base: "95%", md: "70%", lg: "60%" }}
                    mt={10}
                />
            </Container>

            {/* Search Filter */}
            <Container w={{ base: "95%", md: "70%", lg: "60%" }} mt={4}>
                {/* Toggle Button & Active Tags */}
                <HStack  gap={3}>
                    <Button
                        variant="outline"
                        borderRadius="full"
                        size="sm"
                        onClick={() => setIsOpen(!isOpen)}
                    >
                        <i className="ri-equalizer-line"></i>
                        Filter
                    </Button>
                    
                    {/* Shows the applied tag when the panel is closed */}
                    {!isOpen && selectedCategory && (
                        <Box 
                            px={3} py={1} 
                            borderRadius="full" 
                            bg="gray.400" 
                            color="white" 
                            fontSize="sm" 
                            fontWeight="medium"
                        >
                            {selectedCategory}
                        </Box>
                    )}
                </HStack>

                {/* The Expanding Panel */}
                <Collapsible.Root open={isOpen} onOpenChange={(e) => setIsOpen(e.open)}>
                    <Collapsible.Content>
                        <Box 
                            p={5} 
                            mt={2} 
                            borderWidth="1px" 
                            borderRadius="md" 
                            borderColor="gray.300" 
                            bg="white"
                            mb={4}
                        >
                            <VStack align="stretch" gap={6}>
                                {/* Categories Grid */}
                                <Box>
                                    <Text fontWeight="bold" mb={3} fontSize="sm">Categories</Text>
                                    <Flex wrap="wrap" gap={2}>
                                        {categories.map(cat => (
                                            <Button
                                                key={cat}
                                                size="sm"
                                                variant={selectedCategory === cat ? 'solid' : 'outline'}
                                                bg={selectedCategory === cat ? 'gray.400' : 'transparent'}
                                                color={selectedCategory === cat ? 'white' : 'black'}
                                                borderColor="gray.300"
                                                borderRadius="full"
                                                onClick={() => setSelectedCategory(cat)}
                                            >
                                                {cat}
                                            </Button>
                                        ))}
                                    </Flex>
                                </Box>

                                {/* Ingredients Slider */}
                                <Box>
                                    <Text fontWeight="bold" mb={6} fontSize="sm">Ingredients Number</Text>
                                    
                                    <Slider.Root
                                        defaultValue={[6]}
                                        min={4}
                                        max={15}
                                        step={1}
                                        onValueChange={(details) => setIngredientsNum(details.value[0])} 
                                    >
                                        <Slider.Control>
                                            <Slider.Track bg="gray.200">
                                                <Slider.Range bg="red.500" />
                                            </Slider.Track>
                                            <Slider.Thumb index={0} bg="red.500" />
                                        </Slider.Control>
                                        
                                        {/* Minimal Value Display under slider */}
                                        <HStack justify="space-between" mt={2}>
                                            <Text fontSize="xs" color="gray.500">4</Text>
                                            <Text fontSize="sm" fontWeight="bold" bg="gray.200" px={2} py={0.5} borderRadius="md">
                                                {ingredientsNum}
                                            </Text>
                                            <Text fontSize="xs" color="gray.500">15</Text>
                                        </HStack>
                                    </Slider.Root>
                                </Box>

                                {/* Action Buttons */}
                                <HStack justify="space-evenly" pt={4}>
                                    <Button variant="ghost" size="sm" onClick={handleClose}>Cancel</Button>
                                    <Button variant="ghost" size="sm" onClick={handleClose}>Done</Button>
                                </HStack>
                            </VStack>
                        </Box>
                    </Collapsible.Content>
                </Collapsible.Root>
            </Container>
            
            {/* Dish cards */}
            <Flex gap="5" wrap="wrap" justify="center" maxW="80%" mt="2">
                <DishCard/>
                <DishCard/>
                <DishCard/>
            </Flex>
        </Container>
    );
}