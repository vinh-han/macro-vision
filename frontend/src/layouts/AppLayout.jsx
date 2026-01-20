import { Outlet } from "react-router";
import NavBar from "../components/NavBar"
import { Box, Container } from "@chakra-ui/react";

export default function AppLayout() {
    return (
        <Box h = "100dvh" display="flex" flexDirection="column">

            {/* Main content area */}
            <Box as="main" overflowY="auto" flex="1" pb="1rem">
                <Outlet></Outlet>
            </Box>

            {/* Bottom nav bar area */}
            <Box
                as = "nav"
                zIndex={1}
                p="1em" 
                minH="10vh"
                borderTopWidth="1px"
                borderTopColor="gray.200"
                bg="white">
                <Container centerContent="true">
                    <NavBar/>
                </Container>
            </Box>
        </Box>
    )
}