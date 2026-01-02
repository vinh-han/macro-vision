import { Box, Text, Field, Input, Button } from '@chakra-ui/react'
import { useNavigate } from 'react-router'

export default function Signup() {
    let navigate = useNavigate();

    return (
        <Box background="crimsonred.500" width="100%" height="100vh" color="white">
            <Box paddingX="55px" position="relative" top="50%" transform="auto" translateY="-60%">
                <Text textAlign="center" fontWeight="semi" fontSize="30px">Create Your Account</Text>
                <Box 
                    bgColor="crimsonred.600" 
                    marginTop="20px" 
                    paddingX="20px" 
                    paddingY="20px"
                    rounded="10px"
                    boxSizing="border-box">
                    <Field.Root required>
                        <Field.Label fontSize="17px">
                            Username <Field.RequiredIndicator />
                        </Field.Label>
                        <Input marginTop="2px" placeholder="username123" variant="subtle" rounded="8px" fontSize="15px" color="black"/>
                    </Field.Root>
                    <Field.Root required marginTop="20px">
                        <Field.Label fontSize="17px">
                            Display Name <Field.RequiredIndicator />
                        </Field.Label>
                        <Input marginTop="2px" placeholder="An" variant="subtle" rounded="8px" fontSize="15px" color="black"/>
                    </Field.Root>
                    <Field.Root required marginTop="20px">
                        <Field.Label fontSize="17px">
                            Email <Field.RequiredIndicator />
                        </Field.Label>
                        <Input type="email" marginTop="2px" placeholder="username123@gmail.com" variant="subtle" rounded="8px" fontSize="15px" color="black"/>
                    </Field.Root>
                    <Field.Root required marginTop="20px">
                        <Field.Label fontSize="17px">
                            Password <Field.RequiredIndicator />
                        </Field.Label>
                        <Input type="password" marginTop="2px" placeholder="password123" variant="subtle" rounded="8px" fontSize="15px" color="black"/>
                    </Field.Root>
                    <Button type="submit" marginTop="50px" width="100%" rounded="15px" fontSize="18px" >Create Account</Button>
                </Box>
            </Box>
            <Text 
                textAlign="center" 
                textDecoration="underline" 
                position="absolute" 
                left="50%" 
                bottom="15%" 
                transform="auto" 
                translateX="-50%" 
                textWrap="nowrap"
                cursor="pointer"
                onClick={() => navigate("/login")}>Already have an account? Log In</Text>
        </Box>
    )
}