import { Button, CloseButton, Dialog, Portal, Center } from "@chakra-ui/react"
import IngredientComboBox from "./IngredientComboBox"
import { useIngredInputContext } from "../context/IngredientInputContext"

export default function AddIngredientModal({staticIngredList}) {
    const {addIngred} = useIngredInputContext();
    
    return (
        <Dialog.Root
            size={{ mdDown: "xs", md: "xl" }}
            placement="center">
            <Dialog.Trigger asChild>
                <Center
                    className="custom-dashed-border"
                    justifySelf="start"
                    width="100%"
                    height="full"
                    minH="9rem">
                        <i className="ri-add-large-line" style={{fontSize: "25px", color: "#B0ABAB"}}></i>
                </Center>
            </Dialog.Trigger>
            <Portal>
                <Dialog.Backdrop />
                <Dialog.Positioner>
                    <Dialog.Content>
                        <Dialog.Header>
                            <Dialog.Title>Select Ingredient</Dialog.Title>
                        </Dialog.Header>
                        <Dialog.Body>
                            <IngredientComboBox staticIngredList={staticIngredList}/>
                        </Dialog.Body>
                        <Dialog.CloseTrigger asChild>
                            <CloseButton size="xl" />
                        </Dialog.CloseTrigger>
                    </Dialog.Content>
                </Dialog.Positioner>
            </Portal>
        </Dialog.Root>
    )
}