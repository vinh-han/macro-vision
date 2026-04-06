import { useNavigate } from "react-router"


export default function MealCardNewPage() {
    const navigate = useNavigate(); 
    return (
        <div>
            <h1 cursor="pointer" onClick={() => navigate(-1)}> Go back</h1>
            <h1>New Meal Card Page</h1>
        </div>
    )
}