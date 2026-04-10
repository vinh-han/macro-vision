import { FileUpload, Button, Text, useFileUpload } from "@chakra-ui/react";
import { useIngredInputContext } from "../context/IngredientInputContext";
import { getCookie } from "./Methods";
import { useRef } from "react";


export default function IngredientDetectButton({isEdit, setIsLoading}) {
    const baseUrl = import.meta.env.VITE_BASE_API_URL
    const {addIngred} = useIngredInputContext();
    const clearRef = useRef();

    function handleDetection(e) {
        const file = e.files[0]

        if (!file) {
            return
        }

        setIsLoading(true)

        const data = new FormData();
        data.append('img-file', file)

        fetch(`${baseUrl}ingredients/detect`, {
            method: 'POST',
            body: data,
            headers: {
                'Authorization': `Bearer ${getCookie("token")}`
            }
        }).then((response) => {
            if (response.ok) {
                return response.json()
            }
            
            return Promise.reject(response)
        }).then((data) => {
            addIngred(data.ingredients)
        }).catch((response) => {
            if (response.status == 401) {
                setIsExpired(true)
            } else {
                response.json().then(data => console.log(data))
            }
        }).finally(() => {
            setIsLoading(false)
            clearRef.current?.click()
        })

    }

    return (
        <FileUpload.Root onFileAccept={handleDetection} accept="image/*">
            <FileUpload.HiddenInput name="img-file" />
            <FileUpload.Trigger asChild>
                <Button
                width="100%"
                height="fit-content"
                padding="0.5rem"
                background="crimsonred.500"
                rounded="12px"
                gap="0.8rem"
                disabled={isEdit}>
                <i className="ri-camera-4-line" style={{fontSize: "2.1rem", lineHeight: 1}}></i>
                <Text
                    justifyContent="stretch"
                    fontSize="1.4rem"
                    fontWeight="semibold">Ingredients from Image</Text>
                </Button>
            </FileUpload.Trigger>
            <FileUpload.ClearTrigger ref={clearRef} hidden={true}/>
        </FileUpload.Root>
    )
}