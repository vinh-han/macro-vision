import { Box, Image, SimpleGrid, Text, Center, Button } from "@chakra-ui/react"
import Logo from "../../assets/images/LogoVertical_bareWhite.svg"
import { useState, useEffect } from "react"
import { useNavigate } from "react-router";

export default function Guide() {
    const [atTop, setMoveTop] = useState(false);
    let navigate = useNavigate();

    useEffect(() => {
        const timer = setTimeout(() => setMoveTop(true), 1500)
        return () => clearTimeout(timer);
    })

    return (
        <Box
            width="inherit"
            minHeight="inherit"
            paddingY="3rem"
            display="flex"
            flexDirection="column"
            gap={{base: "3rem", lg: "5rem"}}
            alignItems="center"
            background="crimsonred.500" 
            color="white">
                <Image
                    src={Logo}
                    width="18rem"
                    transform="auto"
                    translateY={atTop ? "0" : "calc(50vh - 100%)"}
                    transition="all 0.7s ease"/>
            {atTop && (
                <Box
                    width="100%"
                    flex="1"
                    animation="fade-in 1600ms ease-out">
                    <SimpleGrid 
                        paddingX="5rem"
                        minChildWidth="10rem" 
                        gap="2rem"
                        textAlign="center">
                        <Box 
                            padding="0.8rem"
                            display="flex"
                            flexDirection="column"
                            alignItems="center"
                            gap="0.6rem"
                            boxSizing="border-box"
                            border="1px solid"
                            borderRadius="1rem">
                            <i className="ri-camera-ai-2-fill" style={{ fontSize: "3.2rem", lineHeight: "1" }}></i>
                            <Box 
                                display="flex"
                                flexDirection="column"
                                alignItems="center"
                                fontSize="1rem">
                                <Text
                                    fontWeight="semibold" 
                                    fontSize="1.2em">
                                    Ingredient Detection
                                </Text>
                                <Text 
                                    textAlign="center" 
                                    fontSize="1em">
                                    Snap a photo and our AI identifies your ingredients instantly
                                </Text>
                            </Box>
                        </Box>
                        <Box 
                            padding="0.8rem"
                            display="flex"
                            flexDirection="column"
                            alignItems="center"
                            gap="0.6rem"
                            boxSizing="border-box"
                            border="1px solid"
                            borderRadius="1rem">
                            <i className="ri-fridge-line" style={{ fontSize: "3.2rem", lineHeight: "1" }}></i>
                            <Box 
                                display="flex"
                                flexDirection="column"
                                alignItems="center"
                                fontSize="1rem">
                                <Text
                                    fontWeight="semibold" 
                                    fontSize="1.2em">
                                    Recipe Discovery
                                </Text>
                                <Text 
                                    textAlign="center" 
                                    fontSize="1em">
                                    Get authentic Vietnamese recipes based on what’s in your kitchen
                                </Text>
                            </Box>
                        </Box>
                        <Box 
                            padding="0.8rem"
                            display="flex"
                            flexDirection="column"
                            alignItems="center"
                            gap="0.6rem"
                            boxSizing="border-box"
                            border="1px solid"
                            borderRadius="1rem">
                            <i className="ri-calendar-2-fill" style={{ fontSize: "3.2rem", lineHeight: "1" }}></i>
                            <Box 
                                display="flex"
                                flexDirection="column"
                                alignItems="center"
                                fontSize="1rem">
                                <Text
                                    fontWeight="semibold" 
                                    fontSize="1.2em">
                                    Smart Meal Planner
                                </Text>
                                <Text 
                                    textAlign="center" 
                                    fontSize="1em">
                                    Plan your meals daily or monthly with meal cards and a built-in calendar
                                </Text>
                            </Box>
                        </Box>
                    </SimpleGrid>
                    <Button
                        position="relative"
                        marginTop={{base: "3rem", lg: "7rem"}}
                        left="50%"
                        transform="auto"
                        translateX="-50%"
                        rounded="0.7rem"
                        fontWeight="semibold"
                        fontSize="1rem"
                        cursor="pointer"
                        onClick={() => navigate("/login")}>
                        Discover your next Vietnamese meal
                    </Button>
                </Box>
            )}
        </Box>
    )
}