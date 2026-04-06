import { Dialog, Portal } from "@chakra-ui/react"
import { sessionCleanup } from "./Methods"
import { useNavigate } from "react-router"
import { useSessionExpireContext } from "../context/SessionExpireContext";


export default function SessionExpireMsg() {
    const navigate = useNavigate();
    const {isExpired, setIsExpired} = useSessionExpireContext();
    
    return (
        <Dialog.Root 
            open={isExpired} 
            onOpenChange={(e) => {
                if (!e.open) {
                    setIsExpired(false)
                    sessionCleanup()
                    navigate("/")   
                }
            }} 
            size={{ mdDown: "xs", md: "xl" }}
            placement="center">
            <Portal>
                <Dialog.Backdrop />
                <Dialog.Positioner>
                <Dialog.Content>
                    <Dialog.Header>
                    <Dialog.Title>Session Expired</Dialog.Title>
                    </Dialog.Header>
                    <Dialog.Body>
                    <p>
                        Please log in again!
                    </p>
                    </Dialog.Body>
                    <Dialog.Footer>
                    </Dialog.Footer>
                </Dialog.Content>
                </Dialog.Positioner>
            </Portal>
        </Dialog.Root>
    )
}