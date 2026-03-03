import { SimpleGrid, Grid } from "@chakra-ui/react";
import IngredientCard from "./IngredientCard"
import AddIngredientModal from "./AddIngredientModal"
import { useIngredInputContext } from "../context/IngredientInputContext";
import { useState, useEffect } from "react";

export default function IngredientInputList() {
    const apiUrl = import.meta.env.VITE_BASE_API_URL
    const {ingredList} = useIngredInputContext();

    const [staticIngredList, setStaticIngredList] = useState(() => {
        const data = localStorage.getItem("ingred-list")
        return data ? JSON.parse(data) : []
    })
    
      useEffect(() => {
        if (staticIngredList.length == 0) {
          console.log("Fetching")
          fetch(`${apiUrl}ingredients/search`)
          .then((response) => {
            if (response.status == 200) {
              return response.json()
            }
    
            return Promise.reject(response)
          }).then((data) => {
            localStorage.setItem("ingred-list", JSON.stringify(data))
            setStaticIngredList(data)
          }).catch((response) => {
            console.log(response)
          })
        }
      }, [staticIngredList])

    return (
        <SimpleGrid 
            columns={{base: "3", md: "5", lg: "10"}}
            gap="0.8rem" 
            marginTop="0.9rem"
            gridAutoRows="1fr">
            {ingredList.map((ingred) => (
                <IngredientCard ingred={ingred} />
            ))}
            <AddIngredientModal staticIngredList={staticIngredList}/>
        </SimpleGrid>
    )
}