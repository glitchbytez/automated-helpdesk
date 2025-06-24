"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function HomePage() {
    const router = useRouter()

    useEffect(() => {
        // In a real app, you would check if the user is authenticated
        // For demo purposes, we'll just redirect to the login page
        router.push("/login")
        // Keep this as is, we want to redirect to login first
    }, [router])

    return (
        <div className="flex h-screen items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
    )
}

