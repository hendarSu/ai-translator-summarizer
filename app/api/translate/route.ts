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
    const { text, targetLanguage } = await request.json()

    if (!text || !targetLanguage) {
      return NextResponse.json({ error: "Text and target language are required" }, { status: 400 })
    }

    // Check if API key is available
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OpenAI API key is not configured" }, { status: 500 })
    }

    const languageMap: Record<string, string> = {
      id: "Indonesian",
      en: "English",
      es: "Spanish",
      fr: "French",
      de: "German",
      ja: "Japanese",
      zh: "Chinese",
    }

    const languageName = languageMap[targetLanguage] || targetLanguage

    const { text: translatedText } = await generateText({
      model: openai("gpt-4o"),
      system:
        "You are a professional translator. Translate the text accurately while preserving the original meaning, tone, and nuance.",
      prompt: `Translate the following text to ${languageName}:\n\n${text}`,
    })

    return NextResponse.json({ result: translatedText })
  } catch (error) {
    console.error("Translation error:", error)
    return NextResponse.json({ error: "Failed to translate text" }, { status: 500 })
  }
}

