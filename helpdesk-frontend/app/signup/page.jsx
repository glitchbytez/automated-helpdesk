"use client"

import { useState } from "react"
import {AccountManagement} from '@/components/account-management'

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("")
    const [isSubmitted, setIsSubmitted] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setIsLoading(true)

        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000))

        setIsSubmitted(true)
        setIsLoading(false)
    }

    return (
       <AccountManagement
           email={email}
           isSubmitted={isSubmitted}
           handleSubmit={handleSubmit}
           setEmail={setEmail}
           setIsLoading={setIsLoading}
           isLoading={isLoading}
           cardTitle={'Request for an account'}
           buttonTitle={'Send request'}
           successMessage={'Once your application has been successfully reviewed, ' +
               'you\'ll receive an email containing the first time login details.'}
       />
    )
}

