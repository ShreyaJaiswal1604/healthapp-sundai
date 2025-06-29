import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import { supabaseAdmin, isSupabaseConfigured } from "@/lib/supabase"

export async function POST(request: Request) {
  try {
    const { message, userId, conversationHistory } = await request.json()

    // Check if Supabase is configured
    if (!isSupabaseConfigured()) {
      return Response.json({
        response:
          "I'm currently running in demo mode. To access your real health data and get personalized insights, please configure your Supabase database connection. For now, I can provide general health advice!\n\nWhat would you like to know about recovery, sleep, workouts, or wellness?",
        category: "general",
        priority: "low",
        contextData: { hasHealthData: false, dataPoints: { demo_mode: true } },
      })
    }

    // Fetch user's recent health data
    const healthData = await fetchUserHealthData()

    // Generate contextual response
    const { text } = await generateText({
      model: openai("gpt-4o"),
      system: `You are an AI Health Coach specializing in fitness tracking data analysis. You have access to comprehensive health data including recovery scores, sleep metrics, workout performance, and medical lab results.

Key personality traits:
- Expert in recovery science and sleep optimization
- Knowledgeable about heart rate variability and strain
- Evidence-based recommendations for performance optimization
- Supportive and motivational
- Uses emojis appropriately

Available Health Data:
${formatHealthDataForAI(healthData)}

Guidelines:
1. Reference specific metrics like recovery score, HRV, sleep efficiency
2. Provide actionable advice based on strain and recovery patterns
3. Acknowledge achievements and progress
4. Flag concerning trends in health metrics
5. Keep responses under 200 words unless detailed explanation needed
6. Focus on recovery, sleep, and performance optimization`,

      prompt: `User message: "${message}"

Previous conversation context:
${conversationHistory?.map((msg: any) => `${msg.isUser ? "User" : "Coach"}: ${msg.content}`).join("\n") || "No previous context"}

Please provide a helpful, personalized response based on the user's health tracking data.`,
    })

    const category = categorizeResponse(message, text)
    const priority = determinePriority(text, healthData)

    return Response.json({
      response: text,
      category,
      priority,
      contextData: {
        hasHealthData: Object.keys(healthData).length > 0,
        dataPoints: getDataPointsSummary(healthData),
      },
    })
  } catch (error) {
    console.error("Error in health coach:", error)
    return Response.json({
      response:
        "I'm sorry, I'm having trouble connecting right now. Please try again in a moment, or check if your database is properly configured.",
      category: "error",
      priority: "low",
    })
  }
}

async function fetchUserHealthData() {
  try {
    if (!supabaseAdmin) return {}

    // Fetch recent recovery data
    const { data: recovery } = await supabaseAdmin
      .from("physiological_cycles")
      .select("*")
      .order("Cycle start time", { ascending: false })
      .limit(7)

    // Fetch recent sleep data
    const { data: sleep } = await supabaseAdmin
      .from("sleep")
      .select("*")
      .order("Cycle start time", { ascending: false })
      .limit(7)

    // Fetch recent workouts
    const { data: workouts } = await supabaseAdmin
      .from("workouts")
      .select("*")
      .order("Workout start time", { ascending: false })
      .limit(10)

    // Fetch lab results
    const { data: labResults } = await supabaseAdmin.from("medical_lab_results").select("*")

    return { recovery, sleep, workouts, labResults, nutrition: [] }
  } catch (error) {
    console.error("Error fetching health data:", error)
    return {}
  }
}

function formatHealthDataForAI(healthData: any): string {
  let summary = ""

  if (healthData.recovery?.length > 0) {
    const latest = healthData.recovery[0]
    const avgRecovery =
      healthData.recovery.reduce((sum: number, day: any) => sum + (day["Recovery score %"] || 0), 0) /
      healthData.recovery.length

    summary += `Recovery (last 7 days): Current ${latest["Recovery score %"]}%, avg ${avgRecovery.toFixed(1)}%. HRV: ${latest["Heart rate variability (ms)"]}ms, RHR: ${latest["Resting heart rate (bpm)"]}bpm. `
  }

  if (healthData.sleep?.length > 0) {
    const latest = healthData.sleep[0]
    const avgSleep =
      healthData.sleep.reduce((sum: number, night: any) => sum + (night["Asleep duration (min)"] || 0), 0) /
      healthData.sleep.length

    summary += `Sleep (last 7 days): Latest ${Math.round((latest["Asleep duration (min)"] / 60) * 10) / 10}h, avg ${Math.round((avgSleep / 60) * 10) / 10}h. Performance: ${latest["Sleep performance %"]}%, efficiency: ${latest["Sleep efficiency %"]}%. `
  }

  if (healthData.workouts?.length > 0) {
    const totalStrain = healthData.workouts.reduce(
      (sum: number, workout: any) => sum + (workout["Activity Strain"] || 0),
      0,
    )
    const avgStrain = totalStrain / healthData.workouts.length

    summary += `Workouts (recent): ${healthData.workouts.length} sessions, avg strain ${avgStrain.toFixed(1)}. Activities: ${[...new Set(healthData.workouts.map((w: any) => w["Activity name"]))].join(", ")}. `
  }

  if (healthData.labResults?.length > 0) {
    const abnormal = healthData.labResults.filter(
      (result: any) => result.Flag && result.Flag.toLowerCase() !== "normal",
    )
    summary += `Lab Results: ${healthData.labResults.length} tests, ${abnormal.length} abnormal findings. `
  }

  if (healthData.nutrition?.length > 0) {
    const todayNutrition = healthData.nutrition[0]
    const avgCalories =
      healthData.nutrition.reduce((sum: number, day: any) => sum + (day.calories || 0), 0) / healthData.nutrition.length

    summary += `Nutrition (recent): Today ${todayNutrition.calories || 0} calories, avg ${Math.round(avgCalories)} cal/day. Protein: ${todayNutrition.protein_g || 0}g, Carbs: ${todayNutrition.carbs_g || 0}g, Fat: ${todayNutrition.fat_g || 0}g. `
  }

  return summary || "No recent health data available."
}

function categorizeResponse(userMessage: string, aiResponse: string): string {
  const message = userMessage.toLowerCase()

  if (message.includes("recovery") || message.includes("hrv") || message.includes("strain")) return "recovery"
  if (message.includes("sleep") || message.includes("tired") || message.includes("rest")) return "sleep"
  if (message.includes("workout") || message.includes("exercise") || message.includes("training")) return "fitness"
  if (message.includes("lab") || message.includes("medical") || message.includes("test")) return "medical"

  return "general"
}

function determinePriority(aiResponse: string, healthData: any): "low" | "medium" | "high" {
  const response = aiResponse.toLowerCase()

  if (response.includes("urgent") || response.includes("concerning") || response.includes("doctor")) return "high"
  if (response.includes("should consider") || response.includes("recommend")) return "medium"

  return "low"
}

function getDataPointsSummary(healthData: any) {
  return {
    hasRecoveryData: healthData.recovery?.length > 0,
    hasSleepData: healthData.sleep?.length > 0,
    hasWorkoutData: healthData.workouts?.length > 0,
    hasLabData: healthData.labResults?.length > 0,
    dataRecency: "7_days",
  }
}
