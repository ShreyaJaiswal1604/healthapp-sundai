import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

export async function POST(request: Request) {
  try {
    const { foodName, description, quantity, unit, photo } = await request.json()

    let prompt = `Analyze the following food item and provide detailed nutritional information:

Food: ${foodName}
${description ? `Description: ${description}` : ""}
Quantity: ${quantity} ${unit}

Please provide a JSON response with the following structure:
{
  "calories": estimated_calories_number,
  "macros": {
    "protein": protein_grams,
    "carbs": carbs_grams,
    "fat": fat_grams,
    "fiber": fiber_grams,
    "sugar": sugar_grams
  },
  "micronutrients": {
    "sodium_mg": sodium_milligrams,
    "potassium_mg": potassium_milligrams,
    "calcium_mg": calcium_milligrams,
    "iron_mg": iron_milligrams,
    "vitamin_c_mg": vitamin_c_milligrams
  },
  "healthScore": "healthy|moderate|unhealthy",
  "healthAnalysis": "brief_health_assessment",
  "suggestions": ["improvement_suggestion_1", "improvement_suggestion_2"],
  "mealTiming": "optimal_timing_recommendation",
  "portionAssessment": "portion_size_feedback"
}`

    if (photo) {
      prompt += `\n\nNote: A photo of the food has been provided. Please analyze the visual appearance to refine your nutritional estimates, considering portion size, preparation method, and visible ingredients.`
    }

    const { text } = await generateText({
      model: openai("gpt-4o"),
      system: `You are a certified nutritionist and dietitian with expertise in food analysis and nutritional assessment. 

Key capabilities:
- Accurate calorie and macronutrient estimation
- Understanding of portion sizes and food preparation methods
- Knowledge of micronutrient content in various foods
- Ability to assess meal healthiness and provide recommendations
- Expertise in meal timing and portion control

Guidelines:
1. Provide realistic and accurate nutritional estimates
2. Consider cooking methods and preparation styles
3. Account for portion sizes appropriately
4. Give practical, actionable health advice
5. Be encouraging while being honest about nutritional content
6. Consider the food in context of overall daily nutrition needs
7. Always respond with valid JSON format`,
      prompt,
    })

    // Parse the JSON response
    let analysis
    try {
      analysis = JSON.parse(text)
    } catch (parseError) {
      // If JSON parsing fails, create a structured response
      analysis = {
        calories: 0,
        macros: { protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0 },
        healthScore: "moderate",
        healthAnalysis: "Unable to parse detailed analysis",
        suggestions: ["Please provide more specific food details for better analysis"],
      }
    }

    return Response.json({ analysis })
  } catch (error) {
    console.error("Error analyzing food:", error)
    return Response.json({ error: "Failed to analyze food" }, { status: 500 })
  }
}
