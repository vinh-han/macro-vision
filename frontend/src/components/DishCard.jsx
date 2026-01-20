import { 
    // wrapping components: 
     Card, 
    // typography components: 
    Text,  
    // functional components: 
    Image 
} from "@chakra-ui/react"

import dish from  "../assets/images/dish/dish_1.jpg"
import { useNavigate } from "react-router"

export default function DishCard() {
    const navigate = useNavigate(); 

    return (
        <Card.Root 
        maxW="sm" borderRadius="md"
        cursor="pointer" onClick={() => navigate('/app/dish')}
        >
            <Image 
                src={dish}
                alt="A bowl of bun cha Hanoi"
                borderRadius="md"
            />
            <Card.Body>
                <Card.Title>Bun Cha Hanoi</Card.Title>
                <Card.Description>
                    A delicious traditional noodle dish from Hanoi.
                </Card.Description>
            </Card.Body>
            <Card.Footer>
                <Text bg="gray.300" p="0.3em" borderRadius="md">
                    soups
                </Text>
            </Card.Footer>
        </Card.Root>
    )
}