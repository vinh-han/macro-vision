import { Button, CloseButton, Dialog, Portal, Center } from "@chakra-ui/react"
import IngredientSelect from "./IngredientSelect"

export default function AddIngredientModal() {
    return (
        <Dialog.Root
            size={{ mdDown: "xs", md: "xl" }}
            placement="center">
            <Dialog.Trigger asChild>
                <Center
                    className="custom-dashed-border">
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
                            <IngredientSelect />
                        </Dialog.Body>
                        <Dialog.Footer>
                            <Dialog.ActionTrigger asChild>
                                <Button width="100%">Select</Button>
                            </Dialog.ActionTrigger>
                        </Dialog.Footer>
                        <Dialog.CloseTrigger asChild>
                            <CloseButton size="xl" />
                        </Dialog.CloseTrigger>
                    </Dialog.Content>
                </Dialog.Positioner>
            </Portal>
        </Dialog.Root>
    )
}