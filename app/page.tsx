"use client"
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Heart, CheckCircle2, AlertCircle, X } from "lucide-react"
import { HealthSidebar } from "@/components/health-sidebar"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { RecoveryDashboard } from "@/components/recovery-dashboard"
import { SleepAnalysis } from "@/components/sleep-analysis"
import { WorkoutAnalysis } from "@/components/workout-analysis"
import { MedicalLabResults } from "@/components/medical-lab-results"
import { HealthCoachChat } from "@/components/health-coach-chat"
import { HealthRecommendationsPanel } from "@/components/health-recommendations-panel"
import { NutritionDashboard } from "@/components/nutrition-dashboard"
import { WhoopConnect } from "@/components/whoop-connect"

export default function HealthDashboard() {
  const [activeTab, setActiveTab] = useState("recovery")
  const [visibleAlerts, setVisibleAlerts] = useState([0, 1, 2]) // Track which alerts are visible

  const healthAlerts = [
    { type: "reminder", message: "Lab results show elevated cholesterol - follow up recommended", priority: "high", targetTab: "medical" },
    { type: "achievement", message: "7-day recovery score averaging 75% - excellent!", priority: "low", targetTab: "recovery" },
    { type: "warning", message: "Sleep debt accumulating - prioritize rest tonight", priority: "medium", targetTab: "sleep" },
  ]

  const handleViewAlert = (targetTab: string) => {
    setActiveTab(targetTab)
  }

  const handleCloseAlert = (alertIndex: number) => {
    setVisibleAlerts(prev => prev.filter(index => index !== alertIndex))
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <HealthSidebar />
        <SidebarInset>
          <div className="flex-1 space-y-6 p-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Health Dashboard</h1>
                <p className="text-muted-foreground">
                  Comprehensive health tracking with recovery, sleep, and performance insights
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="text-green-600 border-green-200">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Synced
                </Badge>
              </div>
            </div>

            {/* Health Alerts */}
            {visibleAlerts.length > 0 && (
              <div className="grid gap-3">
                {healthAlerts
                  .filter((_, index) => visibleAlerts.includes(index))
                  .map((alert, index) => {
                    const originalIndex = healthAlerts.findIndex(a => a === alert)
                    return (
                      <Card
                        key={originalIndex}
                        className={`border-l-4 ${
                          alert.priority === "high"
                            ? "border-l-red-500"
                            : alert.priority === "medium"
                              ? "border-l-yellow-500"
                              : "border-l-green-500"
                        }`}
                      >
                        <CardContent className="flex items-center justify-between p-4">
                          <div className="flex items-center space-x-3">
                            <AlertCircle
                              className={`w-5 h-5 ${
                                alert.priority === "high"
                                  ? "text-red-500"
                                  : alert.priority === "medium"
                                    ? "text-yellow-500"
                                    : "text-green-500"
                              }`}
                            />
                            <span className="text-sm font-medium">{alert.message}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleViewAlert(alert.targetTab)}
                            >
                              View
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCloseAlert(originalIndex)}
                              className="p-1 h-6 w-6"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
              </div>
            )}

            {/* Main Content Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
              <TabsList className="grid w-full grid-cols-7">
                <TabsTrigger value="recovery">Recovery</TabsTrigger>
                <TabsTrigger value="sleep">Sleep</TabsTrigger>
                <TabsTrigger value="workouts">Workouts</TabsTrigger>
                <TabsTrigger value="nutrition">🍎 Nutrition</TabsTrigger> {/* ← CLICK HERE */}
                <TabsTrigger value="medical">Medical</TabsTrigger>
                <TabsTrigger value="insights">AI Coach</TabsTrigger>
                <TabsTrigger value="journal">Journal</TabsTrigger>
              </TabsList>

              <TabsContent value="recovery" className="space-y-4">
                <div className="space-y-4">
                  <WhoopConnect />
                  <RecoveryDashboard />
                </div>
              </TabsContent>

              <TabsContent value="sleep" className="space-y-4">
                <div className="space-y-4">
                  <WhoopConnect />
                  <SleepAnalysis />
                </div>
              </TabsContent>

              <TabsContent value="workouts" className="space-y-4">
                <div className="space-y-4">
                  <WhoopConnect />
                  <WorkoutAnalysis />
                </div>
              </TabsContent>

              <TabsContent value="nutrition" className="space-y-4">
                {/* ← THE FOOD PHOTO ANALYZER IS HERE */}
                <NutritionDashboard />
              </TabsContent>

              <TabsContent value="medical" className="space-y-4">
                <MedicalLabResults />
              </TabsContent>

              <TabsContent value="insights" className="space-y-4">
                <div className="grid gap-6 lg:grid-cols-2">
                  <div className="space-y-4">
                    <HealthRecommendationsPanel />
                  </div>
                  <div>
                    <HealthCoachChat />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="journal" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Heart className="w-5 h-5" />
                      <span>Daily Journal</span>
                    </CardTitle>
                    <CardDescription>Track your daily wellness responses and notes</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8 text-muted-foreground">
                      <Heart className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Journal entries will appear here</p>
                      <p className="text-sm">Connect your device to sync journal responses</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
