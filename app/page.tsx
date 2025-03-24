"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Upload, AlertCircle, BookOpen, RefreshCw, Copy, Check, Edit, Save } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { AuthStatus } from "@/components/auth-status"
import { useSession } from "next-auth/react"

export default function TranslatorSummarizerApp() {
  const { data: session } = useSession()
  const [inputText, setInputText] = useState("")
  const [outputText, setOutputText] = useState("")
  const [language, setLanguage] = useState("id")
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("translate")
  const [error, setError] = useState<string | null>(null)
  const [isExtracting, setIsExtracting] = useState(false)
  const [isEditingOutput, setIsEditingOutput] = useState(false)
  const [isCopied, setIsCopied] = useState({ input: false, output: false })

  // English learning state
  const [englishLevel, setEnglishLevel] = useState("beginner")
  const [learningContent, setLearningContent] = useState<any>(null)
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({})
  const [quizResults, setQuizResults] = useState<Record<string, boolean>>({})
  const [showQuizResults, setShowQuizResults] = useState(false)
  const [isFromCache, setIsFromCache] = useState(false)

  const handleTranslate = async () => {
    if (!inputText.trim()) return

    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/translate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: inputText,
          targetLanguage: language,
        }),
      })

      if (!response.ok) {
        throw new Error("Translation failed")
      }

      const data = await response.json()
      setOutputText(data.result)
    } catch (error) {
      console.error("Translation error:", error)
      setError("An error occurred during translation. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSummarize = async () => {
    if (!inputText.trim()) return

    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/summarize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: inputText,
        }),
      })

      if (!response.ok) {
        throw new Error("Summarization failed")
      }

      const data = await response.json()
      setOutputText(data.result)
    } catch (error) {
      console.error("Summarization error:", error)
      setError("An error occurred during summarization. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    setOutputText("")
    setError(null)
    setLearningContent(null)
    setQuizAnswers({})
    setQuizResults({})
    setShowQuizResults(false)
    setIsFromCache(false)
  }

  const handleProcess = () => {
    if (activeTab === "translate") {
      handleTranslate()
    } else if (activeTab === "summarize") {
      handleSummarize()
    } else if (activeTab === "learn") {
      handleGetLearningContent()
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check file type
    if (file.type !== "application/pdf") {
      setError("Only PDF files are supported")
      e.target.value = ""
      return
    }

    // Check file size (2MB = 2 * 1024 * 1024 bytes)
    if (file.size > 2 * 1024 * 1024) {
      setError("File size exceeds the 2MB limit")
      e.target.value = ""
      return
    }

    setIsExtracting(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append("pdf", file)

      const response = await fetch("/api/extract-pdf", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Failed to extract text from PDF")
      }

      const data = await response.json()
      setInputText(data.text)
    } catch (error) {
      console.error("PDF extraction error:", error)
      setError("Failed to extract text from the PDF. The file might be corrupted or password-protected.")
    } finally {
      setIsExtracting(false)
      e.target.value = ""
    }
  }

  const handleGetLearningContent = async (forceRegenerate = false) => {
    setIsLoading(true)
    setError(null)

    if (forceRegenerate) {
      setLearningContent(null)
      setQuizAnswers({})
      setQuizResults({})
      setShowQuizResults(false)
    }

    try {
      const response = await fetch("/api/learn-english", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          level: englishLevel,
          forceRegenerate,
          userId: session?.user?.id, // Include user ID for personalized content
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to get learning content")
      }

      const data = await response.json()
      setLearningContent(data)
      setIsFromCache(data.fromCache || false)
    } catch (error) {
      console.error("Learning content error:", error)
      setError("An error occurred while fetching learning content. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleQuizAnswer = (questionId: string, answer: string) => {
    setQuizAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }))
  }

  const handleSubmitQuiz = () => {
    if (!learningContent?.quiz) return

    const results: Record<string, boolean> = {}

    learningContent.quiz.forEach((question: any, index: number) => {
      const questionId = `q${index}`
      const userAnswer = quizAnswers[questionId]
      results[questionId] = userAnswer === question.correctAnswer
    })

    setQuizResults(results)
    setShowQuizResults(true)
  }

  const calculateQuizScore = () => {
    if (!learningContent?.quiz) return 0

    const totalQuestions = learningContent.quiz.length
    const correctAnswers = Object.values(quizResults).filter((result) => result).length

    return Math.round((correctAnswers / totalQuestions) * 100)
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return ""
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  const copyToClipboard = async (text: string, type: "input" | "output") => {
    try {
      await navigator.clipboard.writeText(text)
      setIsCopied({ ...isCopied, [type]: true })

      // Reset the copied state after 2 seconds
      setTimeout(() => {
        setIsCopied({ ...isCopied, [type]: false })
      }, 2000)
    } catch (err) {
      console.error("Failed to copy text: ", err)
    }
  }

  const renderTranslateTab = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-medium">Input Text</label>
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(inputText, "input")}
                  disabled={!inputText.trim()}
                >
                  {isCopied.input ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isCopied.input ? "Copied!" : "Copy to clipboard"}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <div className="relative">
            <input
              type="file"
              id="pdf-upload"
              accept=".pdf"
              className="sr-only"
              onChange={handleFileUpload}
              disabled={isExtracting}
            />
            <label
              htmlFor="pdf-upload"
              className="inline-flex items-center px-3 py-1 text-xs bg-muted hover:bg-muted/80 rounded-md cursor-pointer"
            >
              {isExtracting ? (
                <>
                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                  Extracting...
                </>
              ) : (
                <>
                  <Upload className="mr-1 h-3 w-3" />
                  Upload PDF (Max 2MB)
                </>
              )}
            </label>
          </div>
        </div>
      </div>

      <div className="border rounded-md">
        <Textarea
          placeholder="Enter your text here or upload a PDF..."
          className="min-h-[250px] resize-y border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
        />
        <div className="flex items-center justify-between p-2 border-t bg-muted/50">
          <div className="text-xs text-muted-foreground">{inputText.length} characters</div>
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" onClick={() => setInputText("")} disabled={!inputText.trim()}>
              Clear
            </Button>
          </div>
        </div>
      </div>

      <div>
        <Select value={language} onValueChange={setLanguage}>
          <SelectTrigger>
            <SelectValue placeholder="Select language" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="id">Indonesian</SelectItem>
            <SelectItem value="en">English</SelectItem>
            <SelectItem value="es">Spanish</SelectItem>
            <SelectItem value="fr">French</SelectItem>
            <SelectItem value="de">German</SelectItem>
            <SelectItem value="ja">Japanese</SelectItem>
            <SelectItem value="zh">Chinese</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button className="w-full" onClick={handleTranslate} disabled={isLoading || isExtracting || !inputText.trim()}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Translating...
          </>
        ) : (
          "Translate"
        )}
      </Button>

      {outputText && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <div className="font-medium">Result:</div>
            <div className="flex items-center gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="sm" onClick={() => copyToClipboard(outputText, "output")}>
                      {isCopied.output ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{isCopied.output ? "Copied!" : "Copy to clipboard"}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <Button variant="ghost" size="sm" onClick={() => setIsEditingOutput(!isEditingOutput)}>
                {isEditingOutput ? <Save className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="border rounded-md">
            {isEditingOutput ? (
              <Textarea
                className="min-h-[200px] resize-y border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                value={outputText}
                onChange={(e) => setOutputText(e.target.value)}
              />
            ) : (
              <div
                className="p-4 rounded-md bg-muted whitespace-pre-wrap min-h-[200px] overflow-auto"
                onClick={() => setIsEditingOutput(true)}
              >
                {outputText}
              </div>
            )}
            <div className="flex items-center justify-between p-2 border-t bg-muted/50">
              <div className="text-xs text-muted-foreground">{outputText.length} characters</div>
              <div className="flex gap-1">
                {isEditingOutput && (
                  <Button variant="ghost" size="sm" onClick={() => setOutputText("")} disabled={!outputText.trim()}>
                    Clear
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  const renderSummarizeTab = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-medium">Input Text</label>
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(inputText, "input")}
                  disabled={!inputText.trim()}
                >
                  {isCopied.input ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isCopied.input ? "Copied!" : "Copy to clipboard"}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <div className="relative">
            <input
              type="file"
              id="pdf-upload-summary"
              accept=".pdf"
              className="sr-only"
              onChange={handleFileUpload}
              disabled={isExtracting}
            />
            <label
              htmlFor="pdf-upload-summary"
              className="inline-flex items-center px-3 py-1 text-xs bg-muted hover:bg-muted/80 rounded-md cursor-pointer"
            >
              {isExtracting ? (
                <>
                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                  Extracting...
                </>
              ) : (
                <>
                  <Upload className="mr-1 h-3 w-3" />
                  Upload PDF (Max 2MB)
                </>
              )}
            </label>
          </div>
        </div>
      </div>

      <div className="border rounded-md">
        <Textarea
          placeholder="Enter your text here or upload a PDF..."
          className="min-h-[250px] resize-y border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
        />
        <div className="flex items-center justify-between p-2 border-t bg-muted/50">
          <div className="text-xs text-muted-foreground">{inputText.length} characters</div>
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" onClick={() => setInputText("")} disabled={!inputText.trim()}>
              Clear
            </Button>
          </div>
        </div>
      </div>

      <Button className="w-full" onClick={handleSummarize} disabled={isLoading || isExtracting || !inputText.trim()}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Summarizing...
          </>
        ) : (
          "Summarize"
        )}
      </Button>

      {outputText && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <div className="font-medium">Result:</div>
            <div className="flex items-center gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="sm" onClick={() => copyToClipboard(outputText, "output")}>
                      {isCopied.output ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{isCopied.output ? "Copied!" : "Copy to clipboard"}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <Button variant="ghost" size="sm" onClick={() => setIsEditingOutput(!isEditingOutput)}>
                {isEditingOutput ? <Save className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="border rounded-md">
            {isEditingOutput ? (
              <Textarea
                className="min-h-[200px] resize-y border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                value={outputText}
                onChange={(e) => setOutputText(e.target.value)}
              />
            ) : (
              <div
                className="p-4 rounded-md bg-muted whitespace-pre-wrap min-h-[200px] overflow-auto"
                onClick={() => setIsEditingOutput(true)}
              >
                {outputText}
              </div>
            )}
            <div className="flex items-center justify-between p-2 border-t bg-muted/50">
              <div className="text-xs text-muted-foreground">{outputText.length} characters</div>
              <div className="flex gap-1">
                {isEditingOutput && (
                  <Button variant="ghost" size="sm" onClick={() => setOutputText("")} disabled={!outputText.trim()}>
                    Clear
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  const renderLearnEnglishTab = () => (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium mb-2 block">Select Your English Level</label>
        <Select value={englishLevel} onValueChange={setEnglishLevel}>
          <SelectTrigger>
            <SelectValue placeholder="Select level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="beginner">Beginner</SelectItem>
            <SelectItem value="intermediate">Intermediate</SelectItem>
            <SelectItem value="advanced">Advanced</SelectItem>
            <SelectItem value="expert">Expert</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-2">
        <Button className="flex-1" onClick={() => handleGetLearningContent(false)} disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading Content...
            </>
          ) : (
            <>
              <BookOpen className="mr-2 h-4 w-4" />
              Get Learning Materials
            </>
          )}
        </Button>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" onClick={() => handleGetLearningContent(true)} disabled={isLoading}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Generate new content</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {learningContent && (
        <div className="mt-4 space-y-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xl font-bold">{learningContent.title}</h3>
              <div className="flex items-center gap-2">
                {isFromCache && (
                  <Badge variant="outline" className="text-xs">
                    Cached
                  </Badge>
                )}
                {learningContent.generatedAt && (
                  <span className="text-xs text-muted-foreground">
                    Generated: {formatDate(learningContent.generatedAt)}
                  </span>
                )}
              </div>
            </div>
            <p className="text-muted-foreground mb-4">{learningContent.description}</p>
          </div>

          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="vocabulary">
              <AccordionTrigger>Vocabulary</AccordionTrigger>
              <AccordionContent>
                <div className="grid gap-2">
                  {learningContent.vocabulary.map((item: any, index: number) => (
                    <div key={index} className="p-3 bg-muted rounded-md">
                      <div className="font-medium">{item.word}</div>
                      <div className="text-sm text-muted-foreground">{item.definition}</div>
                      <div className="text-sm italic mt-1">Example: {item.example}</div>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="grammar">
              <AccordionTrigger>Grammar</AccordionTrigger>
              <AccordionContent>
                <div className="prose prose-sm max-w-none">
                  <h4 className="text-lg font-medium mb-2">{learningContent.grammar.title}</h4>
                  <p>{learningContent.grammar.explanation}</p>
                  <div className="mt-3 space-y-2">
                    <h5 className="font-medium">Examples:</h5>
                    <ul className="list-disc pl-5 space-y-1">
                      {learningContent.grammar.examples.map((example: string, index: number) => (
                        <li key={index}>{example}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="conversation">
              <AccordionTrigger>Conversation Practice</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground mb-2">{learningContent.conversation.context}</p>
                  <div className="space-y-2">
                    {learningContent.conversation.dialogue.map((line: any, index: number) => (
                      <div
                        key={index}
                        className={`p-2 rounded-md ${line.speaker === "Person A" ? "bg-muted" : "bg-primary/10"}`}
                      >
                        <span className="font-medium">{line.speaker}: </span>
                        {line.text}
                      </div>
                    ))}
                  </div>
                  <div className="mt-4">
                    <h5 className="font-medium mb-2">Key Phrases:</h5>
                    <ul className="list-disc pl-5 space-y-1">
                      {learningContent.conversation.keyPhrases.map((phrase: any, index: number) => (
                        <li key={index}>
                          <span className="font-medium">{phrase.phrase}</span> - {phrase.meaning}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="quiz">
              <AccordionTrigger>Quiz</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4">
                  {learningContent.quiz.map((question: any, index: number) => {
                    const questionId = `q${index}`
                    return (
                      <div key={index} className="p-3 border rounded-md">
                        <p className="font-medium mb-2">
                          {index + 1}. {question.question}
                        </p>
                        <RadioGroup
                          value={quizAnswers[questionId] || ""}
                          onValueChange={(value) => handleQuizAnswer(questionId, value)}
                          disabled={showQuizResults}
                        >
                          {question.options.map((option: string, optIndex: number) => (
                            <div key={optIndex} className="flex items-center space-x-2">
                              <RadioGroupItem value={option} id={`${questionId}-${optIndex}`} />
                              <Label htmlFor={`${questionId}-${optIndex}`} className="flex-1">
                                {option}
                                {showQuizResults && quizAnswers[questionId] === option && (
                                  <span
                                    className={`ml-2 ${quizResults[questionId] ? "text-green-500" : "text-red-500"}`}
                                  >
                                    {quizResults[questionId] ? "✓" : "✗"}
                                  </span>
                                )}
                              </Label>
                            </div>
                          ))}
                        </RadioGroup>
                        {showQuizResults && !quizResults[questionId] && (
                          <div className="mt-2 text-sm text-muted-foreground">
                            Correct answer: <span className="font-medium">{question.correctAnswer}</span>
                          </div>
                        )}
                      </div>
                    )
                  })}

                  <Button
                    onClick={handleSubmitQuiz}
                    disabled={showQuizResults || Object.keys(quizAnswers).length < (learningContent.quiz?.length || 0)}
                    className="w-full"
                  >
                    Submit Answers
                  </Button>

                  {showQuizResults && (
                    <div className="p-4 bg-muted rounded-md text-center">
                      <h4 className="font-bold text-lg mb-1">Quiz Results</h4>
                      <div className="text-3xl font-bold mb-2">{calculateQuizScore()}%</div>
                      <p className="text-muted-foreground">
                        You got {Object.values(quizResults).filter((result) => result).length} out of{" "}
                        {learningContent.quiz.length} questions correct.
                      </p>
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      )}
    </div>
  )

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex justify-end p-4">
        <AuthStatus />
      </div>
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-5xl">
          <CardHeader>
            <CardTitle>AI Text Processor & English Learning</CardTitle>
            <CardDescription>
              Translate text, generate summaries, or learn English from beginner to expert level
            </CardDescription>
            <div className="mt-2 text-sm text-amber-600 dark:text-amber-400">
              <strong>Note:</strong> This application requires an OpenAI API key set as the OPENAI_API_KEY environment
              variable.
            </div>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Tabs value={activeTab} onValueChange={handleTabChange}>
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="translate">Translate</TabsTrigger>
                <TabsTrigger value="summarize">Summarize</TabsTrigger>
                <TabsTrigger value="learn">Learn English</TabsTrigger>
              </TabsList>

              {activeTab === "translate" && renderTranslateTab()}
              {activeTab === "summarize" && renderSummarizeTab()}
              {activeTab === "learn" && renderLearnEnglishTab()}
            </Tabs>
          </CardContent>
          <CardFooter className="text-sm text-muted-foreground">Powered by OpenAI and the AI SDK</CardFooter>
        </Card>
      </div>
    </div>
  )
}

