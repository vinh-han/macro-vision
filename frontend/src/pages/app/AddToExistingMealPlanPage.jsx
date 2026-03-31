import { useOutletContext } from "react-router"
import { Box, Text, Button, DatePicker, Portal, parseDate } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { getCookie } from "../../components/Methods";
import RecipeCardSmall from "../../components/RecipeCardSmall";
import MealCardHorizontal from "../../components/MealCardHorizontal";

export default function AddToExistingMealPlanPage() {
    const baseUrl = import.meta.env.VITE_BASE_API_URL;
    const selectedRecipe = useOutletContext();
    const [mealList, setMealList] = useState([]);

    const currentDate = new Date();
    const [selectedDate, setSelectedDate] = useState(new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), currentDate.getHours(), currentDate.getMinutes()));

    useEffect(() => {
        const formattedDate = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart('2', 0)}-${String(selectedDate.getDate()).padStart('2', 0)}`
        
        fetch(`${baseUrl}meal-cards/daily?date=${formattedDate}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${getCookie('token')}`,
                'Content-Type': 'application/json'
            }
        }).then((response) => {
            if (response.status == 200) {
                return response.json()
            }

            return Promise.reject(response)
        }).then((data) => {
            if (data) {
                setMealList(data)
            } else {
                setMealList([])
            }
            
        }).catch((response) => {
            console.log(response)
        })
    }, [selectedDate])

    function onDateChage(e) {
        const newDateVal = e.value[0]

        if (!newDateVal) {
            return
        }

        const nextDate = new Date()
        nextDate.setFullYear(newDateVal.year)
        nextDate.setDate(newDateVal.day)
        nextDate.setMonth(newDateVal.month - 1)

        setSelectedDate(nextDate);
        setMealList([]);
    }
    return (
        <Box
            width="100%">
            <Box
                width="100%">
                <DatePicker.Root value={[parseDate(selectedDate)]} width="100%" size="lg" onValueChange={onDateChage}>
                    <DatePicker.Control>
                        <DatePicker.Input
                            variant="outline" 
                            size="lg"
                            background="#E7E7E7"
                            border="solid 1px #7A7A7A" />
                        <DatePicker.IndicatorGroup>
                            <DatePicker.Trigger>
                                <i className="ri-calendar-line" style={{lineHeight: 1, fontSize: "1.5em"}}></i>
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
            </Box>
            <Box marginTop="1rem">
                <RecipeCardSmall dish={selectedRecipe} />
            </Box>
            <Box marginTop="1.3rem" width="100%" height="2px" bgColor="black" />
            <Box
                paddingBottom="1rem"
                marginTop="1rem"
                display="flex"
                flexDirection="column"
                gap="4"
                maxHeight="28rem"
                overflowY="scroll">
                {mealList.map((meal, index) => (
                    <MealCardHorizontal key={index} dish_id={selectedRecipe.dish_id} card_id={meal.card_id} />
                ))}

                
            </Box>
            

        </Box>
    )
}