import { NextResponse } from "next/server";
import { Mood, buildCompanionFallback } from "@/lib/mood";

type ChatResponse = {
  reply: string;
  mood: Mood;
};

const HF_URL = "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2";
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
type HistoryMessage = { role: "user" | "assistant"; text: string };

const inferMood = (text: string): Mood => {
  const normalized = text.toLowerCase();
  if (/(happy|awesome|great|excited|good)/.test(normalized)) return "happy";
  if (/(sad|down|cry|bad|hurt)/.test(normalized)) return "sad";
  if (/(angry|frustrated|rage|irritated)/.test(normalized)) return "angry";
  if (/(anxious|worry|nervous|panic|stress)/.test(normalized)) return "anxious";
  if (/(calm|peaceful|relaxed|stable)/.test(normalized)) return "calm";
  return "neutral";
};

const createFallback = (message: string): ChatResponse => {
  const mood = inferMood(message);
  return {
    reply: buildCompanionFallback(message, mood),
    mood,
  };
};

const extractReply = (payload: unknown): string | null => {
  if (Array.isArray(payload) && payload[0] && typeof payload[0] === "object") {
    const generated = (payload[0] as { generated_text?: string }).generated_text;
    if (generated) return generated;
  }
  if (payload && typeof payload === "object") {
    const generated = (payload as { generated_text?: string }).generated_text;
    if (generated) return generated;
  }
  return null;
};

const sanitizeReply = (reply: string): string => {
  return reply
    .replace(/<s>\[INST\][\s\S]*?\[\/INST\]/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
};

const buildPrompt = (message: string, history: HistoryMessage[]): string => {
  const recent = history
    .slice(-6)
    .map((entry) => `${entry.role === "user" ? "User" : "Aura"}: ${entry.text}`)
    .join("\n");

  return `<s>[INST] You are Aura+, a premium emotional AI companion.
Respond in calm, warm Telugu + English mixed tone.
Be human, emotionally intelligent, concise and practical.
If user asks for help (study/career/life), give a clear next step.
Never repeat same sentence again and again.

Recent conversation:
${recent || "No previous context"}

Current User message: ${message}
[/INST]`;
};

const callHuggingFace = async (apiKey: string, prompt: string): Promise<string | null> => {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const response = await fetch(HF_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          max_new_tokens: 220,
          temperature: 0.82,
          top_p: 0.9,
          repetition_penalty: 1.12,
          return_full_text: false,
        },
      }),
    });

    if (!response.ok) return null;
    const data = (await response.json()) as unknown;

    if (data && typeof data === "object" && "error" in data) {
      const errorMessage = String((data as { error?: unknown }).error ?? "");
      if (errorMessage.toLowerCase().includes("loading") && attempt === 0) {
        await sleep(1600);
        continue;
      }
      return null;
    }

    const raw = extractReply(data);
    if (!raw) return null;
    const cleaned = sanitizeReply(raw);
    return cleaned || null;
  }

  return null;
};

export async function POST(request: Request) {
  try {
    const { message, history } = (await request.json()) as {
      message?: string;
      history?: HistoryMessage[];
    };
    const trimmedMessage = message?.trim();

    if (!trimmedMessage) {
      return NextResponse.json(createFallback("neutral"));
    }

    const mood = inferMood(trimmedMessage);
    const prompt = buildPrompt(trimmedMessage, Array.isArray(history) ? history : []);
    const apiKey =
      process.env.HUGGINGFACE_API_KEY ||
      process.env.HF_API_KEY ||
      process.env.HUGGINGFACEHUB_API_TOKEN;

    if (!apiKey) {
      return NextResponse.json(createFallback(trimmedMessage));
    }
    const modelReply = await callHuggingFace(apiKey, prompt);

    return NextResponse.json({
      reply: modelReply ?? buildCompanionFallback(trimmedMessage, mood),
      mood,
    } satisfies ChatResponse);
  } catch {
    return NextResponse.json(
      {
        reply: buildCompanionFallback("I need support", "neutral"),
        mood: "neutral",
      } satisfies ChatResponse,
    );
  }
}