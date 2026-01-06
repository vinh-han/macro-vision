import { Button, HStack, Heading } from "@chakra-ui/react"

export default function HomePage() {
    return (
        <div>
            <Heading as="h1">Home Page</Heading>
            <HStack>
            <Button>Click me</Button>
            <Button>Click me</Button>
            </HStack>
        </div>
    )
}