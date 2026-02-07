import { createContext, useContext, type ReactNode } from 'react'
import { useOnlineStatus } from '../hooks/useUtils'

interface OnlineStatusContextType {
    isOnline: boolean
}

const OnlineStatusContext = createContext<OnlineStatusContextType | undefined>(undefined)

export function OnlineStatusProvider({ children }: { children: ReactNode }) {
    const isOnline = useOnlineStatus()

    return (
        <OnlineStatusContext.Provider value={{ isOnline }}>
            {children}
        </OnlineStatusContext.Provider>
    )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useOnlineStatusContext() {
    const context = useContext(OnlineStatusContext)
    if (context === undefined) {
        throw new Error('useOnlineStatusContext must be used within OnlineStatusProvider')
    }
    return context
}
