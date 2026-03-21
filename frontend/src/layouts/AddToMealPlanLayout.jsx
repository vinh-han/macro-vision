import { Outlet, useLocation } from "react-router";
import { Box, Text, Center } from "@chakra-ui/react";
import { useNavigate } from "react-router";
import { useState } from "react";

export default function AddToMealPlanLayout() {
    const navigate = useNavigate()
    const location = useLocation()
    const [selectedRecipe, setSelectedRecipe] = useState(location.state)
    return (
        <Box
            width="100%"
            bgColor="black"
            display="flex"
            flexDirection="column">
            <Box
                width="100%"
                height="8.5em"
                display="flex"
                flexDirection="column">
                    <Box
                        width="100%"
                        height="5rem"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        position="relative">
                            <i className="ri-arrow-left-long-line" 
                                style={{color: "white", 
                                        fontSize: "2rem",
                                        position: "absolute",
                                        left: 15,
                                    }}
                                onClick={() => {navigate(-1)}}></i>
                        <Text
                            color="white"
                            textAlign="center"
                            fontSize="1.6rem"
                            fontWeight="bold">
                            Add to Meal Plan
                        </Text>
                    </Box>
                    <Box
                        marginTop="-1rem"
                        width="100%"
                        flex="1"
                        display="flex"
                        color="white"
                        fontSize="1.25rem"
                        >
                            <Center flex="1" zIndex="2" onClick={location.pathname != "/app/add-to-meal-plan/new-meal-plan" ? () => {navigate('./new-meal-plan')} : () => {}}>
                                <Text
                                    textDecoration={location.pathname == "/app/add-to-meal-plan/new-meal-plan" ? "white solid underline 2px" : ""}
                                    textUnderlineOffset={location.pathname == "/app/add-to-meal-plan/new-meal-plan" ? "5px" : ""}>
                                    New Meal Plan
                                </Text>
                            </Center>
                            <Center flex="1" zIndex="2" onClick={location.pathname != "/app/add-to-meal-plan/existing-meal-plan" ? () => {navigate('./existing-meal-plan')} : () => {}}>
                                <Text 
                                    textDecoration={location.pathname == "/app/add-to-meal-plan/existing-meal-plan" ? "white solid underline 2px" : ""}
                                    textUnderlineOffset={location.pathname == "/app/add-to-meal-plan/existing-meal-plan" ? "5px" : ""}>
                                    Existing Meal Plan
                                </Text>
                            </Center>
                        
                    </Box>
            </Box>
            <Box
                flex="1"
                bgColor="white"
                roundedTop="25px"
                padding="1.5rem 1.1rem 1.5rem">
                    <Outlet context={selectedRecipe} />
            </Box>
        </Box>
    )
}