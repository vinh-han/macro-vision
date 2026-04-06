import { createContext, useContext, useReducer } from "react";
import { getCookie } from "../components/Methods";

const SessionExpireContext = createContext(null);

export function useSessionExpireContext() {
    const sessionExpCtx = useContext(SessionExpireContext);

    if (sessionExpCtx === null) {
        throw new Error('sessionExpCtx is null')
    }

    return sessionExpCtx
}

function sessionExpireReducer(state, action) {
    if (action.type === 'SET_EXPIRE') {
        return action.payload
    }
}

export default function SessionExpireContextProvider({children}) {
    const token = getCookie("token")
    const isExpired = token.length == 0
    const [sessionExpState, dispatch] = useReducer(sessionExpireReducer, isExpired)
    const ctx = {
        isExpired: sessionExpState,
        setIsExpired(data) {
            dispatch({
                type: 'SET_EXPIRE',
                payload: data
            })
        }
    }

    return (
        <SessionExpireContext.Provider value={ctx}>
            {children}
        </SessionExpireContext.Provider>
    )
}