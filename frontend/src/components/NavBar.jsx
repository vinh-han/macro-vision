import { HStack, Box } from "@chakra-ui/react"
import NavButton from "./NavButton"

const NavItems = [
    { IconName: "ri-home-2-fill", PathName: "Home", Path: "/app" },
    { IconName: "ri-sparkling-fill", PathName: "Ingredients AI", Path: "/app/ingredient-input" },
    { IconName: "ri-search-line", PathName: "Search", Path: "/app/search" },
    { IconName: "ri-calendar-view", PathName: "Calendar", Path: "/app/meal-planner" },
    { IconName: "ri-account-circle-line", PathName: "Profile", Path: "/app/profile" }
];

export default function NavBar() {
    return (
        <Box>
            <HStack gap={{base: "3.5em", md:"5.5em", lg: "7.5em"}} >
                {NavItems.map((item) => (
                    <NavButton 
                        key={item.PathName}
                        IconName = {item.IconName}
                        PathName = {item.PathName}
                        Path = {item.Path}
                        h= "0.5em"
                    />
                ))}
            </HStack>
        </Box>
    )
}