import { NextRequest, NextResponse } from "next/server";
import cerebras, { SYSTEM_PROMPT } from "@/lib/cerebras";

export const runtime = "edge";

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

export async function POST(req: NextRequest) {
  try {
    const { messages, geolocation } = (await req.json()) as {
      messages: Message[];
      geolocation?: Record<string, unknown>;
    };

    // Build a context-aware system prompt with geolocation data
    let systemPrompt = SYSTEM_PROMPT;
    if (geolocation && typeof geolocation === "object") {
      systemPrompt += `\n\n## Current User Geolocation Context:\nThe following is the real-time geolocation data for the current user. Use this when they ask about their location, IP, or related details:\n\`\`\`json\n${JSON.stringify(geolocation, null, 2)}\n\`\`\``;
    }

    const response = await cerebras.chat.completions.create({
      model: "llama3.1-8b",
      messages: [{ role: "system", content: systemPrompt }, ...messages],
      temperature: 0.7,
      max_completion_tokens: 4096,
      stream: true,
    });

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of response) {
            const content = chunk.choices[0]?.delta?.content;
            if (content) {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ content })}\n\n`)
              );
            }
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (error) {
          console.error("Stream error:", error);
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ error: "Stream error" })}\n\n`
            )
          );
          controller.close();
        }
      },
    });

    return new NextResponse(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Chat API error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to generate response: ${errorMessage}` },
      { status: 500 }
    );
  }
}
