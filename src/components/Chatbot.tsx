"use client";

import { useEffect, useRef, useState } from "react";
import { business, menu } from "@/data/site-config";

type Msg = { role: "user" | "bot"; text: string };

const currency = (n: number) => `${business.currency} ${n.toLocaleString()}`;

function menuList() {
  return menu
    .map((c) => `${c.name}: ` + c.items.map((i) => `${i.name} (${currency(i.price)})`).join(", "))
    .join("\n");
}

function reply(raw: string): string {
  const q = raw.toLowerCase();

  if (/\b(hi|hello|hey|salam|assalam)\b/.test(q))
    return `Hey! Welcome to ${business.name} 👋 Ask me about our menu, prices, hours, location, or how to order.`;

  if (/menu|what.*(have|offer)|items/.test(q))
    return `Here's what we've got:\n${menuList()}`;

  if (/price|cost|how much|rate/.test(q))
    return `Prices range from ${currency(420)} to ${currency(1350)}. Ask me about a specific item for its exact price!`;

  if (/recommend|suggest|best|popular/.test(q))
    return `I'd recommend the Zee Smash Burger (${currency(890)}) or our Loaded Pepperoni pizza (${currency(1350)}) — customer favorites! Craving something sweet? Try the Molten Lava Cake.`;

  if (/hour|open|close|timing/.test(q))
    return `We're open ${business.hours}. Come hungry any time!`;

  if (/location|address|where|direction|find/.test(q))
    return `You'll find us at ${business.address}. Tap "Find Us" on the site for directions.`;

  if (/contact|phone|number|call|whatsapp/.test(q))
    return `You can reach us at ${business.phone}, or message us on WhatsApp anytime.`;

  if (/reserv|table|book/.test(q))
    return `To reserve a table, scroll to the "Reserve a Table" section, pick your date, time, and number of guests, then hit Request Reservation. We'll confirm shortly!`;

  if (/order|delivery|deliver|pickup|checkout/.test(q))
    return `Ordering is easy — browse the menu, hit "Add to Cart", then head to "Your Order" to choose Delivery or Pickup and confirm. Delivery charge is ${currency(business.delivery.charge)} (free over ${currency(business.delivery.freeDeliveryOver)}), min order ${currency(business.delivery.minOrder)}.`;

  if (/midnight|deal|discount|offer/.test(q))
    return `Check out our 🌙 Midnight Deal — special late-night discounts, active daily 12:00 AM–3:00 AM!`;

  if (/thank/.test(q)) return `Anytime! Enjoy your meal at ${business.name} 🍔`;

  return `I can help with our menu, prices, recommendations, hours, location, contact info, reservations, and ordering. Try asking one of those!`;
}

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    { role: "bot", text: `Hi! I'm the ${business.name} assistant. How can I help — menu, prices, hours, location, or ordering?` },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [speakingIndex, setSpeakingIndex] = useState<number | null>(null);
  const [autoVoice, setAutoVoice] = useState(true);
  const endRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const viaVoiceRef = useRef(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (open) endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open, loading]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    const history = messages.slice(-6);
    const botIndex = messages.length + 1;
    const spokenRequest = viaVoiceRef.current;
    viaVoiceRef.current = false;
    setMessages((m) => [...m, { role: "user", text }]);
    setInput("");
    setLoading(true);
    let botText: string;
    try {
      const res = await fetch("/api/v1/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history }),
      });
      const json = await res.json();
      botText = json.success ? json.data.reply : reply(text);
    } catch {
      botText = reply(text);
    }
    setMessages((m) => [...m, { role: "bot", text: botText }]);
    setLoading(false);
    if (autoVoice && spokenRequest) toggleSpeak(botText, botIndex);
  }

  function getVoicesReady(): Promise<SpeechSynthesisVoice[]> {
    const existing = window.speechSynthesis.getVoices();
    if (existing.length) return Promise.resolve(existing);
    // Voices load asynchronously — without this wait, the very first speak
    // call (often the auto-spoken reply to a voice question) sees an empty
    // list and silently falls back to the browser's default English voice.
    return new Promise((resolve) => {
      const onReady = () => {
        window.speechSynthesis.removeEventListener("voiceschanged", onReady);
        resolve(window.speechSynthesis.getVoices());
      };
      window.speechSynthesis.addEventListener("voiceschanged", onReady);
      setTimeout(() => resolve(window.speechSynthesis.getVoices()), 1000);
    });
  }

  function speakWithVoice(text: string, voice: SpeechSynthesisVoice | undefined, lang: string) {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setSpeakingIndex(null);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 1;
    if (voice) utterance.voice = voice;
    utterance.lang = lang;
    utterance.onend = () => setSpeakingIndex(null);
    utterance.onerror = () => setSpeakingIndex(null);
    window.speechSynthesis.speak(utterance);
  }

  async function toggleSpeak(text: string, index: number) {
    if (speakingIndex === index) {
      audioRef.current?.pause();
      window.speechSynthesis?.cancel();
      setSpeakingIndex(null);
      return;
    }
    audioRef.current?.pause();
    window.speechSynthesis?.cancel();
    setSpeakingIndex(index);

    const isUrduScript = /[؀-ۿ]/.test(text);
    const lang = isUrduScript ? "ur-PK" : "en-US";
    const voices = await getVoicesReady();
    const localVoice = isUrduScript
      ? voices.find((v) => /^ur/i.test(v.lang)) ?? voices.find((v) => /^pa/i.test(v.lang)) ?? voices.find((v) => /^(hi|ar)/i.test(v.lang))
      : voices.find((v) => /en-US|en-GB/.test(v.lang) && /Google|Natural|Female/i.test(v.name)) ?? voices.find((v) => v.lang.startsWith("en"));

    // Fast path: a matching voice is already installed on this device — speak
    // instantly with zero network round-trip, no server quota involved.
    if (localVoice) {
      speakWithVoice(text, localVoice, lang);
      return;
    }

    // No matching local voice (e.g. no Urdu pack on this device) — try
    // server-side TTS as a best-effort enhancement (limited daily quota).
    try {
      const res = await fetch("/api/v1/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const json = await res.json();
      if (json.success) {
        const audio = new Audio(`data:${json.data.mimeType};base64,${json.data.audio}`);
        audioRef.current = audio;
        audio.onended = () => setSpeakingIndex(null);
        audio.onerror = () => speakWithVoice(text, undefined, lang);
        await audio.play();
        return;
      }
    } catch {
      // fall through to local fallback below
    }
    speakWithVoice(text, undefined, lang);
  }

  function toggleVoice() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      setVoiceError("Voice input isn't supported in this browser.");
      return;
    }
    if (listening) {
      recognitionRef.current?.stop();
      return;
    }
    setVoiceError(null);
    const recognition = new SR();
    recognition.lang = "ur-PK";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onstart = () => setListening(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (e: any) => {
      setInput(e.results[0][0].transcript);
      viaVoiceRef.current = true;
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onerror = (e: any) => {
      const messages: Record<string, string> = {
        "not-allowed": "Microphone access denied. Please allow it in your browser settings.",
        "service-not-allowed": "Microphone access denied. Please allow it in your browser settings.",
        "no-speech": "Didn't catch that — try speaking again.",
        "audio-capture": "No microphone found.",
        network: "Network error. Please try again.",
      };
      setVoiceError(messages[e.error] || "Voice input failed. Please try again.");
      setListening(false);
    };
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    recognition.start();
  }

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close chat" : "Open chat"}
        className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-amber-700 text-white shadow-lg transition hover:bg-amber-800 sm:bottom-6 sm:right-6"
      >
        {open ? (
          <svg viewBox="0 0 24 24" fill="none" strokeWidth={2} stroke="currentColor" className="h-6 w-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" strokeWidth={2} stroke="currentColor" className="h-6 w-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h8M8 14h5M21 12c0 4.418-4.03 8-9 8-1.06 0-2.077-.163-3.02-.463L3 21l1.395-4.185C3.512 15.463 3 13.79 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8Z" />
          </svg>
        )}
      </button>

      {open && (
        <div className="fixed inset-x-3 bottom-22 z-50 flex h-[70vh] max-h-[560px] flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-2xl sm:inset-auto sm:right-6 sm:bottom-24 sm:w-96">
          <div className="flex items-center justify-between bg-amber-700 px-4 py-3 text-white">
            <div>
              <p className="font-bold leading-tight">{business.name}</p>
              <p className="text-xs text-amber-100">Ask me anything</p>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  setAutoVoice((v) => !v);
                  if (autoVoice) {
                    audioRef.current?.pause();
                    window.speechSynthesis?.cancel();
                    setSpeakingIndex(null);
                  }
                }}
                aria-label={autoVoice ? "Turn off auto voice replies" : "Turn on auto voice replies"}
                title={autoVoice ? "Auto voice replies: ON" : "Auto voice replies: OFF"}
                className={`rounded-full p-1.5 ${autoVoice ? "bg-white text-amber-700" : "hover:bg-amber-800"}`}
              >
                {autoVoice ? (
                  <svg viewBox="0 0 24 24" fill="none" strokeWidth={2} stroke="currentColor" className="h-4 w-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5 6 9H3v6h3l5 4V5Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.5 8.5a5 5 0 0 1 0 7" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" strokeWidth={2} stroke="currentColor" className="h-4 w-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5 6 9H3v6h3l5 4V5Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 9l4 6M20 9l-4 6" />
                  </svg>
                )}
              </button>
              <button
                onClick={() => {
                  audioRef.current?.pause();
                  window.speechSynthesis?.cancel();
                  setSpeakingIndex(null);
                  setOpen(false);
                }}
                aria-label="Close chat"
                className="rounded-full p-1 hover:bg-amber-800"
              >
                <svg viewBox="0 0 24 24" fill="none" strokeWidth={2} stroke="currentColor" className="h-5 w-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto bg-stone-50 p-4">
            {messages.map((m, i) => (
              <div key={i} className={`flex items-end gap-1 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] whitespace-pre-line rounded-2xl px-3 py-2 text-sm ${
                    m.role === "user"
                      ? "rounded-br-sm bg-amber-700 text-white"
                      : "rounded-bl-sm bg-white text-stone-800 shadow"
                  }`}
                >
                  {m.text}
                </div>
                {m.role === "bot" && (
                  <button
                    onClick={() => toggleSpeak(m.text, i)}
                    aria-label={speakingIndex === i ? "Stop reading aloud" : "Read message aloud"}
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                      speakingIndex === i ? "bg-amber-700 text-white" : "text-stone-400 hover:text-amber-700"
                    }`}
                  >
                    {speakingIndex === i ? (
                      <svg viewBox="0 0 24 24" fill="currentColor" className="h-3 w-3">
                        <rect x="6" y="6" width="12" height="12" rx="1" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" strokeWidth={2} stroke="currentColor" className="h-4 w-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5 6 9H3v6h3l5 4V5Z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.5 8.5a5 5 0 0 1 0 7M18.5 6a9 9 0 0 1 0 12" />
                      </svg>
                    )}
                  </button>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="flex gap-1 rounded-2xl rounded-bl-sm bg-white px-3 py-3 shadow">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-stone-400 [animation-delay:-0.3s]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-stone-400 [animation-delay:-0.15s]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-stone-400" />
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          <div className="border-t border-stone-200 bg-white p-3">
            {voiceError && <p className="mb-2 px-1 text-xs text-red-600">{voiceError}</p>}
            {listening && <p className="mb-2 px-1 text-xs text-amber-700">🎤 Listening… speak now</p>}
            <div className="flex items-center gap-2">
              <input
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  viaVoiceRef.current = false;
                }}
                onKeyDown={(e) => e.key === "Enter" && send()}
                placeholder="Type a message…"
                className="flex-1 rounded-full border border-stone-300 px-4 py-2 text-sm outline-none focus:border-amber-700"
              />
              <button
                onClick={toggleVoice}
                aria-label={listening ? "Stop voice input" : "Start voice input"}
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition ${
                  listening ? "animate-pulse bg-red-600 text-white" : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                }`}
              >
                <svg viewBox="0 0 24 24" fill="none" strokeWidth={2} stroke="currentColor" className="h-4 w-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v3" />
                </svg>
              </button>
              <button
                onClick={send}
              disabled={!input.trim() || loading}
              aria-label="Send message"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-700 text-white hover:bg-amber-800 disabled:opacity-40"
            >
                <svg viewBox="0 0 24 24" fill="none" strokeWidth={2} stroke="currentColor" className="h-4 w-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5 19.5 12 4.5 4.5 6 11l-1.5 8.5ZM6 11h9" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
