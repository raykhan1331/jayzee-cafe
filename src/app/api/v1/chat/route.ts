import { NextRequest, NextResponse } from "next/server";
import { business, menu } from "@/data/site-config";

const GEMINI_MODEL = "gemini-3.6-flash";

function cafeContext(): string {
  const menuText = menu
    .map(
      (c) =>
        `${c.name}:\n` +
        c.items
          .map(
            (i) =>
              `- ${i.name} — ${business.currency} ${i.price} — ${i.description} — ${
                i.available ? "available" : "currently unavailable"
              }`
          )
          .join("\n")
    )
    .join("\n\n");

  return `Cafe name: ${business.name}
Tagline: ${business.tagline}
About: ${business.description}
Opening hours: ${business.hours}
Address: ${business.address}
Phone: ${business.phone}
WhatsApp: ${business.phone}
Delivery charge: ${business.currency} ${business.delivery.charge}
Minimum order: ${business.currency} ${business.delivery.minOrder}
Free delivery over: ${business.currency} ${business.delivery.freeDeliveryOver}
Estimated delivery time: ${business.delivery.estimatedTime}
Delivery areas: ${business.delivery.areas.join(", ")}
Reservations: available via the "Reserve a Table" section on the website (date, time, guests).
Ordering: customers add items to cart on the website, choose delivery or pickup, and pay cash on delivery.

Menu:
${menuText}`;
}

const SYSTEM_PROMPT = `You are the official customer-support assistant for ${business.name}, a cafe. Answer customer questions using ONLY the cafe information provided below — never invent menu items, prices, ingredients, hours, or policies that are not listed.

If asked about something not covered in the provided information (e.g. specific ingredients or allergens not listed, unavailable items, anything outside this data), clearly say you don't have that information and suggest they call or WhatsApp the cafe at ${business.phone}.

Keep replies concise, warm, and customer-friendly — a few sentences at most, no long essays. Use the cafe's currency and exact prices when quoting.

CAFE INFORMATION:
${cafeContext()}`;

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

  const b = body as Partial<{ message: string; history: { role: "user" | "bot"; text: string }[] }>;
  const message = (b.message ?? "").toString().trim().slice(0, 1000);
  if (!message) {
    return NextResponse.json(
      { success: false, data: null, error: "BAD_REQUEST", message: "A message is required." },
      { status: 400 }
    );
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { success: false, data: null, error: "AI_NOT_CONFIGURED", message: "AI backend is not configured." },
      { status: 200 }
    );
  }

  const history = (b.history ?? []).slice(-6);
  const contents = [
    ...history.map((h) => ({
      role: h.role === "user" ? "user" : "model",
      parts: [{ text: h.text.slice(0, 1000) }],
    })),
    { role: "user", parts: [{ text: message }] },
  ];

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents,
          generationConfig: { temperature: 0.4, maxOutputTokens: 1024 },
        }),
      }
    );

    if (!res.ok) {
      console.error("Gemini upstream error", res.status, await res.text());
      return NextResponse.json(
        { success: false, data: null, error: "AI_UPSTREAM_ERROR", message: "AI service is unavailable right now." },
        { status: 200 }
      );
    }

    const json = await res.json();
    const reply: string | undefined = json?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!reply) {
      return NextResponse.json(
        { success: false, data: null, error: "AI_EMPTY_RESPONSE", message: "AI gave no response." },
        { status: 200 }
      );
    }

    return NextResponse.json({ success: true, data: { reply: reply.trim() }, error: null, message: "OK" });
  } catch {
    return NextResponse.json(
      { success: false, data: null, error: "AI_REQUEST_FAILED", message: "Could not reach AI service." },
      { status: 200 }
    );
  }
}
