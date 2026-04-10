import {Box, Button, Text, SimpleGrid, Center, Input, FileUpload, Dialog} from "@chakra-ui/react"
import { useState } from 'react'
import IngredientInputList from "../../components/IngredientInputList"
import IngredInputContextProvider from "../../context/IngredientInputContext"
import IngredientInputActionBox from "../../components/IngredientInputActionBox"
import SuggestRecipeButton from "../../components/SuggestRecipeButton"
import LoadingModal from "../../components/LoadingModal"
import IngredientDetectButton from "../../components/IngredientDetectButton"

export default function IngredientInputPage() {
    const [isEdit, setIsEdit] = useState(false)
    const [selectedIngred, setSelectedIngred] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    
    return (
        <IngredInputContextProvider>
            <Box
                width="100%"
                padding="1.2rem 1rem 1rem"
                background="black"
                roundedBottom="18px"
                position="sticky"
                top="0"
                zIndex="1">
                <IngredientDetectButton isEdit={isEdit} setIsLoading={setIsLoading} />
            </Box>
            <Box
                width="100%"
                padding="0.8rem 1.1rem 2rem"
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
                                            onClick={() => {
                                                setIsEdit(false)
                                                setSelectedIngred([])
                                            }}>
                                            <Text fontSize="1.2em" fontWeight="semibold">
                                                Done
                                            </Text>
                                            <i className="ri-check-line" style={{fontSize: "1.5em", lineHeight: 1}}></i>
                                        </Button>
                                    </Box>
                                    <IngredientInputActionBox selectedIngred = {selectedIngred} setSelectedIngred={setSelectedIngred} />
                                </Box>
                            )
                        }
                    })()
                }
                <Box
                    minH="30rem">
                    <IngredientInputList selectedIngred={selectedIngred} setSelectedIngred={setSelectedIngred} isEdit={isEdit}/>
                </Box>
                
                {!isEdit && (
                    <SuggestRecipeButton />
                )}

                {isLoading && (
                    <LoadingModal />
                )}
            </Box>
            
        </IngredInputContextProvider>
    )
}