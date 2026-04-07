import { Box, Center, Text, Image, Button} from "@chakra-ui/react";
import { getCookie, sessionCleanup } from "../../components/Methods";
import { useNavigate } from "react-router";
import { useEffect, useState } from "react";
import EditProfileModal from "../../components/EditProfileModal";
import { useSessionExpireContext } from "../../context/SessionExpireContext";
import FavoritePreview from "../../components/FavoritePreview";


export default function ProfilePage() {
    const baseUrl = import.meta.env.VITE_BASE_API_URL
    const {setIsExpired} = useSessionExpireContext();
    const navigate = useNavigate()
    const [user, setUser] = useState({
        display_name: '000',
        email: '000@gmail.com',
        username: '000'
    });

    useEffect(() => {
        fetch(`${baseUrl}users/information`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${getCookie('token')}`,
                'Content-Type': 'application/json'
            }
        }).then((response) => {
            if (response.status == 200) {
                return response.json()
            }

            return Promise.reject(response)
        }).then((data) => {
            setUser(data)
        }).catch((response) => {
            if (response.status == 401) {
                setIsExpired(true)
            } else {
                response.json().then(data => console.log(data))
            }
        })
    }, [])

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
        <Box
            width="100%"
            position="relative">
            <Box
                width="100%"
                height="18rem"
                bg="black"
                color="white"
                position="absolute"
                clipPath="ellipse(70% 80% at 50% 10%)"
                zIndex="-1" />
            <Box width="100%" padding="2.2rem 1.5rem 1.5rem">
               <Center>
                    <Text fontSize="3.3rem" fontWeight="bold" color="white">{user.display_name}</Text>
               </Center>
               <Box 
                    width="100%"
                    marginTop="1.5rem" 
                    bg="white" 
                    padding="1rem"
                    display="flex"
                    flexDirection="column"
                    gap="3"
                    rounded="12px"
                    border="1.5px solid #d4d4d8"
                    boxShadow="0rem 0rem 0.3rem #0000004d">
                    <Box
                        display="flex"
                        justifyContent="space-between"
                        fontWeight="bold"
                        fontSize="1.2rem"
                        alignItems="center">
                        <Text>Account Information</Text>
                        {/* <i className="ri-edit-line" style={{fontSize: "1.4rem", lineHeight: 1}}></i> */}
                        <EditProfileModal currentProfile={user} setUser={setUser} />
                    </Box>
                    <Box 
                        display="flex"
                        flexDirection="column"
                        gap="3"
                        fontSize="1.1rem">
                        <Box display="flex" gap="5" alignItems="center">
                            <Box 
                                padding="0.3rem"
                                rounded="4px"
                                border="1.5px solid #d4d4d8"
                                boxShadow="0rem 0rem 0.1rem #0000004d"
                                display="flex"
                                alignItems="center">
                                <i className="ri-user-3-line" style={{fontSize: "1.4rem", lineHeight: 1, cursor: "pointer"}}></i>
                            </Box>  
                            <Text>{user.username}</Text>
                        </Box>
                        <Box display="flex" gap="5" alignItems="center">
                            <Box 
                                padding="0.3rem"
                                rounded="4px"
                                border="1.5px solid #d4d4d8"
                                boxShadow="0rem 0rem 0.1rem #0000004d"
                                display="flex"
                                alignItems="center">
                                <i className="ri-mail-line" style={{fontSize: "1.4rem", lineHeight: 1}}></i>
                            </Box>
                            <Text>{user.email}</Text>
                        </Box>
                    </Box>
                </Box>
                <FavoritePreview />
                <Button 
                    width="100%" 
                    paddingY="1.4rem" 
                    marginTop="2.5rem" 
                    fontSize="1.4rem" 
                    fontWeight="bold" 
                    rounded="16px" 
                    bg="crimsonred.500"
                    onClick={() => handleLogout()}>
                        Logout
                </Button>
            </Box>
        </Box>
    )
}