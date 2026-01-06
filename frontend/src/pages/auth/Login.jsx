import { Box, Text, Field, Input, Button } from '@chakra-ui/react'
import { useState, useRef } from 'react'
import { useNavigate } from 'react-router'

export default function Login() {
    let navigate = useNavigate();
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
                        <Field.Root required invalid>
                            <Field.Label fontSize="1.15em" fontWeight="semibold">
                                Username <Field.RequiredIndicator />
                            </Field.Label>
                            <Input 
                                marginTop="0.1rem" 
                                placeholder="username123" 
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
                                type="password" 
                                marginTop="0.1rem" 
                                placeholder="password123" 
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
                        fontWeight="semibold">Log In</Button>
                </Box>
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