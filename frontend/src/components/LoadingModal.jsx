import { Dialog, HStack, Portal, Spinner, Text } from '@chakra-ui/react'

export default function LoadingModal() {

    return (
        <Dialog.Root 
        placement="center" 
        size={{ mdDown: "xs", md: "xl" }} 
        open="true">
            <Portal>
                <Dialog.Backdrop />
                <Dialog.Positioner>
                <Dialog.Content padding="2rem">
                    <HStack gap="10">
                        <Spinner size="lg" />
                        <Text fontSize="1.3rem">Getting ingredients...</Text>
                    </HStack>
                </Dialog.Content>
                </Dialog.Positioner>
            </Portal>
        </Dialog.Root>
    )
}