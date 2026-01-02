import {Route, createBrowserRouter, createRoutesFromElements} from 'react-router';

//import layouts
import PublicLayout from './layouts/PublicLayout'; 
import AppLayout from './layouts/AppLayout'; 

//import public pages 
import Guide from './pages/guide/Guide';
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';   

// import app pages 
import HomePage from './pages/app/Homepage';
import SearchPage from './pages/app/SearchPage';
import IngredientInputPage from './pages/app/IngredientInput';
import AddToMealPlanPage from './pages/app/AddToMealPlanPage';
import RecipeInfoPage from './pages/app/RecipeInfoPage';
import MealPlannerPage from './pages/app/MealPlannerPage';
import MealCardPage from './pages/app/MealCardPage';
import ProfilePage from './pages/app/ProfilePage';

export const router = createBrowserRouter( 
    createRoutesFromElements (
        <Route path="/">

            {/* Public routes (no navbar) */}
            <Route element={<PublicLayout />}>
                <Route index element={<Guide/>} />
                <Route path="login" element={<Login />} />
                <Route path="signup" element={<Signup />} />
            </Route>

            {/* Authenticated routes (with navbar) */}
            <Route path="app" element={<AppLayout />}>  {/* wrap with ProtectedRoute later  */}
                <Route index element={<HomePage />} />
                <Route path="search" element={<SearchPage />} />
                <Route path="ingredient-input" element={<IngredientInputPage />} />
                <Route path="add-to-meal-plan" element={<AddToMealPlanPage />} />
                <Route path="recipe" element={<RecipeInfoPage />} />
                <Route path="meal-planner" element={<MealPlannerPage/>} />
                <Route path="meal-card" element={<MealCardPage />} />
                <Route path="profile" element={<ProfilePage />} />
            </Route>

            {/* Fallback route */}
            {/* <Route path="*" element={<Navigate to="/guide" replace />} /> */}
        </Route>
    )
);

export default router;