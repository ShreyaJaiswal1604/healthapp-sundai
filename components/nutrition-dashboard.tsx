"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LineChart,
  Line,
} from "recharts"
import { Apple, Zap, Target, TrendingUp, Clock, Utensils } from "lucide-react"
import { FoodLogger } from "./food-logger"
import { FoodPhotoAnalyzer } from "./food-photo-analyzer"
import { RecentFoodAnalyses } from "./recent-food-analyses"

interface NutritionData {
  totalCalories: number
  targetCalories: number
  macros: {
    protein: number
    carbs: number
    fat: number
    fiber: number
  }
  targetMacros: {
    protein: number
    carbs: number
    fat: number
  }
  meals: Array<{
    type: string
    calories: number
    time: string
  }>
  micronutrients: {
    sodium: number
    potassium: number
    calcium: number
    iron: number
    vitaminC: number
  }
}

export function NutritionDashboard() {
  const [nutritionData, setNutritionData] = useState<NutritionData>({
    totalCalories: 1850,
    targetCalories: 2200,
    macros: {
      protein: 125,
      carbs: 180,
      fat: 65,
      fiber: 28,
    },
    targetMacros: {
      protein: 140,
      carbs: 220,
      fat: 75,
    },
    meals: [
      { type: "breakfast", calories: 420, time: "07:30" },
      { type: "lunch", calories: 580, time: "12:45" },
      { type: "snack", calories: 180, time: "15:30" },
      { type: "dinner", calories: 670, time: "19:15" },
    ],
    micronutrients: {
      sodium: 1850,
      potassium: 2800,
      calcium: 850,
      iron: 12,
      vitaminC: 85,
    },
  })

  const [weeklyTrends, setWeeklyTrends] = useState([
    { day: "Mon", calories: 2100, protein: 130, carbs: 200, fat: 70 },
    { day: "Tue", calories: 1950, protein: 125, carbs: 180, fat: 65 },
    { day: "Wed", calories: 2250, protein: 140, carbs: 220, fat: 80 },
    { day: "Thu", calories: 2000, protein: 135, carbs: 190, fat: 68 },
    { day: "Fri", calories: 1850, protein: 125, carbs: 180, fat: 65 },
    { day: "Sat", calories: 2400, protein: 150, carbs: 240, fat: 85 },
    { day: "Sun", calories: 2150, protein: 145, carbs: 210, fat: 75 },
  ])

  const macroData = [
    {
      name: "Protein",
      value: nutritionData.macros.protein,
      target: nutritionData.targetMacros.protein,
      color: "#8884d8",
      calories: nutritionData.macros.protein * 4,
    },
    {
      name: "Carbs",
      value: nutritionData.macros.carbs,
      target: nutritionData.targetMacros.carbs,
      color: "#82ca9d",
      calories: nutritionData.macros.carbs * 4,
    },
    {
      name: "Fat",
      value: nutritionData.macros.fat,
      target: nutritionData.targetMacros.fat,
      color: "#ffc658",
      calories: nutritionData.macros.fat * 9,
    },
  ]

  const mealDistribution = nutritionData.meals.map((meal) => ({
    name: meal.type.charAt(0).toUpperCase() + meal.type.slice(1),
    value: meal.calories,
    time: meal.time,
  }))

  const getCalorieStatus = () => {
    const percentage = (nutritionData.totalCalories / nutritionData.targetCalories) * 100
    if (percentage < 80) return { status: "Under", color: "text-yellow-600" }
    if (percentage > 110) return { status: "Over", color: "text-red-600" }
    return { status: "On Track", color: "text-green-600" }
  }

  const getMacroStatus = (current: number, target: number) => {
    const percentage = (current / target) * 100
    if (percentage < 80) return "low"
    if (percentage > 120) return "high"
    return "good"
  }

  const calorieStatus = getCalorieStatus()

  return (
    <div className="space-y-6">
      {/* Food Logging Options */}
      <div className="grid gap-4 md:grid-cols-2">
        <FoodPhotoAnalyzer />
        <FoodLogger />
      </div>

      {/* Recent Analyses */}
      <RecentFoodAnalyses />

      {/* Daily Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Calories Today</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${calorieStatus.color}`}>{nutritionData.totalCalories}</div>
            <Progress value={(nutritionData.totalCalories / nutritionData.targetCalories) * 100} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {nutritionData.targetCalories - nutritionData.totalCalories} remaining • {calorieStatus.status}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Protein</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{nutritionData.macros.protein}g</div>
            <Progress
              value={(nutritionData.macros.protein / nutritionData.targetMacros.protein) * 100}
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-1">Target: {nutritionData.targetMacros.protein}g</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Carbs</CardTitle>
            <Apple className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{nutritionData.macros.carbs}g</div>
            <Progress value={(nutritionData.macros.carbs / nutritionData.targetMacros.carbs) * 100} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">Target: {nutritionData.targetMacros.carbs}g</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fat</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{nutritionData.macros.fat}g</div>
            <Progress value={(nutritionData.macros.fat / nutritionData.targetMacros.fat) * 100} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">Target: {nutritionData.targetMacros.fat}g</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analysis */}
      <Tabs defaultValue="macros" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="macros">Macros</TabsTrigger>
          <TabsTrigger value="meals">Meals</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="micronutrients">Vitamins</TabsTrigger>
        </TabsList>

        <TabsContent value="macros" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Macro Distribution</CardTitle>
                <CardDescription>Current vs. target macronutrients</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={macroData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}g`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="calories"
                      >
                        {macroData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value} cal`, "Calories"]} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Macro Targets</CardTitle>
                <CardDescription>Progress towards daily goals</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {macroData.map((macro) => (
                  <div key={macro.name} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{macro.name}</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm">
                          {macro.value}g / {macro.target}g
                        </span>
                        <Badge
                          variant={
                            getMacroStatus(macro.value, macro.target) === "good"
                              ? "default"
                              : getMacroStatus(macro.value, macro.target) === "low"
                                ? "secondary"
                                : "destructive"
                          }
                        >
                          {getMacroStatus(macro.value, macro.target)}
                        </Badge>
                      </div>
                    </div>
                    <Progress value={(macro.value / macro.target) * 100} />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="meals" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Meal Distribution</CardTitle>
                <CardDescription>Calorie breakdown by meal</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={mealDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value, time }) => `${name}: ${value} cal`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {mealDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={`hsl(${index * 90}, 70%, 60%)`} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Meal Timeline</CardTitle>
                <CardDescription>Today's eating schedule</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {nutritionData.meals.map((meal, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full">
                        <Utensils className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium capitalize">{meal.type}</p>
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <Clock className="w-4 h-4" />
                          <span>{meal.time}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{meal.calories} cal</p>
                      <p className="text-sm text-muted-foreground">
                        {Math.round((meal.calories / nutritionData.totalCalories) * 100)}%
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Weekly Nutrition Trends</CardTitle>
              <CardDescription>7-day calorie and macro intake</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weeklyTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="calories" stroke="#8884d8" strokeWidth={2} name="Calories" />
                    <Line type="monotone" dataKey="protein" stroke="#82ca9d" strokeWidth={2} name="Protein (g)" />
                    <Line type="monotone" dataKey="carbs" stroke="#ffc658" strokeWidth={2} name="Carbs (g)" />
                    <Line type="monotone" dataKey="fat" stroke="#ff7c7c" strokeWidth={2} name="Fat (g)" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="micronutrients" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Sodium</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{nutritionData.micronutrients.sodium}mg</div>
                <Progress value={(nutritionData.micronutrients.sodium / 2300) * 100} className="mt-2" />
                <p className="text-sm text-muted-foreground mt-1">Limit: 2300mg</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Potassium</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{nutritionData.micronutrients.potassium}mg</div>
                <Progress value={(nutritionData.micronutrients.potassium / 3500) * 100} className="mt-2" />
                <p className="text-sm text-muted-foreground mt-1">Target: 3500mg</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Calcium</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{nutritionData.micronutrients.calcium}mg</div>
                <Progress value={(nutritionData.micronutrients.calcium / 1000) * 100} className="mt-2" />
                <p className="text-sm text-muted-foreground mt-1">Target: 1000mg</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Iron</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{nutritionData.micronutrients.iron}mg</div>
                <Progress value={(nutritionData.micronutrients.iron / 18) * 100} className="mt-2" />
                <p className="text-sm text-muted-foreground mt-1">Target: 18mg</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Vitamin C</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{nutritionData.micronutrients.vitaminC}mg</div>
                <Progress value={(nutritionData.micronutrients.vitaminC / 90) * 100} className="mt-2" />
                <p className="text-sm text-muted-foreground mt-1">Target: 90mg</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Fiber</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{nutritionData.macros.fiber}g</div>
                <Progress value={(nutritionData.macros.fiber / 25) * 100} className="mt-2" />
                <p className="text-sm text-muted-foreground mt-1">Target: 25g</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
