import { Box, Text } from "@chakra-ui/react";
import { useNavigate } from "react-router";
import FavoriteCard from "../../components/FavoriteCard";
import { useSessionExpireContext } from "../../context/SessionExpireContext";
import { useEffect, useState } from "react";
import { getCookie } from "../../components/Methods";


export default function FavoritePage() {
    const navigate = useNavigate();
    const baseUrl = import.meta.env.VITE_BASE_API_URL
    const {setIsExpired} = useSessionExpireContext()
    const [removed, setRemoved] = useState([])
    const [favoriteList, setFavoriteList] = useState([]);
    
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
            width="100%"
            bgColor="black"
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
                        onClick={() => navigate('../profile')}></i>
                    <Text
                        color="white"
                        textAlign="center"
                        fontSize="1.6rem"
                        fontWeight="bold">
                        Favorite
                    </Text>    
            </Box>
            <Box
                flex="1"
                bgColor="white"
                roundedTop="25px"
                padding="1.5rem 1.1rem 1.5rem"
                display="flex"
                flexDirection="column"
                gap="3">
                    {favoriteList?.map((favorite, index) => (
                        <FavoriteCard key={index} favoriteCard={favorite} removed={removed} setRemoved={setRemoved}/>
                    ))}
            </Box>
        </Box>
    )
}