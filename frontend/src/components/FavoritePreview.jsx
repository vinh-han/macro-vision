import { Box, Text, Image } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { useSessionExpireContext } from "../context/SessionExpireContext";
import { assetNameProcess, getCookie } from "./Methods";
import { useNavigate } from "react-router";


export default function FavoritePreview() {
    const baseUrl = import.meta.env.VITE_BASE_API_URL;
    const {setIsExpired} = useSessionExpireContext();
    const navigate = useNavigate();
    const [favoriteList, setFavoriteList] = useState(null);

    useEffect(() => {
        fetch(`${baseUrl}users/favorites`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${getCookie("token")}`,
                'Content-Type': 'application/json'
            }
        }).then((response) => {
            if (response.status == 200) {
                return response.json()
            }

            return Promise.reject(response)
        }).then((data) => {
            setFavoriteList(data)
        }).catch((response) => {
            if (response.status == 401) {
                setIsExpired(true)
            } else {
                response.json().then(data => console.log(data))
            }
        })
    }, [])

    return (
        <Box
        minHeight=""
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
                <Box display="flex" alignItems="center" gap="2">
                    <i className="ri-heart-3-line" style={{fontSize: "1.3rem", lineHeight: 1}}></i>
                    <Text>Favorite</Text>
                </Box>
                <i className="ri-arrow-right-line" style={{fontSize: "1.5rem", lineHeight: 1}} onClick={() => navigate('../favorite')}></i>
            </Box>
            {(favoriteList) && (
                <Box 
                display="flex"
                gap="1.5"
                fontSize="1.1rem"
                height="20rem">
                    <Box 
                    flex="1" 
                    rounded="10px" 
                    overflow="hidden"
                    boxShadow="0rem 0rem 0.3rem #00000076">
                        <Image
                        width="100%"
                        height="100%" 
                        src={`/assets/images/dishes/${assetNameProcess(favoriteList[0].dish_name)}.webp`}
                        objectFit="cover" />
                    </Box>
                    {(favoriteList.length > 1) && (
                        <Box 
                        flex="1" 
                        display="flex" 
                        flexDirection="column" 
                        gap="1.5">
                            <Box 
                            flex="1" 
                            rounded="10px"  
                            overflow="hidden"
                            boxShadow="0rem 0rem 0.3rem #00000076">
                                <Image
                                width="100%"
                                height="100%" 
                                src={`/assets/images/dishes/${assetNameProcess(favoriteList[1].dish_name)}.webp`}
                                objectFit="cover" />
                            </Box>
                            {(favoriteList.length > 2) && (
                                <Box 
                                height="50%"
                                flex="1" 
                                display="flex" 
                                gap="1.5">
                                    <Box 
                                    flex="1"
                                    rounded="10px"
                                    overflow="hidden"
                                    boxShadow="0rem 0rem 0.3rem #00000076">
                                        <Image
                                        width="100%"
                                        height="100%"
                                        src={`/assets/images/dishes/${assetNameProcess(favoriteList[2].dish_name)}.webp`}
                                        objectFit="cover" />
                                    </Box>
                                    {(favoriteList.length > 3) && (
                                        <Box 
                                        flex="1"
                                        display="flex" 
                                        flexDirection="column" 
                                        gap="1.5">
                                            <Box 
                                            flex="1" 
                                            rounded="10px"
                                            overflow="hidden"
                                            boxShadow="0rem 0rem 0.3rem #00000076">
                                                <Image
                                                width="100%"
                                                height="100%" 
                                                src={`/assets/images/dishes/${assetNameProcess(favoriteList[3].dish_name)}.webp`}
                                                objectFit="cover" />
                                            </Box>
                                            {(favoriteList.length > 4) && (
                                                <Box 
                                                flex="1" 
                                                rounded="10px"
                                                overflow="hidden"
                                                boxShadow="0rem 0rem 0.3rem #00000076">
                                                    <Image
                                                    width="100%"
                                                    height="100%" 
                                                    src={`/assets/images/dishes/${assetNameProcess(favoriteList[4].dish_name)}.webp`}
                                                    objectFit="cover" />
                                                </Box>
                                            )}   
                                        </Box>
                                    )}
                                </Box>
                            )}
                        </Box>
                    )}  
                </Box>
            )}
        </Box>
    )
}