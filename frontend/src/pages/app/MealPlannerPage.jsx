import { use, useEffect, useState } from "react";
import {
    // frame: 
    Container, Flex, Box, VStack,
    // functional: 
    Input, Button, Pagination , DatePicker, Portal, parseDate,
    // typography: 
    Text, Heading
} from "@chakra-ui/react";
import MealCard from "../../components/MealCard";
import { getCookie } from "../../components/Methods";
import { useNavigate, useLocation } from "react-router"


export default function MealPlannerPage() {
    const location = useLocation();
    const apiUrl = import.meta.env.VITE_BASE_API_URL;
    const navigate = useNavigate();

    // --- Page state -- 
    const today = new Date().toISOString().split('T')[0];
    const [result, setResult] = useState([])
    const [loading, setLoading] = useState(false); 
    const [error, setError] = useState(null); 
    const [date, setDate] = useState(today)
    const dayLabel = new Date(date).toLocaleDateString('en-US', {weekday: 'long'});


    // --- Get The Date Meal Plan Function 
    useEffect(() => {

        const controller = new AbortController(); 

        const fetchResults = async () => {

            try {
                //  API call 
                setLoading(true); 
                setError(null); 
                const res = await fetch(`${apiUrl}meal-cards/daily?date=${date}`, 
                    {
                        headers: {'Authorization': `Bearer ${getCookie('token')}`}, 
                        signal: controller.signal
                    }
                ); 

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
                console.log(data)            
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
    }, [date, location.key]); 


    return (
        <Container maxW="container.xl" centerContent>
            {/* --- Current Day Title & Date Picker ---- */}
            <VStack mt={3} mb={3} alignItems="flex-start" w={{base:"80%", lg:"55%"}}>
                <Heading as="h1" size="3xl"> {dayLabel}'s meal card</Heading>

                {/* Date Picker  */}
                <DatePicker.Root 
                    locale="en-GB"
                    defaultValue={[parseDate(date)]}
                    onValueChange={(e) => {
                    if (e.value[0]) {
                        const { year, month, day } = e.value[0];
                        const formatted = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                        setDate(formatted);
                    }
                    }}
                >
                    <DatePicker.Label>Date: </DatePicker.Label>
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
                                </DatePicker.View>

                                <DatePicker.View view="month">
                                    <DatePicker.Header/>
                                    <DatePicker.MonthTable/>
                                </DatePicker.View>

                                <DatePicker.View view="year">
                                    <DatePicker.Header/>
                                    <DatePicker.YearTable/>
                                </DatePicker.View>
                            </DatePicker.Content>
                        </DatePicker.Positioner>
                    </Portal>
                </DatePicker.Root>
            </VStack>

            {/* --- List of MealCard of the day & Create new MealCard button ---  */}
            <Flex
                gap="5" w="95%"      
                mt="2" 
                wrap="wrap" 
                justify="center"
            >
                
                {!loading && !error && !result && (
                <Text color="gray.500">No meal cards created yet for this day.</Text>
                )}
                {!loading && !error && result && result.map((item) => (
                <MealCard
                    key={item.card_id}
                    cardId={item.card_id}
                    title={item.title}
                    dishes={item.dishes}
                />
                ))}
                <Button 
                    variant="ghost" rounded="md"
                    border="2px dashed" borderColor="crimson.500"
                    w="350px" h="80px"
                     cursor="pointer" onClick={() => navigate(`/app/meal-card/new`)}
                >
                    <i className="ri-add-large-line"></i>
                </Button>
            </Flex>

            {/* --- Pagination to tomorrow or yesterday MealPlan ---  */}
        </Container>
    )
}