import { createContext, useContext, useReducer } from 'react'

const IngredInputContext = createContext(null);

export function useIngredInputContext() {
    const ingredInputCtx = useContext(IngredInputContext);

    if (ingredInputCtx === null)  {
        throw new Error('ingredientInputContext is null')
    }

    return ingredInputCtx;
}

function ingredInputReducer(state, action) {
    if (action.type === 'ADD_INGRED') {
        const existedItem = state.findIndex(item => item.ingredient_id === action.payload.ingredient_id)
        if (existedItem == -1) {
            const newData = [
                ...state,
                action.payload
            ]
            localStorage.setItem("stored-ingred-list", JSON.stringify(newData))

            return newData
        }

        return [...state]
    }

    if (action.type === 'CLEAR_INGRED') {
        localStorage.removeItem("stored-ingred-list")
        return []
    }

    if (action.type === 'REMOVE_INGRED') {
        const newData = state.filter((ingred) => (!action.payload.includes(ingred.ingredient_id)))
        localStorage.setItem("stored-ingred-list", JSON.stringify(newData))
        return newData
    }
}

export default function IngredInputContextProvider({children}) {
    const data = localStorage.getItem("stored-ingred-list")

    let storedIngredList = []
    if (data) {
        storedIngredList = JSON.parse(data)
    }

    const [ingredInputState, dispatch] = useReducer(ingredInputReducer, storedIngredList);
    const ctx = {
        ingredList: ingredInputState,
        addIngred(ingredInputData) {
            dispatch({
                type: 'ADD_INGRED',
                payload: ingredInputData
            })
        },
        clearIngred() {
            dispatch({
                type: 'CLEAR_INGRED'
            })
        },
        removeIngred(ingredList) {
            dispatch({
                type: 'REMOVE_INGRED',
                payload: ingredList
            })
        }
    }

    return (
        <IngredInputContext.Provider value={ctx}>
            {children}
        </IngredInputContext.Provider>
    )
}


