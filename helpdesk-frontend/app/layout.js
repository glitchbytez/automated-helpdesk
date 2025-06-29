import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "sonner"
import { AuthProvider } from "@/contexts/auth-context"

// Configure the Inter font with display: 'swap' to avoid FOUT (Flash of Unstyled Text)
const inter = Inter({ 
    subsets: ["latin"],
    display: 'swap',
    variable: '--font-inter',
})

export const viewport = {
    width: 'device-width',
    initialScale: 1,
}

export const metadata = {
    title: "Campus Support - University Helpdesk",
    description: "Efficient ticket management and real-time chat for university support teams",
    icons: {
        icon: [
            { url: '/favicon.svg', type: 'image/svg+xml' },
            { url: '/favicon.ico', sizes: '32x32' }
        ],
        shortcut: '/favicon.ico',
        apple: '/favicon.svg',
    },
}

export default function RootLayout({ children }) {
    return (
        <html lang="en" className={inter.variable}>
        <body className="bg-white text-gray-900">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
            <AuthProvider>
                {children}
            </AuthProvider>
        </ThemeProvider>
        <Toaster position="top-right" richColors />
        </body>
        </html>
    )
}
