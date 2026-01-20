import { 
    // wrapping components: 
    Box, Container, HStack,
    // typography components: 
    Heading, Text,
    // functional components: 
    Image
} from "@chakra-ui/react"
import dish from  "../../assets/images/dish/dish_1.jpg"
import { useNavigate } from "react-router"

export default function DishInfoPage() {
    const navigate = useNavigate();

    return (
        <Box bg="white" minH="100vh">
            
            {/* Top header */}
            <Box bg="black" py={4} px={4}>
                <Box 
                    as="span" 
                    color="white" fontSize="24px" 
                    cursor="pointer" onClick={() => navigate(-1)} // Go back to previous page
                >
                    <i className="ri-arrow-left-line"></i>
                </Box>
            </Box>

            {/* Dish Image */}
            <Image 
                src={dish} alt="A bowl of bun cha Hanoi"
                width="100%" height="250px" 
                objectFit="cover" 
            />

            {/* Content area */}
            <Container mt={6}>
                <Heading size="lg" mb={2}>Bun Cha Hanoi</Heading>
                
                {/* Meta Data (Ingredients count & Time) */}
                <Text color="gray.500" fontSize="lg">
                    16 ingredients
                </Text>
                <Text color="gray.500" fontSize="lg" mb={6}>
                    1 hour
                </Text>

                {/* Buttons */}
                <HStack mb={8} spacing={4}>
                    
                </HStack>

                <hr/>

                {/* Ingredient list */}
                <Heading size="md" mb={4} mt={4}>Ingredients</Heading>
                <Box as="ul" listStyleType="circle" ml={4} mb={4}>

                    <li>700 gr thịt ba chỉ</li>
                    <li>500 gr thịt heo xay nhuyễn</li>
                    
                    <li>1 củ cà rốt</li>
                    <li>1/2 trái đu đủ xanh</li>
                    <li>500 gr rau sống các loại (xà lách, tía tô, húng quế, húng lủi, diếp cá)</li>

                    <li>1 kg bún tươi</li>

                    <li>1 muỗng canh hành tím băm</li>
                    <li>1.5 muỗng canh tỏi băm</li>
                    <li>1 ít ớt băm</li>
                    <li>2 muỗng canh dầu hào</li>
                    <li>2 muỗng canh nước màu</li>
                    <li>1 chén (khoảng 220ml) nước mắm</li>
                    <li>1/2 chén (khoảng 100ml) giấm</li>
                    <li>1 ít dầu ăn</li>
                    <li>1 ít gia vị thông dụng (muối, đường, tiêu xay, hạt nêm, bột ngọt)</li>
                </Box>
                <hr/>

                {/* Cooking steps  */}
                <Heading size="md" mb={4} mt={4}>Steps</Heading>
                <Heading size="sm" mb={4} mt={4}>1.Sơ chế và ướp thịt</Heading>

                <Text>
                    Đối với thịt ba chỉ, để loại sạch bụi bẩn và mùi hôi các bạn mang đi  chà sạch với muối, sau đó rửa lại với nước lạnh và để ráo. Dùng dao cắt  thịt thành các miếng mỏng vừa ăn.
                    <br/> <br/>
                    Ướp thịt với 1/2 muỗng canh hành tím băm, 1/2 muỗng canh tỏi băm, 1/2 muỗng canh hạt nêm, 1/2 muỗng canh bột ngọt, 1/2 muỗng canh tiêu xay, 2 muỗng canh nước mắm, 1 muỗng canh dầu hào, 2 muỗng canh mật ong, 1  muỗng canh nước màu, sau đó trộn đều và để cho thịt thấm gia vị ít nhất  khoảng 30 phút.
                     <br/> <br/>
                    Về phần thịt xay, các bạn cho 1/2 muỗng canh hành tím băm và 1/2  muỗng canh tỏi băm, 1/2 muỗng canh hạt nêm, 1/2 muỗng canh bột ngọt, 1/2 muỗng canh tiêu xay, 1.5 muỗng canh nước mắm, 1 muỗng canh dầu hào, 1  muỗng canh mật ong, 1 muỗng canh nước màu. Dùng tay trộn đều và ướp thịt khoảng 30 phút cho thấm gia vị.
                    Sau khoảng 30 phút, dùng tkay lấy một lượng thịt xay vừa đủ rồi vo viên.
                </Text>

                
            </Container>
        </Box>
    )
}