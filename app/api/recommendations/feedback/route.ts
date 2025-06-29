import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(request: Request) {
  try {
    const { recommendationId, rating } = await request.json()

    const { error } = await supabase
      .from("health_recommendations")
      .update({ feedback_rating: rating })
      .eq("id", recommendationId)

    if (error) {
      throw error
    }

    return Response.json({ success: true })
  } catch (error) {
    console.error("Error providing feedback:", error)
    return Response.json({ error: "Failed to provide feedback" }, { status: 500 })
  }
}
