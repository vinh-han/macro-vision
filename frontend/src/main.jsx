import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

import {
  createBrowserRouter,
  createRoutesFromElements,
  Navigate,
  Route,
  RouterProvider
} from 'react-router';

//import layout
import RootLayout from './layout/RootLayout';

//import pages
import Guide from './pages/Guide';
import Login from './pages/Login';
import Signup from './pages/Signup';
import HomePage from './pages/root/Homepage';
import SearchPage from './pages/root/SearchPage';
import IngredientInputPage from './pages/root/IngredientInput';
import AddToMealPlanPage from './pages/root/AddToMealPlanPage';
import RecipeInfoPage from './pages/root/RecipeInfoPage';
import MealPlannerPage from './pages/root/MealPlannerPage';
import MealCardPage from './pages/root/MealCardPage';
import ProfilePage from './pages/root/ProfilePage';

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/">
      <Route index element={<Navigate to={"./guide"} />} />
      <Route path="guide" element={<Guide />} />
      <Route path="login" element={<Login />} />
      <Route path="signup" element={<Signup />} />
      <Route path="app" element={<RootLayout />}>
        <Route index element={<HomePage />} />
        <Route path="search" element={<SearchPage />} />
        <Route path="ingredient-input" element={<IngredientInputPage />} />
        <Route path="add-to-meal-plan" element={<AddToMealPlanPage />} />
        <Route path="recipe" element={<RecipeInfoPage />} />
        <Route path="meal-planner" element={<MealPlannerPage/>} />
        <Route path="meal-card" element={<MealCardPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>
    </Route>
  )
)


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
