import { Box, Text } from "@chakra-ui/react"

export default function Guide() {
    return (
        <Box background="crimsonred.500" width="100%" height="100vh" color="white">
            <Text textStyle={[ "sm", "md", "lg", "xl" ]}>
                Hii~
            </Text>
        </Box>
    )
}