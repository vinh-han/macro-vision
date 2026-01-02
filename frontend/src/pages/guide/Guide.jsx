import { Box, Image, SimpleGrid, Text, Center, Button } from "@chakra-ui/react"
import Logo from "../../assets/images/LogoVertical_bareWhite.png"
import { useState, useEffect } from "react"
import { useNavigate } from "react-router";
import { keyframes } from "@emotion/react";

export default function Guide() {
    const [atTop, setMoveTop] = useState(false);
    let navigate = useNavigate();

    var fadeIn = keyframes`
        from { opacity: 0; }
        to { opacity: 1; }
    `;

    useEffect(() => {
        const timer = setTimeout(() => setMoveTop(true), 1500)
        return () => clearTimeout(timer);
    })

    return (
        <Box background="crimsonred.500" width="100%" height="100vh" color="white">
            <Center
                paddingY="50px"
                position="relative"
                transform="auto"
                transition="all 0.7s ease"
                translateY={atTop ? "0%" : "-50%"}
                top={atTop ? "0%" : "50%"}>
                <Image 
                    src={Logo}
                    width="250px" />
            </Center>
            {atTop && (
                <Box
                    animation="fade-in 1600ms ease-out">
                    <SimpleGrid minChildWidth="200px" marginTop={{lg: "100px"}} paddingX={{ base: "100px", lg: "200px"}} gapY="20px" gapX="40px">
                        <Box border="1px solid" display="flex" flexDirection="column" alignItems="center" padding="15px 10px" boxSizing="border-box" borderRadius="15px"> 
                            <i className="ri-camera-ai-2-fill" style={{fontSize: "50px", lineHeight: "1"}}></i>
                            <Text fontWeight="semibold" fontSize="17px" marginTop="5px">Ingredient Detection</Text>
                            <Text textAlign="center" fontSize="15px">Snap a photo and our AI identifies your ingredients instantly</Text>
                        </Box>
                        <Box border="1px solid" display="flex" flexDirection="column" alignItems="center" padding="15px 10px" boxSizing="border-box" borderRadius="15px">
                            <i className="ri-fridge-line" style={{fontSize: "50px", lineHeight: "1"}}></i>
                            <Text fontWeight="semibold" fontSize="17px" marginTop="5px">Recipe Discovery</Text>
                            <Text textAlign="center" fontSize="15px">Get authentic Vietnamese recipes based on what’s in your kitchen</Text>
                        </Box>
                        <Box border="1px solid" display="flex" flexDirection="column" alignItems="center" padding="15px 10px" boxSizing="border-box" borderRadius="15px">
                            <i className="ri-calendar-2-fill" style={{fontSize: "50px", lineHeight: "1"}}></i>
                            <Text fontWeight="semibold" fontSize="17px" marginTop="5px">Smart Meal Planner</Text>
                            <Text textAlign="center" fontSize="15px">Plan your meals daily or monthly with meal cards and a built-in calendar</Text>
                        </Box>
                    </SimpleGrid>
                    <Button 
                        position="relative" 
                        marginTop={["50px", undefined, undefined, "100px"]} 
                        left="50%" 
                        transform="auto" 
                        translateX="-50%" 
                        rounded="10px"
                        fontWeight="bold"
                        fontSize="16px"
                        cursor="pointer"
                        onClick={() => navigate("/login")}>
                        Discover your next Vietnamese meal
                    </Button>
                </Box>
                
            )}
        </Box>
    )
}