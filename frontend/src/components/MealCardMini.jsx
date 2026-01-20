import { 
    // wrapping components: 
    Card, 
    // typography components: 
    Text
    // functional components: 
    
} from "@chakra-ui/react"
import { useNavigate } from "react-router"

export default function MealCardMini() {
    const navigate = useNavigate(); 

    return (
        <Card.Root width="8rem" background="white"  
            overflow="hidden" 
            borderRadius="md" variant="elevated" boxShadow="lg"
            cursor="pointer" onClick={() => navigate('/app/meal-card')}
            >

            <Card.Body pt={5} px={4} pb={6}>
                <Card.Title
                    fontSize="lg" lineHeight="1.2"  fontWeight="medium"
                >Lunch / Bữa Trưa 
                </Card.Title>
            </Card.Body>      

            <Card.Footer bg="black" p={3}>
                <Text color="white" fontSize="sm" fontWeight="medium" >3 dishes</Text>
            </Card.Footer>   
        </Card.Root>
    )
}
