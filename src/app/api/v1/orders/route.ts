import { NextRequest, NextResponse } from "next/server";
import { appendRecord, generateId, readRecords } from "@/lib/store";
import { business, menu } from "@/data/site-config";

type CartLine = { itemId: string; qty: number };

type OrderRecord = {
  id: string;
  customer: { name: string; phone: string; address: string };
  fulfillment: "delivery" | "pickup";
  paymentMethod: "COD";
  lines: { itemId: string; name: string; price: number; qty: number }[];
  subtotal: number;
  deliveryCharge: number;
  total: number;
  status: "PENDING";
  createdAt: string;
};

const allItems = menu.flatMap((c) => c.items);

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

  const b = body as {
    name?: string;
    phone?: string;
    address?: string;
    fulfillment?: string;
    cart?: CartLine[];
  };

  if (!b.name || typeof b.name !== "string" || b.name.trim().length < 2) {
    return badRequest("A valid name is required.");
  }
  if (!b.phone || typeof b.phone !== "string" || !/^[0-9+\-\s]{7,15}$/.test(b.phone)) {
    return badRequest("A valid phone number is required.");
  }
  const fulfillment = b.fulfillment === "pickup" ? "pickup" : "delivery";
  if (fulfillment === "delivery" && (!b.address || b.address.trim().length < 5)) {
    return badRequest("A valid delivery address is required.");
  }
  if (!Array.isArray(b.cart) || b.cart.length === 0) {
    return badRequest("Cart is empty.");
  }

  const lines = [];
  let subtotal = 0;
  for (const line of b.cart) {
    const item = allItems.find((i) => i.id === line.itemId);
    const qty = Number(line.qty);
    if (!item || !item.available) return badRequest(`Item unavailable: ${line.itemId}`);
    if (!Number.isInteger(qty) || qty < 1 || qty > 20) return badRequest(`Invalid quantity for ${item.name}`);
    // Price is always taken from server-side menu data, never trusted from the client.
    lines.push({ itemId: item.id, name: item.name, price: item.price, qty });
    subtotal += item.price * qty;
  }

  if (subtotal < business.delivery.minOrder && fulfillment === "delivery") {
    return badRequest(`Minimum order for delivery is ${business.currency} ${business.delivery.minOrder}.`);
  }

  const deliveryCharge =
    fulfillment === "pickup"
      ? 0
      : subtotal >= business.delivery.freeDeliveryOver
      ? 0
      : business.delivery.charge;

  const order: OrderRecord = {
    id: generateId("ORD"),
    customer: { name: b.name.trim(), phone: b.phone.trim(), address: (b.address ?? "").trim() },
    fulfillment,
    paymentMethod: "COD",
    lines,
    subtotal,
    deliveryCharge,
    total: subtotal + deliveryCharge,
    status: "PENDING",
    createdAt: new Date().toISOString(),
  };

  await appendRecord("orders.json", order);

  return NextResponse.json({ success: true, data: order, error: null, message: "Order placed." }, { status: 201 });
}

// Public lookup is restricted to a single order by its ID (order tracking),
// never a full listing — order records contain customer name/phone/address.
export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return badRequest("Provide an order id via ?id=");
  }
  const orders = await readRecords<OrderRecord>("orders.json");
  const order = orders.find((o) => o.id === id);
  if (!order) {
    return NextResponse.json({ success: false, data: null, error: "NOT_FOUND", message: "Order not found." }, { status: 404 });
  }
  return NextResponse.json({ success: true, data: order, error: null, message: null });
}
