import { Box, Card, Image } from "@chakra-ui/react";
import { assetNameProcess, getCookie } from "./Methods";
import { useSessionExpireContext } from "../context/SessionExpireContext";
import { useLocation, useNavigate } from "react-router";


export default function FavoriteCard({favoriteCard, removed, setRemoved}) {
    const baseUrl = import.meta.env.VITE_BASE_API_URL
    const navigate = useNavigate();
    const location = useLocation();
    const {setIsExpired} = useSessionExpireContext();
    
    function editFavorite() {
        if (removed.includes(favoriteCard.dish_id)) {
            console.log("Dish is unfavorite > Changing to favorite")
            fetch(`${baseUrl}users/favorites/${favoriteCard.dish_id}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${getCookie("token")}`,
                    'Content-Type': 'application/json'
                }
            }).then((response) => {
                if (response.status == 201) {
                    return response.json()
                }

                return Promise.reject(response)
            }).then(data => {
                console.log(data)
                const newRemoved = removed.filter((item) => item != favoriteCard.dish_id)
                setRemoved(newRemoved)
            }).catch((response) => {
                if (response.status == 401) {
                    setIsExpired(true)
                } else {
                    response.json().then(data => console.log(data))
                }
            })
            
        } else {
            console.log("Dish is favorite > Changing to unfavorite")
            fetch(`${baseUrl}users/favorites/${favoriteCard.dish_id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${getCookie("token")}`,
                    'Content-Type': 'application/json'
                }
            }).then((response) => {
                if (response.status == 200) {
                    return response.json()
                }

                return Promise.reject(response)
            }).then(data => {
                console.log(data)
                setRemoved([...removed, favoriteCard.dish_id])
            }).catch((response) => {
                if (response.status == 401) {
                    setIsExpired(true)
                } else {
                    response.json().then(data => console.log(data))
                }
            })
            
        }
    }

    return (
        <Card.Root
            width="100%"
            height="7rem"
            rounded="12px"
            border="1.5px solid #d4d4d8"
            boxShadow="0.3rem 0.3rem 0.5rem #0000004d"
            display="flex"
            flexDirection="row"
            position="relative">
            <Image
                width="30%"
                rounded="12px"
                src={`/assets/images/dishes/${assetNameProcess(favoriteCard.dish_name)}.webp`}
                objectFit="cover">
            </Image>
            <Card.Body
                position="absolute"
                left="15%"
                width="85%"
                height="100%"
                roundedRight="12px"
                paddingLeft="15%"
                paddingRight="3%"
                paddingY="0.5rem"
                background="linear-gradient(90deg,rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 1) 15%, rgba(255, 255, 255, 1) 100%)"
                display="flex"
                flexDirection="row"
                justifyContent="space-between"
                gap="5">
                    <Box>
                        {(favoriteCard.dish_name.length > 21) ? (
                            <Card.Title fontSize="1rem">{favoriteCard.dish_name.substring(0, 21)}...</Card.Title>
                        ) : (
                            <Card.Title fontSize="1rem">{favoriteCard.dish_name}</Card.Title>
                        )}
                        
                        {(favoriteCard.description.length > 60) ? (
                            <Card.Description fontSize="0.8rem">{favoriteCard.description.substring(0, 60)}...</Card.Description>
                        ) : (
                            <Card.Description fontSize="0.8rem">{favoriteCard.description}</Card.Description>
                        )}
                    </Box>
                    <Box
                        display="flex"
                        flexDirection="column"
                        justifyContent="space-between">
                        <i 
                        className={!removed.includes(favoriteCard.dish_id) ? "ri-heart-3-fill" : "ri-heart-3-line"} 
                        style={{fontSize: "1.6rem", lineHeight: 1, color: "#AB3841"}}
                        onClick={() => editFavorite()}></i>
                        <i 
                        className="ri-arrow-right-long-line" 
                        style={{fontSize: "1.6rem", lineHeight: 1}}
                        onClick={() => navigate(`/app/dish/${favoriteCard.dish_id}`, {
                            state: {
                                from: location.pathname
                            }
                        })}></i>
                    </Box>
            </Card.Body>
        </Card.Root>
    )
}