import { Box } from "@chakra-ui/react"
import { Outlet } from "react-router";

export default function PublicLaylout() {
    return (
        <Box 
            width="100%"
            minHeight="100vh">
            <Outlet />
        </Box>
        
    )
}