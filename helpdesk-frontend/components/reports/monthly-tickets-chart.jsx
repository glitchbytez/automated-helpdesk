"use client"

import { useEffect, useState, useRef, forwardRef, useImperativeHandle } from "react"
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { reportService } from "@/lib/services/report-service"
import { toast } from "sonner"

export const MonthlyTicketsChart = forwardRef(({ month, year }, ref) => {
    const [data, setData] = useState([])
    const [isLoading, setIsLoading] = useState(false)
    const chartRef = useRef(null)
    
    // Expose methods to parent component via ref
    useImperativeHandle(ref, () => ({
        // Return the chart data for Excel export
        getChartData: () => data,
        // Return the chart container element for image export
        getChartContainer: () => chartRef.current
    }))

    useEffect(() => {
        const fetchMonthlyTicketData = async () => {
            try {
                setIsLoading(true)
                const response = await reportService.getMonthlyTicketReport(year, month)
                
                if (response.data && response.data.dailyStats) {
                    // Format data for the chart
                    const formattedData = response.data.dailyStats.map(stat => ({
                        day: stat.day,
                        created: stat.created,
                        resolved: stat.resolved,
                        pending: stat.pending
                    }))
                    
                    setData(formattedData)
                }
            } catch (error) {
                console.error("Error fetching monthly ticket data:", error)
                toast.error("Failed to load ticket report data")
                
                // Fallback to generate some data if API fails
                const daysInMonth = new Date(year, month + 1, 0).getDate()
                const fallbackData = []

                for (let i = 1; i <= daysInMonth; i++) {
                    const created = Math.floor(Math.random() * 10) + 1
                    const resolved = Math.floor(Math.random() * created) + (created > 5 ? created - 5 : 0)

                    fallbackData.push({
                        day: i,
                        created,
                        resolved,
                        pending: created - resolved,
                    })
                }
                
                setData(fallbackData)
            } finally {
                setIsLoading(false)
            }
        }
        
        fetchMonthlyTicketData()
    }, [month, year])

    if (isLoading) {
        return (
            <div className="h-full w-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        )
    }

    return (
        <div ref={chartRef} className="w-full h-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart
                    data={data}
                    margin={{
                        top: 20,
                        right: 30,
                        left: 20,
                        bottom: 5,
                    }}
                >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" label={{ value: "Day of Month", position: "insideBottomRight", offset: -10 }} />
                <YAxis label={{ value: "Number of Tickets", angle: -90, position: "insideLeft" }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="created" name="Created" fill="#3b82f6" />
                <Bar dataKey="resolved" name="Resolved" fill="#10b981" />
                <Bar dataKey="pending" name="Pending" fill="#f59e0b" />
                </BarChart>
            </ResponsiveContainer>
        </div>
    )
})
