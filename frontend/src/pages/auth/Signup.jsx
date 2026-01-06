import { Box, Text, Field, Input, Button } from '@chakra-ui/react'
import { useNavigate } from 'react-router'

export default function Signup() {
    
    let navigate = useNavigate();
    return (
        <Box
            width="inherit"
            paddingY="2rem"
            minHeight="inherit"
            display="flex"
            flexDirection="column"
            justifyContent="center"
            gap="5rem"
            background="crimsonred.500"
            color="white">
            <Box
                paddingX={{base: "3rem", lg: "10rem"}}
                display="flex"
                flexDirection="column"
                gap="1rem"> 
                <Text 
                    textAlign="center" 
                    fontWeight="semibold" 
                    fontSize="2.1rem">Create Your Account</Text>
                <Box
                    padding="1.3rem"
                    display="flex"
                    flexDirection="column"
                    gap="5rem"
                    bgColor="crimsonred.600"  
                    rounded="0.8rem"
                    boxSizing="border-box"
                    fontSize="1rem">
                    <Box>
                        <Field.Root required>
                            <Field.Label fontSize="1.15em" fontWeight="semibold">
                                Username <Field.RequiredIndicator />
                            </Field.Label>
                            <Input 
                                marginTop="0.1rem" 
                                placeholder="bunappetit123" 
                                variant="subtle" 
                                rounded="0.5rem" 
                                fontSize="1em" 
                                color="black" />
                        </Field.Root>
                        <Field.Root required marginTop="1.2rem">
                            <Field.Label fontSize="1.15em" fontWeight="semibold">
                                Full Name <Field.RequiredIndicator />
                            </Field.Label>
                            <Input 
                                marginTop="0.1rem" 
                                placeholder="Bun Appetit" 
                                variant="subtle" 
                                rounded="0.5rem" 
                                fontSize="1em" 
                                color="black" />
                        </Field.Root>
                        <Field.Root required marginTop="1.2rem">
                            <Field.Label fontSize="1.15em" fontWeight="semibold">
                                Email <Field.RequiredIndicator />
                            </Field.Label>
                            <Input
                                type="email" 
                                marginTop="0.1rem" 
                                placeholder="bunappetit123@" 
                                variant="subtle" 
                                rounded="0.5rem" 
                                fontSize="1em" 
                                color="black" />
                        </Field.Root>
                        <Field.Root required marginTop="1.2rem">
                            <Field.Label fontSize="1.15em" fontWeight="semibold">
                                Password <Field.RequiredIndicator />
                            </Field.Label>
                            <Input 
                                type="password" 
                                marginTop="0.1rem" 
                                placeholder="password123" 
                                variant="subtle" 
                                rounded="0.5rem" 
                                fontSize="1em" 
                                color="black"/>
                        </Field.Root>
                    </Box>
                    <Button 
                        type="submit"
                        width="100%" 
                        rounded="0.8rem" 
                        fontSize="1.2rem"
                        fontWeight="semibold">Sign Up</Button>
                </Box>
            </Box>
            <Text
                textAlign="center" 
                textDecoration="underline" 
                textWrap="nowrap"
                cursor="pointer"
                onClick={() => navigate("/login")}>Already have an account? Log In</Text>
        </Box>
    )
}