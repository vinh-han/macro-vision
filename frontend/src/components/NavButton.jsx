import { Text, Icon, VStack } from "@chakra-ui/react";
import { NavLink } from "react-router";


export default function NavButton({IconName, PathName, Path}) {

    return (
        <NavLink to={Path} end>
        {({ isActive }) => (
            <VStack >
                <Icon   
                    color={isActive ? "#AB3841" : "gray.600"}
                    fontSize="xl"
                > 
                    <i className={IconName}></i>
                </Icon>

                <Text 
                    display={{base: "none", md: "block"}}
                    color={isActive ? "#AB3841" : "gray.600"} 
                    fontWeight={isActive ? "bold" : "normal"}
                >
                    {PathName}
                </Text>
            </VStack>
        )}
        </NavLink>
    );
}

