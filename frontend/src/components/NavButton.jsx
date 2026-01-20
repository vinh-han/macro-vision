import { Text, Icon, VStack } from "@chakra-ui/react";
import { NavLink } from "react-router";


export default function NavButton({IconName, PathName, Path}) {

    return (
        <NavLink to={Path} end >
        {({ isActive }) => (
            <VStack>
                <Icon   
                    color={isActive ? "crimsonred.500" : "gray.600"}
                    fontSize="3xl"
                > 
                    <i className={IconName}></i>
                </Icon>

                <Text 
                    display={{base: "none", md: "block"}}
                    color={isActive ?  "crimsonred.500" : "gray.600"} 
                    fontWeight={isActive ? "bold" : "normal"}
                    fontSize="sm"
                >
                    {PathName}
                </Text>
            </VStack>
        )}
        </NavLink>
    );
}

