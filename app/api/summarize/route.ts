import { generateText } from "ai"
import { createOpenAI } from "@ai-sdk/openai"
import { NextResponse } from "next/server"

// Check if OpenAI API key is available
if (!process.env.OPENAI_API_KEY) {
  console.error("OPENAI_API_KEY is not set in environment variables")
}

// Create OpenAI provider with explicit API key configuration
const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
})

export async function POST(request: Request) {
  try {
    const { text } = await request.json()

    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 })
    }

    // Check if API key is available
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OpenAI API key is not configured" }, { status: 500 })
    }

    const { text: summarizedText } = await generateText({
      model: openai("gpt-4o"),
      system:
        "You are a professional summarizer. Create concise, accurate summaries that capture the key points of the original text.",
      prompt: `Summarize the following text in a clear and concise manner. Maintain the important points and overall meaning:\n\n${text}`,
    })

    return NextResponse.json({ result: summarizedText })
  } catch (error) {
    console.error("Summarization error:", error)
    return NextResponse.json({ error: "Failed to summarize text" }, { status: 500 })
  }
}

