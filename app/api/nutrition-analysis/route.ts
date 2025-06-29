import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

export async function POST(request: Request) {
  try {
    const { mealDescription } = await request.json()

    const { text } = await generateText({
      model: openai("gpt-4o"),
      prompt: `
        Analyze the following meal and provide nutritional information:
        
        Meal: ${mealDescription}
        
        Please provide:
        1. Estimated calories
        2. Macronutrient breakdown (carbs, protein, fat in grams)
        3. Key vitamins and minerals
        4. Health assessment (healthy/moderate/unhealthy)
        5. Suggestions for improvement
        
        Format the response as JSON with the following structure:
        {
          "calories": number,
          "macros": {
            "carbs": number,
            "protein": number,
            "fat": number
          },
          "vitamins": ["vitamin1", "vitamin2"],
          "healthScore": "healthy|moderate|unhealthy",
          "suggestions": ["suggestion1", "suggestion2"]
        }
      `,
    })

    return Response.json({ analysis: text })
  } catch (error) {
    console.error("Error analyzing nutrition:", error)
    return Response.json({ error: "Failed to analyze nutrition" }, { status: 500 })
  }
}
