"use client"

import { useState, Suspense, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MonthlyTicketsChart } from "@/components/reports/monthly-tickets-chart"
import { MonthlyTicketsTable } from "@/components/reports/monthly-tickets-table"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Download, FileSpreadsheet, Image } from "lucide-react"
import { format } from "date-fns"
import { LoadingTable } from "./loading-table"
import { Skeleton } from "@/components/ui/skeleton"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { toast } from "sonner"

// Loading component for the chart
function ChartLoading() {
  return (
    <div className="h-[400px] flex items-center justify-center">
      <div className="space-y-4 w-full">
        <Skeleton className="h-[300px] w-full" />
        <div className="flex justify-between">
          <Skeleton className="h-4 w-10" />
          <Skeleton className="h-4 w-10" />
          <Skeleton className="h-4 w-10" />
          <Skeleton className="h-4 w-10" />
          <Skeleton className="h-4 w-10" />
          <Skeleton className="h-4 w-10" />
          <Skeleton className="h-4 w-10" />
        </div>
      </div>
    </div>
  )
}

export default function ReportsPage() {
  const [date, setDate] = useState(new Date())
  const [selectedMonth, setSelectedMonth] = useState({
    value: new Date().getMonth(),
    label: format(new Date(), "MMMM"),
  })
  const chartRef = useRef(null)
  const tableRef = useRef(null)

  const months = [
    { value: 0, label: "January" },
    { value: 1, label: "February" },
    { value: 2, label: "March" },
    { value: 3, label: "April" },
    { value: 4, label: "May" },
    { value: 5, label: "June" },
    { value: 6, label: "July" },
    { value: 7, label: "August" },
    { value: 8, label: "September" },
    { value: 9, label: "October" },
    { value: 10, label: "November" },
    { value: 11, label: "December" },
  ]

  const handleSelectMonth = (month) => {
    setSelectedMonth(months.find((m) => m.value === Number.parseInt(month)))
  }

  // Export chart as image
  const exportAsImage = () => {
    try {
      if (!chartRef.current) {
        toast.error("Chart not available for export")
        return
      }

      const chartElement = chartRef.current.getChartContainer()
      if (!chartElement) {
        toast.error("Chart element not found")
        return
      }

      toast.info("Preparing image for download...")
      
      // Create a temporary canvas element
      const canvas = document.createElement('canvas')
      canvas.width = chartElement.offsetWidth * 2
      canvas.height = chartElement.offsetHeight * 2
      canvas.style.width = chartElement.offsetWidth + 'px'
      canvas.style.height = chartElement.offsetHeight + 'px'
      const context = canvas.getContext('2d')
      context.scale(2, 2)
      
      // Draw a white background
      context.fillStyle = '#FFFFFF'
      context.fillRect(0, 0, canvas.width, canvas.height)
      
      // Get all SVG elements
      const svgElements = chartElement.querySelectorAll('svg')
      if (svgElements.length === 0) {
        toast.error("Could not find SVG elements to export")
        return
      }
      
      // Convert the first SVG to an image and download it
      const svg = svgElements[0] // Just use the first SVG element
      const svgData = new XMLSerializer().serializeToString(svg)
      
      // Use HTMLImageElement constructor instead of Image to avoid conflict with Lucide React
      const img = document.createElement('img')
      img.onload = () => {
        context.drawImage(img, 0, 0)
        
        // Convert canvas to image and download
        const fileName = `monthly-ticket-volume-${selectedMonth.label}-${date.getFullYear()}.png`
        const link = document.createElement('a')
        link.download = fileName
        link.href = canvas.toDataURL('image/png')
        link.click()
        toast.success("Chart exported as image")
      }
      img.src = 'data:image/svg+xml;base64,' + btoa(svgData)
    } catch (error) {
      console.error("Error exporting chart as image:", error)
      toast.error("Failed to export chart as image")
    }
  }

  // Export ticket details table as CSV
  const exportTableAsCSV = () => {
    try {
      if (!tableRef.current) {
        toast.error("Table data not available for export")
        return
      }

      const tableData = tableRef.current.getTableData()
      if (!tableData || !Array.isArray(tableData) || tableData.length === 0) {
        toast.error("Table data not found")
        return
      }

      // Prepare data for CSV
      let csvContent = ''
      
      // Add header row - based on the first data item's keys
      const headers = Object.keys(tableData[0])
      csvContent += headers.join(',') + '\n'
      
      // Add data rows
      tableData.forEach(dataPoint => {
        const row = headers.map(key => {
          // Handle special formatting for dates and other values
          if (key === 'createdAt' && dataPoint[key]) {
            return format(new Date(dataPoint[key]), 'yyyy-MM-dd HH:mm:ss')
          }
          return dataPoint[key] || ''
        })
        csvContent += row.join(',') + '\n'
      })
      
      // Create and download CSV file
      const fileName = `ticket-details-${selectedMonth.label}-${date.getFullYear()}.csv`
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      
      // Create a download link and trigger it
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      toast.success("Ticket details exported as CSV")
    } catch (error) {
      console.error("Error exporting ticket details as CSV:", error)
      toast.error("Failed to export ticket details as CSV")
    }
  }

  // Export chart data as CSV
  const exportAsCSV = () => {
    try {
      if (!chartRef.current) {
        toast.error("Chart data not available for export")
        return
      }

      const chartData = chartRef.current.getChartData()
      if (!chartData || !Array.isArray(chartData) || chartData.length === 0) {
        toast.error("Chart data not found")
        return
      }

      // Prepare data for CSV
      let csvContent = ''
      
      // Add header row - based on the first data item's keys
      // We know the data structure from the MonthlyTicketsChart component
      const headers = Object.keys(chartData[0])
      csvContent += headers.join(',') + '\n'
      
      // Add data rows
      chartData.forEach(dataPoint => {
        const row = headers.map(key => dataPoint[key])
        csvContent += row.join(',') + '\n'
      })
      
      // Create and download CSV file
      const fileName = `monthly-ticket-volume-${selectedMonth.label}-${date.getFullYear()}.csv`
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      
      // Create a download link and trigger it
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      toast.success("Chart data exported as CSV")
    } catch (error) {
      console.error("Error exporting chart as CSV:", error)
      toast.error("Failed to export chart as CSV")
    }
  }

  return (
    <div className="flex flex-col gap-4 w-full max-w-full">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 w-full">
        <div>
          <h1 className="text-xl font-semibold">Reports</h1>
          <p className="text-xs text-muted-foreground">View and analyze helpdesk performance metrics</p>
        </div>
      </div>
      <div className="flex flex-col gap-4 w-full">
            <Card className="w-full">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full">
                  <div>
                    <CardTitle className="text-sm font-medium">Monthly Ticket Volume</CardTitle>
                    <CardDescription className="text-xs">
                      Overview of tickets created, resolved, and pending per month
                    </CardDescription>
                  </div>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                    <Select value={selectedMonth.value.toString()} onValueChange={handleSelectMonth}>
                      <SelectTrigger className="w-full sm:w-[180px] text-xs">
                        <SelectValue>{selectedMonth.label}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {months.map((month) => (
                          <SelectItem key={month.value} value={month.value.toString()} className="text-xs">
                            {month.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full sm:w-[240px] justify-start text-left font-normal text-xs"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {date ? format(date, "yyyy") : <span>Select a year</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={date}
                          onSelect={setDate}
                          initialFocus
                          disabled={(date) => date > new Date() || date < new Date("2020-01-01")}
                        />
                      </PopoverContent>
                    </Popover>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="icon" className="h-8 w-8 sm:h-9 sm:w-9">
                          <Download className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={exportAsImage}>
                          <Image className="mr-2 h-4 w-4" />
                          Export as Image
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={exportAsCSV}>
                          <FileSpreadsheet className="mr-2 h-4 w-4" />
                          Export as CSV
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Suspense fallback={<ChartLoading />}>
                  <div className="h-[300px] sm:h-[400px]">
                    <MonthlyTicketsChart 
                      ref={chartRef}
                      month={selectedMonth.value} 
                      year={date.getFullYear()} 
                    />
                  </div>
                </Suspense>
              </CardContent>
            </Card>

            <Card className="w-full">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full">
                  <div>
                    <CardTitle className="text-sm font-medium">Ticket Details</CardTitle>
                    <CardDescription className="text-xs">
                      Detailed breakdown of tickets for the selected month
                    </CardDescription>
                  </div>
                  <Button 
                    variant="outline" 
                    className="text-xs w-full sm:w-auto"
                    onClick={exportTableAsCSV}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Export CSV
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Suspense fallback={<LoadingTable />}>
                    <MonthlyTicketsTable 
                      ref={tableRef}
                      month={selectedMonth.value} 
                      year={date.getFullYear()} 
                    />
                  </Suspense>
                </div>
              </CardContent>
            </Card>
      </div>
    </div>)
}