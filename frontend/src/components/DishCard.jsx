import { 
    // frame : 
     Card, Box,
    // typography: 
    Text,  
    // functional: 
    Image, Tag, Button
} from "@chakra-ui/react"
import { useLocation, useNavigate } from "react-router"
import { assetNameProcess } from "./Methods";
const NO_IMAGE_PLACEHOLDER_URL = "../../public/assets/images/No-Image-Placeholder.jpg";


export default function DishCard({dishName, dishDescription, dishCourse, dishID, onRemove, onAdd}) {
    const navigate = useNavigate(); 
    const location = useLocation();

    return (
        <Box position="relative" display="inline-block">
            {/* ✕ button - only shows when onRemove is passed */}
            {onRemove && (
                <Box
                    position="absolute"
                    top="-10px"
                    right="-10px"
                    zIndex={1}
                    bg="red.600"
                    color="white"
                    borderRadius="full"
                    w="28px"
                    h="28px"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    cursor="pointer"
                    onClick={(e) => {
                        e.stopPropagation(); // prevent navigating to dish page
                        onRemove();
                    }}
                >
                    <i className="ri-close-line"></i>
                </Box>
            )}

            <Card.Root 
                maxW="sm" overflow="hidden"
                rounded="2xl" 
                boxShadow="4px 4px 12px rgba(0, 0, 0, 0.2)"
                display="flex"
                h="420px"
                cursor={onAdd ? "default" : "pointer"}
                onClick={() => {
                    if (onAdd) return; 
                    navigate(`/app/dish/${dishID}`, { state: { from: location.pathname } });
                }}
            >
                <Image 
                    src = {`/assets/images/dishes/${assetNameProcess(dishName)}.webp`}
                    alt= {dishName}
                    h="200px"  
                    w="100%"
                    objectFit="cover"
                    onError={(e) => {
                    if (e.currentTarget.src !== dishImage) {
                        e.currentTarget.src = dishImage;
                    }
                    }}
                />
                <Card.Body pb={1}>
                    <Card.Title lineClamp={1} > 
                        {dishName}
                    </Card.Title>

                    <Card.Description
                        lineClamp={4} mt={2}
                    >
                        {dishDescription}
                    </Card.Description>
                </Card.Body>
                <Card.Footer  mt="auto">
                    <Tag.Root size="lg">
                        <Tag.Label >{dishCourse} </Tag.Label>
                    </Tag.Root>
                
                {/* Add button - only shows in search dialog */}
                {onAdd && (
                    <Button
                        size="sm"
                        bg="red.700"
                        color="white"
                        borderRadius="lg"
                        onClick={(e) => {
                            e.stopPropagation();
                            onAdd();
                        }}
                    >
                        + Add
                    </Button>
                )}
                </Card.Footer>
            </Card.Root>
        </Box>
    )
}