import {GraduationCap} from 'lucide-react'

export function Header() {
    return (
        <div className="flex flex-col items-center text-center">
            <div className="flex items-center justify-center rounded-full bg-blue-600 p-2">
                <GraduationCap className="h-8 w-8 text-white" />
            </div>
            <h1 className="mt-4 text-3xl font-bold">Campus Support</h1>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                University helpdesk solution for efficient support
            </p>
        </div>
    )
}