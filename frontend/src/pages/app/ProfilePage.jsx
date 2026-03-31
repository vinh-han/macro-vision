import { Box, Center, Text } from "@chakra-ui/react";


export default function ProfilePage() {
    return (
        <Box
            width="100%"
            position="relative">
            <Box
                width="100%"
                height="15rem"
                bg="black"
                color="white"
                position="absolute"
                clipPath="ellipse(70% 80% at 50% 10%)"
                zIndex="-1" />
            <Box width="100%" padding="3rem 1.1rem 1.5rem">
               <Center>
                    <Text fontSize="3.3rem" fontWeight="bold" color="white">Anle</Text>
               </Center>
               <Box width="100%" bg="white" padding="1rem">
                    <Box
                        display="flex"
                        justifyContent="space-between"></Box>
                    <Box></Box>
               </Box>
            </Box>
        </Box>
    )
}