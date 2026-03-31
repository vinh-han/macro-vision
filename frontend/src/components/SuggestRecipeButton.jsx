import { Button, CloseButton, Dialog, DialogBackdrop, Portal, useDisclosure, useStepsItemContext } from "@chakra-ui/react"
import { useIngredInputContext } from "../context/IngredientInputContext"
import { getCookie, sessionCleanup } from "./Methods";
import { Link, useNavigate } from "react-router";
import { useEffect, useRef, useState } from "react";
import SessionExpireMsg from "./SessionExpireMsg";

export default function SuggestRecipeButton() {
    const {ingredList} = useIngredInputContext();
    const apiUrl = import.meta.env.VITE_BASE_API_URL
    const navigate = useNavigate();
    const [isExpired, setIsExpired] = useState(false);
    
    function recipeSuggest() {
        const ingredSubmit = ingredList.map((ingred) => (ingred.ingredient_name))

        const data = {
            ingredient_list: ingredSubmit,
            match_tightness: 0,
            page: 0
        }
        
        fetch(`${apiUrl}dishes/suggestion`, {
            method: 'POST',
            body: JSON.stringify(data),
            headers: {
                'Authorization': `Bearer ${getCookie('token')}`,
                'Content-Type': 'application/json',
                
            }
        }).then((response) => {
            if (response.status == 200) {
                return response.json()
            }

            return Promise.reject(response)
        }).then((data) => {
            if (!data) {
                return
            }
            localStorage.setItem("suggested-recipe", JSON.stringify(data))
            navigate('../recipe-suggest')
        }).catch((response) => {
            if (response.status == 500) {
                setIsExpired(true)
            } else {
                console.log(response)
            }
        })
    }

    return (
        <>
            {(ingredList.length > 0) ? (
                <Button
                    width="100%"
                    height="3rem"
                    marginTop="3rem"
                    rounded="10px"
                    fontWeight="bold"
                    fontSize="1.4rem"
                    onClick={recipeSuggest}
                    >
                        Suggest Recipe
                </Button>
            ) : (
                <Button
                    width="100%"
                    height="3rem"
                    marginTop="3rem"
                    rounded="10px"
                    fontWeight="bold"
                    fontSize="1.4rem"
                    onClick={recipeSuggest}
                    disabled
                    >
                        Suggest Recipe
                </Button>  
            )}

            <SessionExpireMsg isExpired={isExpired} setIsExpired={setIsExpired} />
        </>
        
        
    )
}