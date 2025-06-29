"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts"
import { Activity, Flame, Clock, MapPin } from "lucide-react"
import { getWorkoutsData } from "@/lib/database"

interface WorkoutData {
  "Workout start time": string
  "Duration (min)": number
  "Activity name": string
  "Activity Strain": number
  "Energy burned (cal)": number
  "Max HR (bpm)": number
  "Average HR (bpm)": number
  "HR Zone 1 %": number
  "HR Zone 2 %": number
  "HR Zone 3 %": number
  "Distance (meters)": string
  "GPS enabled": boolean
}

export function WorkoutAnalysis() {
  const [data, setData] = useState<WorkoutData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const workoutData = await getWorkoutsData(10)
      setData(workoutData)
    } catch (error) {
      console.error("Error fetching workout data:", error)
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

  const recentWorkouts = data.slice(0, 7)
  const chartData = recentWorkouts
    .slice()
    .reverse()
    .map((workout) => ({
      date: new Date(workout["Workout start time"]).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      strain: workout["Activity Strain"],
      calories: workout["Energy burned (cal)"],
      duration: workout["Duration (min)"],
      avgHR: workout["Average HR (bpm)"],
      maxHR: workout["Max HR (bpm)"],
    }))

  const totalCalories = recentWorkouts.reduce((sum, workout) => sum + (workout["Energy burned (cal)"] || 0), 0)
  const totalDuration = recentWorkouts.reduce((sum, workout) => sum + (workout["Duration (min)"] || 0), 0)
  const avgStrain =
    recentWorkouts.reduce((sum, workout) => sum + (workout["Activity Strain"] || 0), 0) / recentWorkouts.length

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  }

  const getStrainColor = (strain: number) => {
    if (strain >= 18) return "text-red-600"
    if (strain >= 14) return "text-orange-600"
    if (strain >= 10) return "text-yellow-600"
    return "text-green-600"
  }

  const getStrainLevel = (strain: number) => {
    if (strain >= 18) return "Very High"
    if (strain >= 14) return "High"
    if (strain >= 10) return "Moderate"
    return "Low"
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Weekly Strain</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getStrainColor(avgStrain)}`}>{avgStrain.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground mt-1">{getStrainLevel(avgStrain)} intensity</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Calories Burned</CardTitle>
            <Flame className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(totalCalories).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Last 7 workouts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Duration</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatDuration(totalDuration)}</div>
            <p className="text-xs text-muted-foreground mt-1">Last 7 workouts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Workouts</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recentWorkouts.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Last 7 days</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Strain & Calories</CardTitle>
            <CardDescription>Workout intensity and energy expenditure</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Bar yAxisId="left" dataKey="strain" fill="#8884d8" name="Strain" />
                  <Bar yAxisId="right" dataKey="calories" fill="#82ca9d" name="Calories" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Heart Rate Zones</CardTitle>
            <CardDescription>Average and max heart rate trends</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="avgHR" stroke="#8884d8" strokeWidth={2} name="Avg HR" />
                  <Line type="monotone" dataKey="maxHR" stroke="#82ca9d" strokeWidth={2} name="Max HR" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Workouts */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Workouts</CardTitle>
          <CardDescription>Your latest training sessions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentWorkouts.slice(0, 5).map((workout, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full">
                    <Activity className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">{workout["Activity name"] || "Workout"}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(workout["Workout start time"]).toLocaleDateString()} •{" "}
                      {formatDuration(workout["Duration (min)"])}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center space-x-4">
                    <div>
                      <p className="text-sm font-medium">{Math.round(workout["Energy burned (cal)"])} cal</p>
                      <p className="text-xs text-muted-foreground">
                        Strain: {workout["Activity Strain"]?.toFixed(1) || "0.0"}
                      </p>
                    </div>
                    <Badge
                      variant={
                        (workout["Activity Strain"] || 0) >= 14
                          ? "destructive"
                          : (workout["Activity Strain"] || 0) >= 10
                            ? "default"
                            : "secondary"
                      }
                    >
                      {getStrainLevel(workout["Activity Strain"] || 0)}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
