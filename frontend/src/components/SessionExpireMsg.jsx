import { Dialog, Portal } from "@chakra-ui/react"
import { getCookie, sessionCleanup } from "./Methods"
import { useNavigate } from "react-router"
import { useSessionExpireContext } from "../context/SessionExpireContext";


export default function SessionExpireMsg() {
    const baseUrl = import.meta.env.VITE_BASE_API_URL
    const navigate = useNavigate();
    const {isExpired, setIsExpired} = useSessionExpireContext();

    function handleLogout() {
        fetch(`${baseUrl}auth/logout`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${getCookie('token')}`,
                'Content-Type': 'application/json'
            }
        }).then((response) => {
            if (!(response.status == 204)) {
                return Promise.reject(response)
            }
        }).catch((response) => {
            response.json().then(data => console.log(data))
        })

        sessionCleanup()
        navigate("/")
    }
    
    return (
        <Dialog.Root 
            open={isExpired} 
            onOpenChange={(e) => {
                if (!e.open) {
                    setIsExpired(false)
                    handleLogout() 
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