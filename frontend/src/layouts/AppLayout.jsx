import { Outlet } from "react-router";
import NavBar from "../components/NavBar"
import { Box, Container } from "@chakra-ui/react";

export default function AppLayout() {
    return (
        <Box>
            {/* Main content area */}
            <Box bg="red.200" as="main" minH="90vh">
                <Container>
                    <Outlet />
                </Container>
            </Box>
            {/* Bottom nav bar area */}
            <Box as="nav" position="fixed" zIndex={1} bottom="0" left="0" right="0"  
                p="1em" 
                h="10vh"
                borderTopWidth="1px"
                borderTopColor="gray.300"
                bg="white">
                <Container h="100%" centerContent="true" justifyContent="center">
                    <NavBar/>
                </Container>
            </Box>
        </Box>
    )
}