import { Box, Text, Field, Input, Button } from '@chakra-ui/react'
import { useState, useRef } from 'react'
import { useNavigate } from 'react-router'
import { BASE_API_URL } from '../../constant';

export default function Login() {
    let navigate = useNavigate();
    const [errorMsg, setErrorMsg] = useState("")

    function onSubmit(e) {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const data = Object.fromEntries(formData.entries());

        console.log(data);
    }

    return (
        <Box
            width="inherit"
            paddingY="2rem"
            minHeight="inherit"
            display="flex"
            flexDirection="column"
            justifyContent="center"
            gap="7rem"
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
                    fontSize="2.1rem">Welcome Back!</Text>
                <form onSubmit={(e) => onSubmit(e)}>
                    <Box
                        padding="1.3rem"
                        display="flex"
                        flexDirection="column"
                        gap="3rem"
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
                                    name="username"
                                    placeholder="username123"
                                    marginTop="0.1rem"  
                                    variant="subtle" 
                                    rounded="0.5rem" 
                                    fontSize="1em" 
                                    color="black" />
                                <Field.ErrorText fontWeight="bold" fontSize="1.2rem"></Field.ErrorText>
                            </Field.Root>
                            <Field.Root required marginTop="1.2rem">
                                <Field.Label fontSize="1.15em" fontWeight="semibold">
                                    Password <Field.RequiredIndicator />
                                </Field.Label>
                                <Input 
                                    name="password"
                                    type="password" 
                                    placeholder="password123"
                                    marginTop="0.1rem"  
                                    variant="subtle" 
                                    rounded="0.5rem" 
                                    fontSize="1em" 
                                    color="black"/>
                            </Field.Root>
                            <Text 
                                marginTop="0.8rem" 
                                textAlign="right" 
                                textDecoration="underline">
                                Forgot Password?
                            </Text>
                        </Box>
                        <Button 
                            type="submit"
                            width="100%" 
                            rounded="0.8rem" 
                            fontSize="1.2rem"
                            fontWeight="semibold">
                            Log In
                        </Button>
                    </Box>
                </form>
            </Box>
            <Text
                textAlign="center" 
                textDecoration="underline" 
                textWrap="nowrap"
                cursor="pointer"
                onClick={() => navigate("/signup")}>Don't have an account yet? Sign up</Text>
        </Box>
    )
}