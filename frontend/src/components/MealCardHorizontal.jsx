import { Box, Text, Card, Button } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { getCookie } from "./Methods";
import { useSessionExpireContext } from "../context/SessionExpireContext";


export default function MealCardHorizontal({dish_id, card_id}) {
    const baseUrl = import.meta.env.VITE_BASE_API_URL
    const {setIsExpired} = useSessionExpireContext()
    const month = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const [fetchMealCard, setFetchMealCard] = useState(true)
    const [mealCard, setMealCard] = useState(null);

    // Parse date string directly without Date object
    const parseMealDate = (dateStr) => {
        if (!dateStr) return { day: '', month: '', time: '' };
    
        const [datePart, timePart] = dateStr.split('T');
        const [year, monthNum, day] = datePart.split('-');
        const [hours, minutes] = timePart.split(':');
        
        return {
            day: day,
            month: month[parseInt(monthNum) - 1],
            time: `${hours}:${minutes}`
        };
    };

    const dateInfo = mealCard ? parseMealDate(mealCard.MealCard.meal_date) : { day: '', month: '', time: '' };

    useEffect(() => {
        if (fetchMealCard) {
            fetch(`${baseUrl}meal-cards/${card_id}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getCookie('token')}`
                }
            }).then((response) => {
                if (response.status == 200) {
                    return response.json()
                }

                return Promise.reject(response)
            }).then((data) => {
                if (data) {
                    setMealCard(data)
                }
            }).catch((response) => {
                if (response.status == 401) {
                    setIsExpired(true)
                } else {
                    response.json().then(data => console.log(data))
                }
            })

            setFetchMealCard(false)
        }
        
    }, [fetchMealCard])

    function addDishToMealCard() {
        if (card_id && dish_id) {
            const data = {
                card_id: card_id,
                dish_id: dish_id
            }
            fetch(`${baseUrl}meal-cards/dishes`, {
                method: 'POST',
                body: JSON.stringify(data),
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
                    setFetchMealCard(true)
                }
            }).catch((response) => {
                if (response.status == 401) {
                    setIsExpired(true)
                } else {
                    response.json().then(data => console.log(data))
                }
            })
        }
    }

    return (
        <>
            {(mealCard) && (
                <Card.Root
                    width="100%"
                    height="7rem"
                    rounded="12px"
                    border="1.5px solid #d4d4d8"
                    boxShadow="0rem 0rem 0.3rem #0000004d"
                    display="flex"
                    flexDir="row"
                    background="crimsonred.500">
                    <Box     
                        padding="0.5rem 0.8rem"
                        paddingRight="1.3rem"
                        roundedLeft="12px"
                        display="flex"
                        justifyContent="space-between"
                        flexDirection="column"
                        color="white">
                            <Text fontSize="3rem" lineHeight="1">{dateInfo.day}</Text>
                            <Box width="100%" height="2.5px" bg="white"></Box>
                            <Text fontSize="2.3rem" lineHeight="1">{dateInfo.month}</Text>
                    </Box>
                    <Card.Body
                        padding="0.5rem 1rem"
                        flex="1"
                        rounded="11px"
                        background="white"
                        position="relative">
                        <Card.Title fontSize="1.8rem" lineHeight="1">
                            {mealCard.MealCard.title}
                        </Card.Title>
                        <Card.Description marginTop="0.3rem">Time: {dateInfo.time}</Card.Description>
                        <Card.Description>{mealCard.Dishes.length} dishes</Card.Description>
                        {(mealCard.Dishes.some(dish => dish.dish_id == dish_id) ? (
                            <Button 
                                size="xs" 
                                padding="0" 
                                position="absolute" 
                                bottom="2" 
                                right="2" 
                                disabled>
                                <i className="ri-check-fill" style={{lineHeight: 0, fontSize: "1.3rem"}}></i>
                            </Button>
                        ) : (
                            <Button 
                                size="xs" 
                                padding="0" 
                                position="absolute" 
                                bottom="2" 
                                right="2" 
                                onClick={addDishToMealCard}>
                                <i className="ri-add-large-line" style={{lineHeight: 0, fontSize: "1.3rem"}}></i>
                            </Button>
                        ))}
                        
                    </Card.Body>    
                </Card.Root>
            )}
        </> 
    )
}