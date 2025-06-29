import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(request: Request) {
  try {
    const { userId } = await request.json()

    // Fetch comprehensive health data for the past week
    const healthData = await fetchWeeklyHealthData(userId)

    // Generate AI-powered weekly summary
    const { text } = await generateText({
      model: openai("gpt-4o"),
      system: `You are an AI Health Coach creating a comprehensive weekly health summary. 

Create a structured summary that includes:
1. Overall health score (1-10)
2. Key achievements and positive trends
3. Areas for improvement
4. Specific actionable recommendations
5. Goals for next week

Be encouraging but honest about areas needing attention. Use data-driven insights and maintain a supportive tone.`,

      prompt: `Generate a weekly health summary for this user based on their data:

User Profile:
- Name: ${healthData.user?.name}
- Goals: ${healthData.user?.health_goals?.join(", ")}
- Activity Level: ${healthData.user?.activity_level}

Weekly Health Data:
${formatWeeklyDataForAI(healthData)}

Please provide a comprehensive but concise weekly summary with specific insights and recommendations.`,
    })

    // Store the summary as a recommendation
    await supabase.from("health_recommendations").insert({
      user_id: userId,
      category: "general",
      recommendation_text: text,
      priority: "medium",
      context_data: {
        type: "weekly_summary",
        week_ending: new Date().toISOString(),
        data_points: getWeeklyDataSummary(healthData),
      },
    })

    return Response.json({
      summary: text,
      dataPoints: getWeeklyDataSummary(healthData),
    })
  } catch (error) {
    console.error("Error generating weekly summary:", error)
    return Response.json({ error: "Failed to generate weekly summary" }, { status: 500 })
  }
}

async function fetchWeeklyHealthData(userId: string) {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  try {
    const { data: user } = await supabase.from("users").select("*").eq("id", userId).single()

    const { data: foodLogs } = await supabase
      .from("food_logs")
      .select("*")
      .eq("user_id", userId)
      .gte("logged_at", weekAgo.toISOString())
      .order("logged_at", { ascending: false })

    const { data: fitnessData } = await supabase
      .from("fitness_data")
      .select("*")
      .eq("user_id", userId)
      .gte("recorded_at", weekAgo.toISOString())
      .order("recorded_at", { ascending: false })

    const { data: sleepData } = await supabase
      .from("sleep_data")
      .select("*")
      .eq("user_id", userId)
      .gte("sleep_date", weekAgo.toISOString().split("T")[0])
      .order("sleep_date", { ascending: false })

    return { user, foodLogs, fitnessData, sleepData }
  } catch (error) {
    console.error("Error fetching weekly data:", error)
    return {}
  }
}

function formatWeeklyDataForAI(healthData: any): string {
  let summary = ""

  if (healthData.foodLogs?.length > 0) {
    const dailyCalories = calculateDailyAverages(healthData.foodLogs, "calories")
    const dailyProtein = calculateDailyAverages(healthData.foodLogs, "protein_g")
    const dailySodium = calculateDailyAverages(healthData.foodLogs, "sodium_mg")

    summary += `Nutrition: ${healthData.foodLogs.length} meals logged. Daily averages - Calories: ${Math.round(dailyCalories)}, Protein: ${Math.round(dailyProtein)}g, Sodium: ${Math.round(dailySodium)}mg. `
  }

  if (healthData.fitnessData?.length > 0) {
    const totalWorkouts = healthData.fitnessData.length
    const totalCaloriesBurned = healthData.fitnessData.reduce(
      (sum: number, w: any) => sum + (w.calories_burned || 0),
      0,
    )
    const activities = [...new Set(healthData.fitnessData.map((w: any) => w.activity_type))]

    summary += `Fitness: ${totalWorkouts} workouts, ${totalCaloriesBurned} total calories burned. Activities: ${activities.join(", ")}. `
  }

  if (healthData.sleepData?.length > 0) {
    const avgSleep =
      healthData.sleepData.reduce((sum: number, s: any) => sum + (s.total_sleep_hours || 0), 0) /
      healthData.sleepData.length
    const avgQuality =
      healthData.sleepData.reduce((sum: number, s: any) => sum + (s.sleep_quality_score || 0), 0) /
      healthData.sleepData.length

    summary += `Sleep: ${healthData.sleepData.length} nights tracked, avg ${avgSleep.toFixed(1)} hours, quality ${avgQuality.toFixed(1)}/10. `
  }

  return summary
}

function calculateDailyAverages(logs: any[], field: string): number {
  const dailyTotals = logs.reduce((acc: any, log: any) => {
    const date = new Date(log.logged_at).toDateString()
    acc[date] = (acc[date] || 0) + (log[field] || 0)
    return acc
  }, {})

  const days = Object.keys(dailyTotals).length
  const total = Object.values(dailyTotals).reduce((sum: any, val: any) => sum + val, 0)

  return days > 0 ? total / days : 0
}

function getWeeklyDataSummary(healthData: any) {
  return {
    mealsLogged: healthData.foodLogs?.length || 0,
    workoutsCompleted: healthData.fitnessData?.length || 0,
    sleepNightsTracked: healthData.sleepData?.length || 0,
    weekPeriod: {
      start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      end: new Date().toISOString(),
    },
  }
}
