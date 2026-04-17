import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const message = body?.message;

    if (!message) {
      return NextResponse.json({
        reply: "Message empty undi mawa 😅",
        mood: "neutral",
      });
    }

    const HF_API_KEY = process.env.HUGGINGFACE_API_KEY;

    // ❗ API key check
    if (!HF_API_KEY) {
      return NextResponse.json({
        reply: "API key set cheyyaledu mawa 😅",
        mood: "neutral",
        moodConfidence: 0.5,
        suggestion: null,
        followUpPrompts: [],
        language: "mixed"
      });
    }

    const response = await fetch(
      "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${HF_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: `<s>[INST] You are Aura, an emotional AI companion.
Respond in a friendly Telugu + English tone.

User: ${message} [/INST]`,
        }),
      }
    );

    let data: any = null;

    try {
      data = await response.json();
    } catch (err) {
      console.error("JSON parse error:", err);
    }

    console.log("HF RESPONSE:", data);

    // ✅ SINGLE reply variable (FIXED)
    const reply =
      data?.[0]?.generated_text ||
      data?.generated_text ||
      "Hello, how can i help you...";

    return NextResponse.json({
      reply,
      mood: "neutral",
      moodConfidence: 0.7,
      suggestion: null,
      followUpPrompts: ["Tell me more", "Em jarigindhi?", "Continue cheppu"],
      language: "mixed",
    });

  } catch (error) {
    console.error("API ERROR:", error);

    return NextResponse.json({
      reply: "Koncham issue vachindi mawa… malli try cheddam.",
      mood: "neutral",
      moodConfidence: 0.5,
      suggestion: null,
      followUpPrompts: [],
      language: "mixed",
    });
  }
}