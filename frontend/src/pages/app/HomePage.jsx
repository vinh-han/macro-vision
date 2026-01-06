import { Button, HStack, Heading, Box, Image, Container   } from "@chakra-ui/react"
import Logo from "../../assets/images/LogoHorizontal.svg"
export default function HomePage() {
    return (
        <Container centerContent>
            {/* Logo */}
            <Box >
                <Image src={Logo}  height="3rem" m="30px" ></Image>
            </Box>

            {/* Today meal cards area */}


            {/* Popular dishes area  */}
        </Container>
    )
}