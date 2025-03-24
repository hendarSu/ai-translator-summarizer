import { generateText } from "ai"
import { createOpenAI } from "@ai-sdk/openai"
import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"
import { getServerSession } from "next-auth"
import { authOptions } from "../auth/[...nextauth]/route"

// Check if OpenAI API key is available
if (!process.env.OPENAI_API_KEY) {
  console.error("OPENAI_API_KEY is not set in environment variables")
}

// Create OpenAI provider with explicit API key configuration
const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
})

// Define the content directory
const contentDir = path.join(process.cwd(), "content")

// Ensure the content directory exists
try {
  if (!fs.existsSync(contentDir)) {
    fs.mkdirSync(contentDir, { recursive: true })
  }
} catch (error) {
  console.error("Error creating content directory:", error)
}

export async function POST(request: Request) {
  try {
    // Get the user session
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id || "anonymous"

    const { level, forceRegenerate } = await request.json()

    if (!level) {
      return NextResponse.json({ error: "English proficiency level is required" }, { status: 400 })
    }

    // Create user-specific directory if authenticated
    const userDir = path.join(contentDir, userId)
    if (userId !== "anonymous" && !fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true })
    }

    // File path for this level's content (user-specific if authenticated)
    const contentFilePath =
      userId !== "anonymous"
        ? path.join(userDir, `${level}-content.json`)
        : path.join(contentDir, `${level}-content.json`)

    // Check if we already have content for this level and forceRegenerate is not true
    if (!forceRegenerate && fs.existsSync(contentFilePath)) {
      try {
        const fileContent = fs.readFileSync(contentFilePath, "utf8")
        const savedContent = JSON.parse(fileContent)

        // Return the saved content
        return NextResponse.json({
          ...savedContent,
          fromCache: true,
        })
      } catch (readError) {
        console.error("Error reading saved content:", readError)
        // If there's an error reading the file, we'll generate new content
      }
    }

    // Check if API key is available before generating new content
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OpenAI API key is not configured" }, { status: 500 })
    }

    const prompt = `
  Create a comprehensive English learning module for ${level} level students.
  The module should include:
  
  1. A title and brief description appropriate for the level
  2. Vocabulary section with 5 words, their definitions, and example sentences
  3. Grammar section with a concept appropriate for the level, explanation, and 3 examples
  4. Conversation practice with context, a dialogue between two people, and 3 key phrases with their meanings
  5. A quiz with 5 multiple-choice questions to test understanding
  
  Format the response as a JSON object with the following structure:
  {
    "title": "Title of the module",
    "description": "Brief description of what will be learned",
    "vocabulary": [
      { "word": "example", "definition": "definition here", "example": "example sentence" }
    ],
    "grammar": {
      "title": "Grammar concept",
      "explanation": "Explanation of the grammar rule",
      "examples": ["Example 1", "Example 2", "Example 3"]
    },
    "conversation": {
      "context": "Setting or situation for the conversation",
      "dialogue": [
        { "speaker": "Person A", "text": "What they say" },
        { "speaker": "Person B", "text": "Response" }
      ],
      "keyPhrases": [
        { "phrase": "Key phrase", "meaning": "What it means or how to use it" }
      ]
    },
    "quiz": [
      {
        "question": "Question text",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "correctAnswer": "The correct option"
      }
    ]
  }
  
  Make sure the content is appropriate for ${level} level English learners.
`

    const { text } = await generateText({
      model: openai("gpt-4o"),
      prompt: prompt,
    })

    // Parse the JSON response
    const cleanedJson = text.replace(/```json|```/g, "").trim()
    const learningContent = JSON.parse(cleanedJson)

    // Add timestamp and user info to the content
    const contentWithMetadata = {
      ...learningContent,
      generatedAt: new Date().toISOString(),
      level,
      userId,
    }

    // Save the content to a file
    try {
      fs.writeFileSync(contentFilePath, JSON.stringify(contentWithMetadata, null, 2), "utf8")
    } catch (writeError) {
      console.error("Error saving content to file:", writeError)
      // Continue even if saving fails
    }

    return NextResponse.json({
      ...contentWithMetadata,
      fromCache: false,
    })
  } catch (error) {
    console.error("English learning content error:", error)
    return NextResponse.json({ error: "Failed to generate English learning content" }, { status: 500 })
  }
}

