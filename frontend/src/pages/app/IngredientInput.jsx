import {Box, Button, Text, SimpleGrid, Center} from "@chakra-ui/react"
import { useState } from 'react'
import IngredientCard from "../../components/IngredientCard"

export default function IngredientInputPage() {
    const [isEdit, setIsEdit] = useState(false)
    
    return (
        <>
            <Box
                width="100%"
                padding="1.2rem 1rem 1rem"
                background="black"
                roundedBottom="18px"
                position="fixed"
                top="0"
                zIndex="1">
                <Button
                    width="100%"
                    height="fit-content"
                    padding="0.5rem"
                    background="crimsonred.500"
                    rounded="12px"
                    gap="0.8rem">
                    <i className="ri-camera-4-line" style={{fontSize: "2.1rem", lineHeight: 1}}></i>
                    <Text
                        justifyContent="stretch"
                        fontSize="1.4rem"
                        fontWeight="semibold">Ingredients from Image</Text>
                </Button>
            </Box>
            <Box
                width="100%"
                padding="0.8rem 1.1rem 8rem"
                position="absolute"
                top="5.5rem"
                fontSize="1rem">
                {
                    (() => {
                        if (!isEdit) {
                            return (
                                <Box
                                    width="100%"
                                    display="flex"
                                    justifyContent="space-between"
                                    alignItems="center">
                                    <Text
                                        fontSize="1.8em"
                                        fontWeight="bold">
                                        Ingredient List
                                    </Text>
                                    <Button
                                        width="fit-content"
                                        height="fit-content"
                                        display="flex"
                                        gap="0.5rem"
                                        padding="0.4rem 0.5rem"
                                        rounded="7px"
                                        fontSize="1rem"
                                        onClick={() => setIsEdit(true)}>
                                        <Text fontSize="1.2em" fontWeight="semibold">
                                            Edit
                                        </Text>
                                        <i className="ri-edit-line" style={{fontSize: "1.5em", lineHeight: 1}}></i>
                                    </Button>
                                </Box>
                            )
                        } else {
                            return (
                                <Box
                                    display="flex"
                                    flexDirection="column"
                                    gap="0.5rem">
                                    <Box
                                        width="100%"
                                        display="flex"
                                        justifyContent="space-between"
                                        alignItems="center">
                                        <Text
                                            fontSize="1.8em"
                                            fontWeight="bold">
                                            Editing...
                                        </Text>
                                        <Button
                                            width="fit-content"
                                            height="fit-content"
                                            display="flex"
                                            gap="0.5rem"
                                            padding="0.4rem 0.5rem"
                                            rounded="7px"
                                            fontSize="1rem"
                                            onClick={() => setIsEdit(false)}>
                                            <Text fontSize="1.2em" fontWeight="semibold">
                                                Done
                                            </Text>
                                            <i className="ri-check-line" style={{fontSize: "1.5em", lineHeight: 1}}></i>
                                        </Button>
                                    </Box>
                                    <Box
                                        width="100%"
                                        display="flex"
                                        justifyContent="space-between"
                                        gap="1rem">
                                        <Button 
                                            flex="1"
                                            background="#4d7eb3"
                                            rounded="7px"
                                            fontSize="1.2em"
                                            fontWeight="semibold">Select All</Button>
                                        <Button 
                                            flex="1"
                                            background="#d62d3a"
                                            rounded="7px"
                                            fontSize="1.2em"
                                            fontWeight="semibold">Delete</Button>
                                    </Box>
                                </Box>
                                
                            )
                        }
                    })()
                }
                
                <SimpleGrid 
                    minChildWidth={{base: "7rem", md: "10rem"}}
                    gap="0.8rem" 
                    marginTop="0.9rem"
                    gridAutoRows="1fr">
                    <IngredientCard />
                    <IngredientCard />
                    <IngredientCard />
                    <IngredientCard />
                    <IngredientCard />
                    <IngredientCard />
                    <IngredientCard />
                    <IngredientCard />
                    <IngredientCard />
                    <IngredientCard />
                    <IngredientCard />
                    <IngredientCard />
                    <IngredientCard />
                    <IngredientCard />
                    <IngredientCard />
                    <Center
                        className="custom-dashed-border">
                            <i className="ri-add-large-line" style={{fontSize: "25px", color: "#B0ABAB"}}></i>
                    </Center>
                </SimpleGrid>
            </Box>
        </>
    )
}