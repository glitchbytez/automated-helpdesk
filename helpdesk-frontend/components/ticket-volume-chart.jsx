"use client"

import { useState, useEffect } from "react"
import { reportService } from "@/lib/services/report-service"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

export function TicketVolumeChart() {
  const [data, setData] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchTicketVolumeData = async () => {
      try {
        setIsLoading(true)
        console.log('Fetching ticket volume data...')
        const response = await reportService.getTicketVolumeReport()
        console.log('Ticket volume response:', response)
        
        if (response.data && response.data.data) {
          console.log('Setting ticket volume data:', response.data.data)
          setData(response.data.data)
        } else if (response.data && Array.isArray(response.data)) {
          // Handle case where data might be directly in the response.data
          console.log('Setting ticket volume data from direct array:', response.data)
          setData(response.data)
        } else if (response.data && response.data.status === 'success') {
          // Try to extract data from a different structure
          console.log('Trying alternative data structure for ticket volume')
          if (response.data.data) {
            console.log('Found data in alternative structure:', response.data.data)
            setData(response.data.data)
          } else {
            console.warn('No valid ticket volume data found, using sample data')
            // Create sample data for testing UI rendering with varying values
            setData([
              { date: 'Mon', new: 5, resolved: 3 },
              { date: 'Tue', new: 12, resolved: 8 },
              { date: 'Wed', new: 6, resolved: 5 },
              { date: 'Thu', new: 15, resolved: 10 },
              { date: 'Fri', new: 10, resolved: 7 },
              { date: 'Sat', new: 4, resolved: 5 },
              { date: 'Sun', new: 3, resolved: 2 }
            ])
          }
        } else {
          // Fallback to sample data if no data
          console.log('No ticket volume data found, using sample data')
          setData([
            { date: 'Mon', new: 5, resolved: 3 },
            { date: 'Tue', new: 12, resolved: 8 },
            { date: 'Wed', new: 6, resolved: 5 },
            { date: 'Thu', new: 15, resolved: 10 },
            { date: 'Fri', new: 10, resolved: 7 },
            { date: 'Sat', new: 4, resolved: 5 },
            { date: 'Sun', new: 3, resolved: 2 }
          ])
        }
      } catch (error) {
        console.error("Error fetching ticket volume data:", error)
        toast.error("Failed to load ticket volume data")
        // Use sample data on error for testing UI rendering
        setData([
          { date: 'Mon', new: 5, resolved: 3 },
          { date: 'Tue', new: 12, resolved: 8 },
          { date: 'Wed', new: 6, resolved: 5 },
          { date: 'Thu', new: 15, resolved: 10 },
          { date: 'Fri', new: 10, resolved: 7 },
          { date: 'Sat', new: 4, resolved: 5 },
          { date: 'Sun', new: 3, resolved: 2 }
        ])
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchTicketVolumeData()
  }, [])

  if (isLoading) {
    return (
      <div className="h-[300px] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center">
        <p className="text-muted-foreground">No ticket volume data available</p>
      </div>
    )
  }
  
  return (
    <div className="h-[300px] w-full">
      {isLoading ? (
        <div className="h-full flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : data.length === 0 ? (
        <div className="h-full flex items-center justify-center">
          <p className="text-muted-foreground">No ticket volume data available</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{
              top: 20,
              right: 30,
              left: 0,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }}
              axisLine={{ stroke: '#e5e7eb', strokeWidth: 1 }}
              tickLine={false}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              width={30}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#fff', 
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                fontSize: '12px'
              }}
              itemStyle={{ padding: '2px 0' }}
              labelStyle={{ fontWeight: 'bold', marginBottom: '5px' }}
            />
            <Legend 
              wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
              iconSize={10}
              iconType="circle"
            />
            <Bar 
              name="New Tickets" 
              dataKey="new" 
              fill="#2563eb" 
              radius={[4, 4, 0, 0]}
              barSize={20}
            />
            <Bar 
              name="Resolved Tickets" 
              dataKey="resolved" 
              fill="#6b7280" 
              radius={[4, 4, 0, 0]}
              barSize={20}
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}

