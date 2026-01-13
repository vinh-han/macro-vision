import { Box, Text, Field, Input, Button, HStack } from '@chakra-ui/react'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { BASE_API_URL } from '../../constant';

export default function Signup() {
    let navigate = useNavigate();

    const [errorMsg, setErrorMsg] = useState("")
    
    function onSubmit(e) {
        e.preventDefault(e);

        const formData = new FormData(e.currentTarget);
        const data = Object.fromEntries(formData.entries());

        if (data.password !== data.conf_password) {
            setErrorMsg("Password Mismatch!")
            return
        }

        const signUpInfo = {
            username: data.username,
            display_name: data.display_name,
            email: data.email,
            password: data.password
        }

        fetch(`${BASE_API_URL}auth/signup`, {
            method: "POST",
            body: JSON.stringify(signUpInfo),
            headers: {
                'Content-Type': 'application/json'
            }
        }).then((response) => {
            if (response.status === 201) {
                return response.json()
            }

            return Promise.reject()
        }).then((data) => {
            console.log(data)
        }).catch((response) => {
            console.log(response)
        })

        setErrorMsg("")
    }

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
                <form onSubmit={(e) => onSubmit(e)}>
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
                                    name="username"
                                    placeholder="bunappetit123" 
                                    marginTop="0.1rem" 
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
                                    name="display_name" 
                                    placeholder="Bun Appetit"
                                    marginTop="0.1rem"  
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
                                    name="email"
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
                                    name="password"
                                    type="password" 
                                    marginTop="0.1rem" 
                                    placeholder="password123" 
                                    variant="subtle" 
                                    rounded="0.5rem" 
                                    fontSize="1em" 
                                    color="black"/>
                            </Field.Root>
                            <Field.Root required marginTop="1.2rem">
                                <Field.Label fontSize="1.15em" fontWeight="semibold">
                                    Confirm Password <Field.RequiredIndicator />
                                </Field.Label>
                                <Input
                                    name="conf_password" 
                                    type="password"
                                    marginTop="0.1rem" 
                                    placeholder="password123" 
                                    variant="subtle" 
                                    rounded="0.5rem" 
                                    fontSize="1em" 
                                    color="black"/>
                            </Field.Root>
                            {errorMsg && (
                                <HStack justifyContent="center" fontSize="1.2em" marginTop="1.4rem">
                                    <i className="ri-error-warning-fill" style={{lineHeight: 1}}></i>
                                    <Text 
                                        textAlign="center"
                                        fontWeight="bold">
                                        {errorMsg}
                                    </Text>
                                </HStack>
                                
                            )}
                        </Box>
                        <Button 
                            type="submit"
                            width="100%" 
                            rounded="0.8rem" 
                            fontSize="1.2rem"
                            fontWeight="semibold">Sign Up
                        </Button>
                    </Box>
                </form>
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