import { 
    // wrapping components: 
    Card, 
    // typography components: 
    Text
    // functional components: 
} from "@chakra-ui/react"
import { useNavigate, useLocation } from "react-router"


export default function MealCardMini({cardId, title, dishes}) {
    const navigate = useNavigate(); 
    const location = useLocation(); 

    return (
        <Card.Root width="8rem" height="8rem" background="white"  
            overflow="hidden" 
            borderRadius="md" variant="elevated" boxShadow="4px 4px 12px rgba(0, 0, 0, 0.2)"
            cursor="pointer" onClick={() => navigate(`/app/meal-card/${cardId}`, {state: {from: location.pathname}})}
            >

            <Card.Body pt={5} px={4} pb={6}>
                <Card.Title
                    fontSize="lg" lineHeight="1.2"  fontWeight="medium"
                >
                {title}
                </Card.Title>
            </Card.Body>      

            <Card.Footer bg="black" p={3}>
                <Text color="white" fontSize="sm" fontWeight="medium" >
                    {dishes.length} dishes
                </Text>
            </Card.Footer>   
        </Card.Root>
    )
}
