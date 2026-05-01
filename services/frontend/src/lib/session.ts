import { useOutletContext } from "react-router-dom"
import type { User } from "./api"

export type SessionContext = {
    user: User
}

export function useSession() {
    return useOutletContext<SessionContext>()
}
