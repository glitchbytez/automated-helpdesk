"use client"

import { createContext, useContext, useEffect, useState } from "react"

const ThemeContext = createContext({
    theme: "light",
    setTheme: () => null,
})

export function ThemeProvider({ children, defaultTheme = "light", storageKey = "theme", ...props }) {
    const [theme, setTheme] = useState(() => {
        if (typeof window === "undefined") return defaultTheme
        return localStorage.getItem(storageKey) || defaultTheme
    })

    useEffect(() => {
        const root = window.document.documentElement

        // Remove old classes
        root.classList.remove("light", "dark")

        // Add new class
        root.classList.add(theme)
    }, [theme])

    const value = {
        theme,
        setTheme: (newTheme) => {
            setTheme(newTheme)
            if (typeof window !== "undefined") {
                localStorage.setItem(storageKey, newTheme)
            }
        },
    }

    return (
        <ThemeContext.Provider {...props} value={value}>
            {children}
        </ThemeContext.Provider>
    )
}

export const useTheme = () => {
    const context = useContext(ThemeContext)
    if (context === undefined) {
        throw new Error("useTheme must be used within a ThemeProvider")
    }
    return context
}

