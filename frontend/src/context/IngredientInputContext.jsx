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
            return [
                ...state,
                action.payload
            ]
        }

        return [...state]
    }
}

export default function IngredInputContextProvider({children}) {
    const [ingredInputState, dispatch] = useReducer(ingredInputReducer, []);
    const ctx = {
        ingredList: ingredInputState,
        addIngred(ingredInputData) {
            dispatch({
                type: 'ADD_INGRED',
                payload: ingredInputData
            })
        }
    }

    return (
        <IngredInputContext.Provider value={ctx}>
            {children}
        </IngredInputContext.Provider>
    )
}


