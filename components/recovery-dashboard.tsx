"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Heart, Activity, TrendingUp, Zap } from "lucide-react"
import { getPhysiologicalData } from "@/lib/database"

interface PhysiologicalData {
  "Cycle start time": string
  "Recovery score %": number
  "Resting heart rate (bpm)": number
  "Heart rate variability (ms)": number
  "Skin temp (celsius)": number
  "Blood oxygen %": number
  "Day Strain": string
}

export function RecoveryDashboard() {
  const [data, setData] = useState<PhysiologicalData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const physiologicalData = await getPhysiologicalData(7)
      setData(physiologicalData)
    } catch (error) {
      console.error("Error fetching recovery data:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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

  const latestData = data[0]
  const chartData = data
    .slice()
    .reverse()
    .map((item) => ({
      date: new Date(item["Cycle start time"]).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      recovery: item["Recovery score %"],
      hrv: item["Heart rate variability (ms)"],
      rhr: item["Resting heart rate (bpm)"],
      strain: Number.parseFloat(item["Day Strain"]) || 0,
    }))

  const getRecoveryColor = (score: number) => {
    if (score >= 67) return "text-green-600"
    if (score >= 34) return "text-yellow-600"
    return "text-red-600"
  }

  const getRecoveryStatus = (score: number) => {
    if (score >= 67) return "High"
    if (score >= 34) return "Medium"
    return "Low"
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recovery Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getRecoveryColor(latestData?.["Recovery score %"] || 0)}`}>
              {latestData?.["Recovery score %"] || 0}%
            </div>
            <Progress value={latestData?.["Recovery score %"] || 0} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {getRecoveryStatus(latestData?.["Recovery score %"] || 0)} Recovery
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resting Heart Rate</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{latestData?.["Resting heart rate (bpm)"] || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">bpm</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Heart Rate Variability</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{latestData?.["Heart rate variability (ms)"] || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">ms</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Day Strain</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{latestData?.["Day Strain"] || "0.0"}</div>
            <p className="text-xs text-muted-foreground mt-1">strain score</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recovery Trend</CardTitle>
            <CardDescription>7-day recovery score history</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Line type="monotone" dataKey="recovery" stroke="#8884d8" strokeWidth={2} name="Recovery %" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>HRV & Resting HR</CardTitle>
            <CardDescription>Heart rate variability and resting heart rate</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Line yAxisId="left" type="monotone" dataKey="hrv" stroke="#82ca9d" strokeWidth={2} name="HRV (ms)" />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="rhr"
                    stroke="#ffc658"
                    strokeWidth={2}
                    name="RHR (bpm)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Metrics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Body Temperature</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{latestData?.["Skin temp (celsius)"]?.toFixed(1) || "0.0"}°C</div>
            <p className="text-sm text-muted-foreground">Skin temperature</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Blood Oxygen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{latestData?.["Blood oxygen %"]?.toFixed(1) || "0.0"}%</div>
            <p className="text-sm text-muted-foreground">SpO2 level</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recovery Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge
              variant={
                (latestData?.["Recovery score %"] || 0) >= 67
                  ? "default"
                  : (latestData?.["Recovery score %"] || 0) >= 34
                    ? "secondary"
                    : "destructive"
              }
              className="text-lg px-3 py-1"
            >
              {getRecoveryStatus(latestData?.["Recovery score %"] || 0)}
            </Badge>
            <p className="text-sm text-muted-foreground mt-2">
              {(latestData?.["Recovery score %"] || 0) >= 67
                ? "Your body is well recovered and ready for strain"
                : (latestData?.["Recovery score %"] || 0) >= 34
                  ? "Your body is moderately recovered"
                  : "Your body needs more recovery time"}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
