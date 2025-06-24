"use client"

const data = [
  {
    day: "Mon",
    time: 12,
  },
  {
    day: "Tue",
    time: 18,
  },
  {
    day: "Wed",
    time: 15,
  },
  {
    day: "Thu",
    time: 25,
  },
  {
    day: "Fri",
    time: 20,
  },
  {
    day: "Sat",
    time: 8,
  },
  {
    day: "Sun",
    time: 5,
  },
]

export function ResponseTimeChart() {
  return (
    <div className="h-[300px] flex flex-col items-center justify-center">
      <h3 className="text-lg font-medium mb-4">Average Response Time</h3>
      <div className="w-full max-w-md">
        <div className="flex items-end h-[200px] gap-2">
          {data.map((item) => (
            <div key={item.day} className="flex-1 flex flex-col items-center">
              <div className="w-full bg-gray-600 rounded-t-sm" style={{ height: `${(item.time / 25) * 100}%` }}></div>
              <div className="mt-2 text-xs">{item.day}</div>
              <div className="text-xs text-muted-foreground">{item.time}m</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

