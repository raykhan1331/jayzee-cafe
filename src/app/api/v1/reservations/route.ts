import { NextRequest, NextResponse } from "next/server";
import { appendRecord, generateId } from "@/lib/store";

type ReservationRecord = {
  id: string;
  name: string;
  phone: string;
  date: string;
  time: string;
  guests: number;
  notes: string;
  status: "PENDING";
  createdAt: string;
};

function badRequest(message: string) {
  return NextResponse.json({ success: false, data: null, error: "BAD_REQUEST", message }, { status: 400 });
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return badRequest("Invalid JSON body.");
  }

  const b = body as Partial<{
    name: string;
    phone: string;
    date: string;
    time: string;
    guests: number;
    notes: string;
  }>;

  if (!b.name || b.name.trim().length < 2) return badRequest("A valid name is required.");
  if (!b.phone || !/^[0-9+\-\s]{7,15}$/.test(b.phone)) return badRequest("A valid phone number is required.");
  if (!b.date || !/^\d{4}-\d{2}-\d{2}$/.test(b.date)) return badRequest("A valid date is required.");
  if (!b.time || !/^\d{2}:\d{2}$/.test(b.time)) return badRequest("A valid time is required.");
  const guests = Number(b.guests);
  if (!Number.isInteger(guests) || guests < 1 || guests > 30) return badRequest("Guests must be between 1 and 30.");

  const reservation: ReservationRecord = {
    id: generateId("RES"),
    name: b.name.trim(),
    phone: b.phone.trim(),
    date: b.date,
    time: b.time,
    guests,
    notes: (b.notes ?? "").toString().slice(0, 300),
    status: "PENDING",
    createdAt: new Date().toISOString(),
  };

  await appendRecord("reservations.json", reservation);

  return NextResponse.json(
    { success: true, data: reservation, error: null, message: "Reservation request received." },
    { status: 201 }
  );
}
