import { Box, Card, Image } from "@chakra-ui/react";
import { assetNameProcess } from "./Methods";


export default function RecipeCardSmall({dish}) {


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
                width="40%"
                rounded="12px"
                src={`/assets/images/dishes/${assetNameProcess(dish.dish_name)}.webp`}
                objectFit="cover">
            </Image>
            <Card.Body
                position="absolute"
                left="25%"
                width="75%"
                height="100%"
                roundedRight="12px"
                paddingLeft="18%"
                paddingRight="3%"
                paddingY="0.5rem"
                background="linear-gradient(90deg,rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 1) 20%, rgba(255, 255, 255, 1) 100%)">
                {(dish.dish_name.length > 21) ? (
                    <Card.Title fontSize="1rem">{dish.dish_name.substring(0, 21)}...</Card.Title>
                ) : (
                    <Card.Title fontSize="1rem">{dish.dish_name}</Card.Title>
                )}
                
                {(dish.description.length > 60) ? (
                    <Card.Description fontSize="0.8rem">{dish.description.substring(0, 60)}...</Card.Description>
                ) : (
                    <Card.Description fontSize="0.8rem">{dish.description}</Card.Description>
                )}
            </Card.Body>
        </Card.Root>
    )
}