import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const pdfFile = formData.get("pdf") as File | null

    if (!pdfFile) {
      return NextResponse.json({ error: "No PDF file provided" }, { status: 400 })
    }

    // Check file type
    if (pdfFile.type !== "application/pdf") {
      return NextResponse.json({ error: "Only PDF files are supported" }, { status: 400 })
    }

    // Check file size (2MB = 2 * 1024 * 1024 bytes)
    if (pdfFile.size > 2 * 1024 * 1024) {
      return NextResponse.json({ error: "File size exceeds the 2MB limit" }, { status: 400 })
    }

    // Convert the file to an ArrayBuffer
    const arrayBuffer = await pdfFile.arrayBuffer()

    // Import the pdf.js library dynamically
    const pdfjsLib = await import("pdfjs-dist")

    // Set the worker source
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`

    // Load the PDF document
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer })
    const pdf = await loadingTask.promise

    // Extract text from all pages
    let extractedText = ""
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i)
      const textContent = await page.getTextContent()
      const pageText = textContent.items.map((item: any) => item.str).join(" ")

      extractedText += pageText + "\n\n"
    }

    return NextResponse.json({ text: extractedText.trim() })
  } catch (error) {
    console.error("PDF extraction error:", error)
    return NextResponse.json({ error: "Failed to extract text from PDF" }, { status: 500 })
  }
}

