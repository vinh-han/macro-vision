import { Outlet } from "react-router";
import NavBar from "../components/NavBar"

export default function AppLayout() {
    return (
        <>
            <main>
                <Outlet />
            </main>
            <NavBar/>
        </>
    )
}