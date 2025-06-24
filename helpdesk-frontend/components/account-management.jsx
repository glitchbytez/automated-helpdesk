import {Header} from '@/components/header'
import {Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle} from '@/components/ui/card'
import {Label} from '@/components/ui/label'
import {Input} from '@/components/ui/input'
import {Button} from '@/components/ui/button'
import Link from 'next/link'
import {ArrowLeft} from 'lucide-react'

export function AccountManagement ({isSubmitted, isLoading, handleSubmit, setEmail, cardTitle, buttonTitle, successMessage, email}) {

    return (
        <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
            <div className="w-full max-w-md space-y-8">
                <Header/>

                <Card>
                    <CardHeader>
                        <CardTitle>{cardTitle}</CardTitle>
                        <CardDescription>
                            {!isSubmitted
                                ? "Enter your email address and the admin will review your request"
                                : "Check your email for instructions"}
                        </CardDescription>
                    </CardHeader>
                    {!isSubmitted ? (
                        <form onSubmit={handleSubmit}>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="name@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                            </CardContent>
                            <CardFooter className="flex flex-col space-y-2">
                                <Button type="submit" className="w-full" disabled={isLoading}>
                                    {isLoading ? "Sending..." : `${buttonTitle}`}
                                </Button>
                                <Button variant="ghost" size="sm" asChild className="mt-2">
                                    <Link href="/login" className="flex items-center">
                                        <ArrowLeft className="mr-2 h-4 w-4" />
                                        Back to login
                                    </Link>
                                </Button>
                            </CardFooter>
                        </form>
                    ) : (
                        <CardContent className="space-y-4">
                            <div className="rounded-md bg-green-50 p-4 text-sm text-green-800 dark:bg-green-900/30 dark:text-green-200">
                                <p>
                                    {successMessage}
                                </p>
                            </div>
                            <Button variant="outline" asChild className="w-full">
                                <Link href="/login" className="flex items-center justify-center">
                                    <ArrowLeft className="mr-2 h-4 w-4" />
                                    Back to login
                                </Link>
                            </Button>
                        </CardContent>
                    )}
                </Card>
            </div>
        </div>
    )
}