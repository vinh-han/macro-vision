import { Dialog, Portal, Button, CloseButton, Input, Field, useDialog } from "@chakra-ui/react";
import { useEffect, useRef, useState } from "react";
import { getCookie } from "./Methods";
import { useSessionExpireContext } from "../context/SessionExpireContext";


export default function EditProfileModal({currentProfile, setUser}) {
    const baseUrl = import.meta.env.VITE_BASE_API_URL
    const {setIsExpired} = useSessionExpireContext();
    const [newProfile, setNewProfile] = useState(currentProfile)
    const ref = useRef();

    useEffect(() => {
        setNewProfile(currentProfile)
    }, [currentProfile])

    function handleProfileUpdate() {
        if (newProfile.display_name.length == 0 || newProfile.email.length == 0) {
            return
        }

        if (newProfile == currentProfile) {
            ref.current?.click()
        } else {
            fetch(`${baseUrl}users/information`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${getCookie('token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newProfile)
            }).then((response) => {
                if (response.status == 200) {
                    return response.json()
                }

                return Promise.reject(response)
            }).then((data) => {
                if (data) {
                    setUser({...newProfile, display_name: data.display_name, email: data.email})
                } else {
                    setUser(currentProfile)
                }

                ref.current?.click()
            }).catch((response) => {
                if (response.status == 401) {
                    setIsExpired(true)
                } else {
                    response.json().then(data => console.log(data))
                }
            })
        }
    }


    return (
        <Dialog.Root 
        placement="center" 
        size={{ mdDown: "xs", md: "xl" }}
        onOpenChange={(e) => {
            if (!e.open) {
                setNewProfile(currentProfile)
            }
        }}>
            <Dialog.Trigger asChild>
                <i className="ri-edit-line" style={{fontSize: "1.4rem", lineHeight: 1}}></i>
            </Dialog.Trigger>
            <Portal>
                <Dialog.Backdrop />
                <Dialog.Positioner>
                    <Dialog.Content>
                        <Dialog.Header>
                            <Dialog.Title>Edit Profile</Dialog.Title>
                        </Dialog.Header>
                        <Dialog.Body display="flex" flexDirection="column" gap="5">
                            <Field.Root required invalid={newProfile.display_name.length == 0}>
                                <Field.Label>
                                    Display Name
                                </Field.Label>
                                <Input type="text" variant="subtle" value={newProfile.display_name} onChange={(e) => setNewProfile({...newProfile, display_name: e.target.value})}/>
                                <Field.ErrorText>This field is required</Field.ErrorText>
                            </Field.Root>
                            <Field.Root required invalid={newProfile.email.length == 0}>
                                <Field.Label>
                                    Email
                                </Field.Label>
                                <Input type="email" variant="subtle" value={newProfile.email} onChange={(e) => setNewProfile({...newProfile, email: e.target.value})}/>
                                <Field.ErrorText>This field is required</Field.ErrorText>
                            </Field.Root>
                        </Dialog.Body>
                        <Dialog.Footer>
                            <Dialog.ActionTrigger asChild>
                                <Button variant="outline">Cancel</Button>
                            </Dialog.ActionTrigger>
                            <Button
                                onClick={() => handleProfileUpdate()}>
                                    Save
                            </Button>
                        </Dialog.Footer>
                        <Dialog.CloseTrigger asChild ref={ref}>
                            <CloseButton size="sm" />
                        </Dialog.CloseTrigger>
                    </Dialog.Content>
                </Dialog.Positioner>
            </Portal>
        </Dialog.Root>
    )
}