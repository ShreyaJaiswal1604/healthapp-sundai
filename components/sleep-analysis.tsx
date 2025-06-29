"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { Moon, Clock, TrendingUp, Zap } from "lucide-react"
import { getSleepData } from "@/lib/database"

interface SleepData {
  "Cycle start time": string
  "Sleep onset": string
  "Wake onset": string
  "Sleep performance %": number
  "Asleep duration (min)": number
  "In bed duration (min)": number
  "Light sleep duration (min)": number
  "Deep (SWS) duration (min)": number
  "REM duration (min)": number
  "Awake duration (min)": number
  "Sleep efficiency %": number
  "Sleep debt (min)": number
  "Respiratory rate (rpm)": number
}

export function SleepAnalysis() {
  const [data, setData] = useState<SleepData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const sleepData = await getSleepData(7)
      setData(sleepData)
    } catch (error) {
      console.error("Error fetching sleep data:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-2">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-8 bg-muted rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const latestSleep = data[0]
  const chartData = data
    .slice()
    .reverse()
    .map((item) => ({
      date: new Date(item["Cycle start time"]).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      duration: Math.round((item["Asleep duration (min)"] / 60) * 10) / 10,
      efficiency: item["Sleep efficiency %"],
      performance: item["Sleep performance %"],
      debt: item["Sleep debt (min)"],
    }))

  const sleepStagesData = latestSleep
    ? [
        { name: "Light Sleep", value: latestSleep["Light sleep duration (min)"], color: "#8884d8" },
        { name: "Deep Sleep", value: latestSleep["Deep (SWS) duration (min)"], color: "#82ca9d" },
        { name: "REM Sleep", value: latestSleep["REM duration (min)"], color: "#ffc658" },
        { name: "Awake", value: latestSleep["Awake duration (min)"], color: "#ff7c7c" },
      ]
    : []

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}m`
  }

  const getSleepQuality = (performance: number) => {
    if (performance >= 85) return { label: "Excellent", color: "text-green-600" }
    if (performance >= 70) return { label: "Good", color: "text-blue-600" }
    if (performance >= 55) return { label: "Fair", color: "text-yellow-600" }
    return { label: "Poor", color: "text-red-600" }
  }

  const sleepQuality = getSleepQuality(latestSleep?.["Sleep performance %"] || 0)

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sleep Duration</CardTitle>
            <Moon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {latestSleep ? formatTime(latestSleep["Asleep duration (min)"]) : "0h 0m"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Last night</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sleep Performance</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${sleepQuality.color}`}>
              {latestSleep?.["Sleep performance %"] || 0}%
            </div>
            <Progress value={latestSleep?.["Sleep performance %"] || 0} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">{sleepQuality.label}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sleep Efficiency</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{latestSleep?.["Sleep efficiency %"] || 0}%</div>
            <Progress value={latestSleep?.["Sleep efficiency %"] || 0} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">Time asleep vs. in bed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sleep Debt</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {latestSleep ? formatTime(Math.abs(latestSleep["Sleep debt (min)"])) : "0h 0m"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {(latestSleep?.["Sleep debt (min)"] || 0) > 0 ? "Sleep deficit" : "Well rested"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Sleep Duration Trend</CardTitle>
            <CardDescription>7-day sleep duration history</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${value}h`, "Sleep Duration"]} />
                  <Bar dataKey="duration" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sleep Stages</CardTitle>
            <CardDescription>Last night's sleep composition</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sleepStagesData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${formatTime(value)}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {sleepStagesData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatTime(value as number)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sleep Details */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Deep Sleep</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {latestSleep ? formatTime(latestSleep["Deep (SWS) duration (min)"]) : "0h 0m"}
            </div>
            <p className="text-sm text-muted-foreground">
              {latestSleep
                ? `${Math.round((latestSleep["Deep (SWS) duration (min)"] / latestSleep["Asleep duration (min)"]) * 100)}% of sleep`
                : "0% of sleep"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">REM Sleep</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {latestSleep ? formatTime(latestSleep["REM duration (min)"]) : "0h 0m"}
            </div>
            <p className="text-sm text-muted-foreground">
              {latestSleep
                ? `${Math.round((latestSleep["REM duration (min)"] / latestSleep["Asleep duration (min)"]) * 100)}% of sleep`
                : "0% of sleep"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Respiratory Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{latestSleep?.["Respiratory rate (rpm)"]?.toFixed(1) || "0.0"}</div>
            <p className="text-sm text-muted-foreground">breaths per minute</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
