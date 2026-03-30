import { 
    // frame : 
     Card, 
    // typography: 
    Text,  
    // functional: 
    Image, Tag
} from "@chakra-ui/react"

import { useNavigate } from "react-router"
import { assetNameProcess } from "./Methods";
const NO_IMAGE_PLACEHOLDER_URL = "../../public/assets/images/No-Image-Placeholder.jpg";
// Can specify default value by using: dishImage = default_image.png | dishDescription = ""
// In react, functional component only accept a single prop such as DishCard(prop)
// You need to destructure them by using curly braceket DishCard({propertie1, properties2})

export default function DishCard({dishImage = NO_IMAGE_PLACEHOLDER_URL, dishName, dishDescription, dishCourse}) {
    const navigate = useNavigate(); 

    return (
        <Card.Root 
            w="sm" rounded="2xl" 
            boxShadow="4px 4px 12px rgba(0, 0, 0, 0.2)"

            // cursor="pointer" onClick={() => navigate('/app/dish/dish_name')}
        >
            <Image 
                src = {`/assets/images/dishes/${assetNameProcess(dishName)}.webp`}
                alt="A bowl of bun cha Hanoi"
                borderRadius="md"
            />
            <Card.Body>
                <Card.Title>
                    {dishName}
                </Card.Title>

                <Card.Description>
                    {dishDescription}
                </Card.Description>
            </Card.Body>
            <Card.Footer>
                <Tag.Root>
                    <Tag.Label>
                        {dishCourse}
                    </Tag.Label>
                </Tag.Root>
            </Card.Footer>
        </Card.Root>
    )
}