import { NextRequest, NextResponse } from "next/server";

const TTS_MODEL = "gemini-2.5-flash-preview-tts";

// Wrap raw 16-bit PCM (as returned by the Gemini TTS API) in a minimal WAV
// header so the browser's <audio> element can play it directly.
function pcmToWav(pcmBase64: string, sampleRate: number): string {
  const pcm = Buffer.from(pcmBase64, "base64");
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(1, 22); // mono
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * 2, 28); // byte rate (16-bit mono)
  header.writeUInt16LE(2, 32); // block align
  header.writeUInt16LE(16, 34); // bits per sample
  header.write("data", 36);
  header.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([header, pcm]).toString("base64");
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, data: null, error: "BAD_REQUEST", message: "Invalid JSON body." },
      { status: 400 }
    );
  }

  const text = ((body as { text?: string })?.text ?? "").toString().trim().slice(0, 1000);
  if (!text) {
    return NextResponse.json(
      { success: false, data: null, error: "BAD_REQUEST", message: "Text is required." },
      { status: 400 }
    );
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { success: false, data: null, error: "AI_NOT_CONFIGURED", message: "TTS backend is not configured." },
      { status: 200 }
    );
  }

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${TTS_MODEL}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text }] }],
          generationConfig: {
            responseModalities: ["AUDIO"],
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: "Kore" } } },
          },
        }),
      }
    );

    if (!res.ok) {
      return NextResponse.json(
        { success: false, data: null, error: "TTS_UPSTREAM_ERROR", message: "TTS service is unavailable right now." },
        { status: 200 }
      );
    }

    const json = await res.json();
    const part = json?.candidates?.[0]?.content?.parts?.[0]?.inlineData;
    const pcmBase64: string | undefined = part?.data;
    const mimeType: string = part?.mimeType ?? "";
    if (!pcmBase64) {
      return NextResponse.json(
        { success: false, data: null, error: "TTS_EMPTY_RESPONSE", message: "TTS gave no audio." },
        { status: 200 }
      );
    }

    const rateMatch = /rate=(\d+)/.exec(mimeType);
    const sampleRate = rateMatch ? parseInt(rateMatch[1], 10) : 24000;
    const wavBase64 = pcmToWav(pcmBase64, sampleRate);

    return NextResponse.json({ success: true, data: { audio: wavBase64, mimeType: "audio/wav" }, error: null, message: "OK" });
  } catch {
    return NextResponse.json(
      { success: false, data: null, error: "TTS_REQUEST_FAILED", message: "Could not reach TTS service." },
      { status: 200 }
    );
  }
}
