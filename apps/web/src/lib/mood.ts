export type Mood = "happy" | "sad" | "angry" | "anxious" | "calm" | "neutral";

export const moodColors: Record<Mood, string> = {
  happy: "#f2c96f",
  sad: "#7a8fb8",
  angry: "#d06d62",
  anxious: "#9b8ad8",
  calm: "#7ab8a4",
  neutral: "#9aa0a6",
};

export const fallbackByMood: Record<Mood, string> = {
  happy: "Nuvvu share chesina vibe chala bagundi. Inka cheppu, I'm listening.",
  sad: "Nenu ikkade unna. Konchem deep breath teesukundam, step by step veldaam.",
  angry: "Ardam ayindi, that feels heavy. Oka calm pause tiskoni taruvata clear ga plan cheddam.",
  anxious: "It's okay, tension padaku. Manam chinna steps lo sort cheddam.",
  calm: "Nice and steady. Ee calm space lo inka clarity create cheddam.",
  neutral: "I'm here with you. Emaina share cheyyi, we can figure it out together.",
};

const supportiveOpeners = [
  "Nenu vinthunna,",
  "I hear you,",
  "Ardam ayindi,",
  "Thanks for sharing,",
];

const followUpQuestions = [
  "inka konchem detail ga chepthava?",
  "first ga em part toughest anipisthundi?",
  "manam immediate next step decide cheddama?",
  "nuvvu ipudu ela feel avutunnavo one line lo cheppu?",
];

const examSupport = [
  "Exam ki quick plan cheddam: 25 mins study + 5 mins break, 3 cycles start chey.",
  "Important topics list create chesi, first high-weightage ni cover cheddam.",
  "Oka mini revision sprint start chey, nenu niku checklist style lo help chestha.",
];

const varied = <T>(list: T[], seed: number) => list[Math.abs(seed) % list.length];

export const buildCompanionFallback = (message: string, mood: Mood): string => {
  const seed = [...message].reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const lower = message.toLowerCase();

  if (/(exam|revision|study|test|interview)/.test(lower)) {
    return `${varied(supportiveOpeners, seed)} ${varied(examSupport, seed + 3)} ${varied(
      followUpQuestions,
      seed + 1,
    )}`;
  }

  return `${varied(supportiveOpeners, seed)} ${fallbackByMood[mood]} ${varied(
    followUpQuestions,
    seed + 2,
  )}`;
};
