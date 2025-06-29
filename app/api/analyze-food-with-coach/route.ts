import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import { supabaseAdmin, isSupabaseConfigured } from "@/lib/supabase"

export async function POST(request: Request) {
  try {
    const { photo, metadata, userId } = await request.json()

    if (!photo) {
      return Response.json({ error: "Photo is required" }, { status: 400 })
    }

    // Fetch user's health context for personalized analysis
    const userHealthContext = await fetchUserHealthContext(userId)

    // First, analyze the food photo for nutritional content
    const nutritionalAnalysis = await analyzeNutritionalContent(photo, metadata)

    // Then, get comprehensive health coaching response
    const coachResponse = await generateHealthCoachResponse(photo, metadata, nutritionalAnalysis, userHealthContext)

    // Parse the structured analysis from the coach response
    const structuredAnalysis = await parseStructuredAnalysis(nutritionalAnalysis, coachResponse, metadata)

    return Response.json({
      analysis: structuredAnalysis,
      coachResponse: coachResponse,
      success: true,
    })
  } catch (error) {
    console.error("Error in food analysis with coach:", error)
    return Response.json(
      {
        error: "Failed to analyze food with health coach",
      },
      { status: 500 },
    )
  }
}

async function fetchUserHealthContext(userId: string) {
  try {
    if (!isSupabaseConfigured() || !supabaseAdmin) {
      return {
        hasData: false,
        summary: "No health data available - running in demo mode",
      }
    }

    // Fetch recent health data for context
    const [recoveryData, sleepData, workoutData, nutritionData] = await Promise.all([
      supabaseAdmin
        .from("physiological_cycles")
        .select("*")
        .eq("user_id", userId)
        .order("Cycle start time", { ascending: false })
        .limit(3),

      supabaseAdmin
        .from("sleep")
        .select("*")
        .eq("user_id", userId)
        .order("Cycle start time", { ascending: false })
        .limit(3),

      supabaseAdmin
        .from("workouts")
        .select("*")
        .eq("user_id", userId)
        .order("Workout start time", { ascending: false })
        .limit(5),

      supabaseAdmin
        .from("food_logs")
        .select("*")
        .eq("user_id", userId)
        .gte("logged_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order("logged_at", { ascending: false }),
    ])

    return {
      hasData: true,
      recovery: recoveryData.data || [],
      sleep: sleepData.data || [],
      workouts: workoutData.data || [],
      recentNutrition: nutritionData.data || [],
      summary: formatHealthContextSummary({
        recovery: recoveryData.data || [],
        sleep: sleepData.data || [],
        workouts: workoutData.data || [],
        nutrition: nutritionData.data || [],
      }),
    }
  } catch (error) {
    console.error("Error fetching user health context:", error)
    return {
      hasData: false,
      summary: "Unable to fetch health context",
    }
  }
}

function formatHealthContextSummary(healthData: any): string {
  let summary = ""

  if (healthData.recovery?.length > 0) {
    const latestRecovery = healthData.recovery[0]
    const avgRecovery =
      healthData.recovery.reduce((sum: number, day: any) => sum + (day["Recovery score %"] || 0), 0) /
      healthData.recovery.length

    summary += `Recent Recovery: Current ${latestRecovery["Recovery score %"]}%, avg ${avgRecovery.toFixed(1)}%. HRV: ${latestRecovery["Heart rate variability (ms)"]}ms. `
  }

  if (healthData.sleep?.length > 0) {
    const latestSleep = healthData.sleep[0]
    const avgSleepHours =
      healthData.sleep.reduce((sum: number, night: any) => sum + (night["Asleep duration (min)"] || 0) / 60, 0) /
      healthData.sleep.length

    summary += `Recent Sleep: Latest ${((latestSleep["Asleep duration (min)"] || 0) / 60).toFixed(1)}h, avg ${avgSleepHours.toFixed(1)}h. Quality: ${latestSleep["Sleep performance %"]}%. `
  }

  if (healthData.workouts?.length > 0) {
    const recentWorkouts = healthData.workouts.slice(0, 3)
    const avgStrain =
      recentWorkouts.reduce((sum: number, workout: any) => sum + (workout["Activity Strain"] || 0), 0) /
      recentWorkouts.length

    summary += `Recent Workouts: ${recentWorkouts.length} sessions, avg strain ${avgStrain.toFixed(1)}. `
  }

  if (healthData.nutrition?.length > 0) {
    const recentMeals = healthData.nutrition.slice(0, 5)
    const avgCalories =
      recentMeals.reduce((sum: number, meal: any) => sum + (meal.calories || 0), 0) / recentMeals.length

    summary += `Recent Nutrition: Avg ${Math.round(avgCalories)} cal/meal. `
  }

  return summary || "No recent health data available."
}

async function analyzeNutritionalContent(photo: string, metadata: any) {
  const { text } = await generateText({
    model: openai("gpt-4o"),
    system: `You are a certified nutritionist analyzing food photos. Provide accurate nutritional estimates based on visual analysis.

Consider:
- Portion size: ${metadata.portionSize}
- Preparation method: ${metadata.preparationMethod}
- Meal type: ${metadata.mealType}
- Time: ${metadata.mealTime}

Respond with JSON only:
{
  "calories": number,
  "macros": {
    "protein": number,
    "carbs": number,
    "fat": number,
    "fiber": number,
    "sugar": number
  },
  "micronutrients": {
    "sodium_mg": number,
    "potassium_mg": number,
    "calcium_mg": number,
    "iron_mg": number,
    "vitamin_c_mg": number
  },
  "ingredients": ["ingredient1", "ingredient2"],
  "preparationNotes": "cooking method and style observations"
}`,
    prompt: `Analyze this food photo for nutritional content. The meal is described as ${metadata.mealType} at ${metadata.mealTime}, portion size is ${metadata.portionSize}, prepared by ${metadata.preparationMethod}. Additional context: ${metadata.notes}`,
  })

  try {
    return JSON.parse(text)
  } catch (error) {
    console.error("Error parsing nutritional analysis:", error)
    return {
      calories: 0,
      macros: { protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0 },
      micronutrients: { sodium_mg: 0, potassium_mg: 0, calcium_mg: 0, iron_mg: 0, vitamin_c_mg: 0 },
      ingredients: [],
      preparationNotes: "Unable to analyze",
    }
  }
}

async function generateHealthCoachResponse(
  photo: string,
  metadata: any,
  nutritionalAnalysis: any,
  userHealthContext: any,
) {
  const { text } = await generateText({
    model: openai("gpt-4o"),
    system: `You are an AI Health Coach specializing in personalized nutrition guidance. You analyze food photos with rich contextual metadata to provide comprehensive health insights.

Your expertise includes:
- Nutritional analysis and meal optimization
- Meal timing and circadian rhythm effects
- Emotional eating patterns and behavioral insights
- Recovery and performance nutrition
- Personalized recommendations based on health data

User's Health Context:
${userHealthContext.summary}

Personality:
- Supportive and encouraging
- Evidence-based recommendations
- Considers psychological and social factors
- Practical and actionable advice
- Uses appropriate emojis for engagement`,

    prompt: `Please analyze this food photo and provide comprehensive health coaching insights.

FOOD PHOTO CONTEXT:
- Meal Type: ${metadata.mealType}
- Time: ${metadata.mealTime}
- Location: ${metadata.location}
- Social Context: ${metadata.socialContext}
- Hunger Level: ${metadata.hungerLevel}/10
- Mood Before: ${metadata.moodBefore}
- Mood After: ${metadata.moodAfter}
- Portion Size: ${metadata.portionSize}
- Preparation: ${metadata.preparationMethod}
- Notes: ${metadata.notes}

NUTRITIONAL ANALYSIS:
- Calories: ${nutritionalAnalysis.calories}
- Protein: ${nutritionalAnalysis.macros?.protein}g
- Carbs: ${nutritionalAnalysis.macros?.carbs}g
- Fat: ${nutritionalAnalysis.macros?.fat}g
- Key ingredients: ${nutritionalAnalysis.ingredients?.join(", ")}

Please provide a comprehensive response covering:

1. **Nutritional Assessment** - Quality and balance of this meal
2. **Timing Analysis** - How meal timing affects metabolism and performance
3. **Contextual Insights** - Impact of mood, social setting, and hunger level
4. **Recovery & Performance** - How this meal supports their health goals
5. **Behavioral Patterns** - Observations about eating habits and mindfulness
6. **Personalized Recommendations** - Specific, actionable improvements
7. **Positive Reinforcement** - Acknowledge good choices made

Keep the response conversational, supportive, and under 400 words while being comprehensive.`,
  })

  return text
}

async function parseStructuredAnalysis(nutritionalAnalysis: any, coachResponse: string, metadata: any) {
  // Generate structured analysis based on the coach response and nutritional data
  const { text } = await generateText({
    model: openai("gpt-4o"),
    system: `Extract structured insights from the health coach response and nutritional analysis. Respond with JSON only.`,
    prompt: `Based on this health coach response and nutritional data, create a structured analysis:

COACH RESPONSE: ${coachResponse}

NUTRITIONAL DATA: ${JSON.stringify(nutritionalAnalysis)}

METADATA: ${JSON.stringify(metadata)}

Respond with this exact JSON structure:
{
  "nutritionalAnalysis": {
    "calories": ${nutritionalAnalysis.calories || 0},
    "macros": {
      "protein": ${nutritionalAnalysis.macros?.protein || 0},
      "carbs": ${nutritionalAnalysis.macros?.carbs || 0},
      "fat": ${nutritionalAnalysis.macros?.fat || 0},
      "fiber": ${nutritionalAnalysis.macros?.fiber || 0}
    },
    "micronutrients": ${JSON.stringify(nutritionalAnalysis.micronutrients || {})}
  },
  "healthAssessment": {
    "score": number_between_0_and_100,
    "category": "excellent|good|fair|poor",
    "concerns": ["concern1", "concern2"],
    "positives": ["positive1", "positive2"]
  },
  "personalizedRecommendations": ["rec1", "rec2", "rec3"],
  "mealTimingAdvice": "timing advice string",
  "portionFeedback": "portion feedback string",
  "improvementSuggestions": ["suggestion1", "suggestion2"],
  "contextualInsights": ["insight1", "insight2"]
}`,
  })

  try {
    return JSON.parse(text)
  } catch (error) {
    console.error("Error parsing structured analysis:", error)
    // Return fallback structure
    return {
      nutritionalAnalysis: nutritionalAnalysis,
      healthAssessment: {
        score: 70,
        category: "good",
        concerns: ["Unable to parse detailed analysis"],
        positives: ["Meal logged for tracking"],
      },
      personalizedRecommendations: ["Continue tracking your meals for better insights"],
      mealTimingAdvice: "Meal timing analysis unavailable",
      portionFeedback: "Portion analysis unavailable",
      improvementSuggestions: ["Try adding more vegetables to your meals"],
      contextualInsights: ["Keep logging meals with context for better insights"],
    }
  }
}
