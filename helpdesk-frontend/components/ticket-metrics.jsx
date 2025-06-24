"use client"
import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { reportService } from "@/lib/services/report-service"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"

export function TicketMetrics() {
  const [metricsData, setMetricsData] = useState({
    statusData: [],
    priorityData: []
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  // Function to fetch the latest ticket metrics data
  const fetchTicketMetrics = async () => {
    try {
      setIsLoading(true)
      setError(null)
      console.log('Fetching real-time ticket metrics...')
      
      // Make the API request to get the latest data
      const response = await reportService.getTicketMetrics()
      console.log('Real-time ticket metrics response:', response)
      
      // Process the response and update the state with the latest data
      if (response && response.data) {
        if (response.data.statusData && Array.isArray(response.data.statusData) && 
            response.data.priorityData && Array.isArray(response.data.priorityData)) {
          
          console.log('Setting real-time metrics data:', response.data)
          setMetricsData({
            statusData: response.data.statusData,
            priorityData: response.data.priorityData
          })
        } else {
          throw new Error('API response missing expected data structure')
        }
      } else {
        throw new Error('Invalid API response')
      }
    } catch (error) {
      console.error("Error fetching ticket metrics:", error)
      setError(error.message || 'Failed to load ticket metrics')
      toast.error("Failed to load ticket metrics data")
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch data when component mounts
  useEffect(() => {
    fetchTicketMetrics()
    
    // Set up an interval to refresh the data every 30 seconds
    const refreshInterval = setInterval(() => {
      console.log('Refreshing ticket metrics data...')
      fetchTicketMetrics()
    }, 30000) // 30 seconds
    
    // Clean up the interval when the component unmounts
    return () => clearInterval(refreshInterval)
  }, [])

  // Calculate totals for percentage calculations
  const statusTotal = metricsData.statusData.reduce((acc, curr) => acc + curr.value, 0)
  const priorityTotal = metricsData.priorityData.reduce((acc, curr) => acc + curr.value, 0)

  // Custom tooltip for the pie charts
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const total = data.dataType === 'status' ? statusTotal : priorityTotal;
      const percentage = total > 0 ? Math.round((data.value / total) * 100) : 0;
      
      return (
        <div className="bg-white dark:bg-gray-800 p-2 border border-gray-200 dark:border-gray-700 rounded shadow-sm">
          <p className="font-medium">{data.name}</p>
          <p className="text-sm">Count: {data.value}</p>
          <p className="text-sm">Percentage: {percentage}%</p>
        </div>
      );
    }
    return null;
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center space-y-2">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading metrics...</p>
        </div>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center space-y-2 text-center">
          <p className="text-sm text-red-500">{error}</p>
          <button 
            onClick={fetchTicketMetrics}
            className="text-xs text-blue-500 hover:underline"
          >
            Try again
          </button>
        </div>
      </div>
    )
  }

  // Show empty state if no data
  if (metricsData.statusData.length === 0 && metricsData.priorityData.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-muted-foreground">No ticket metrics data available</p>
      </div>
    )
  }

  return (
    <Tabs defaultValue="status" className="h-[300px]">
      <TabsList className="mb-4">
        <TabsTrigger value="status">Status</TabsTrigger>
        <TabsTrigger value="priority">Priority</TabsTrigger>
      </TabsList>
      <TabsContent value="status" className="h-[250px]">
        {metricsData.statusData.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-muted-foreground">No status data available</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={metricsData.statusData.map(item => ({...item, dataType: 'status'}))}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                nameKey="name"
              >
                {metricsData.statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                layout="horizontal" 
                verticalAlign="bottom" 
                align="center"
                formatter={(value, entry) => {
                  const item = metricsData.statusData.find(d => d.name === value);
                  if (!item) return <span className="text-xs">{value}</span>;
                  const percentage = statusTotal > 0 ? Math.round((item.value / statusTotal) * 100) : 0;
                  return <span className="text-xs">{value}: {item.value} ({percentage}%)</span>;
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </TabsContent>
      <TabsContent value="priority" className="h-[250px]">
        {metricsData.priorityData.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-muted-foreground">No priority data available</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={metricsData.priorityData.map(item => ({...item, dataType: 'priority'}))}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                nameKey="name"
              >
                {metricsData.priorityData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                layout="horizontal" 
                verticalAlign="bottom" 
                align="center"
                formatter={(value, entry) => {
                  const item = metricsData.priorityData.find(d => d.name === value);
                  if (!item) return <span className="text-xs">{value}</span>;
                  const percentage = priorityTotal > 0 ? Math.round((item.value / priorityTotal) * 100) : 0;
                  return <span className="text-xs">{value}: {item.value} ({percentage}%)</span>;
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </TabsContent>
    </Tabs>
  )
}
