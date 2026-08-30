"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { business, menu, midnightDeal } from "@/data/site-config";

type CartLine = { itemId: string; qty: number };

const allItems = menu.flatMap((c) => c.items);
const navLinks = [
  { href: "#menu", label: "Menu" },
  { href: "#order", label: "Order" },
  { href: "#reservation", label: "Reserve" },
  { href: "#delivery", label: "Delivery" },
  { href: "#location", label: "Location" },
  { href: "#contact", label: "Contact" },
];

function currency(n: number) {
  return `${business.currency} ${n.toLocaleString()}`;
}

function isMidnightNow() {
  if (!midnightDeal.active) return false;
  const h = new Date().getHours();
  return h >= midnightDeal.startHour && h < midnightDeal.endHour;
}

export default function HomeClient() {
  const [cart, setCart] = useState<CartLine[]>([]);
  const [fulfillment, setFulfillment] = useState<"delivery" | "pickup">("delivery");
  const [orderForm, setOrderForm] = useState({ name: "", phone: "", address: "" });
  const [orderStatus, setOrderStatus] = useState<
    { state: "idle" } | { state: "submitting" } | { state: "error"; message: string } | { state: "success"; id: string; total: number }
  >({ state: "idle" });

  const [resForm, setResForm] = useState({ name: "", phone: "", date: "", time: "", guests: 2, notes: "" });
  const [resStatus, setResStatus] = useState<
    { state: "idle" } | { state: "submitting" } | { state: "error"; message: string } | { state: "success"; id: string }
  >({ state: "idle" });

  const midnightActive = useMemo(isMidnightNow, []);

  function addToCart(itemId: string) {
    setCart((prev) => {
      const existing = prev.find((l) => l.itemId === itemId);
      if (existing) return prev.map((l) => (l.itemId === itemId ? { ...l, qty: l.qty + 1 } : l));
      return [...prev, { itemId, qty: 1 }];
    });
  }

  function changeQty(itemId: string, delta: number) {
    setCart((prev) =>
      prev
        .map((l) => (l.itemId === itemId ? { ...l, qty: l.qty + delta } : l))
        .filter((l) => l.qty > 0)
    );
  }

  const subtotal = cart.reduce((sum, l) => {
    const item = allItems.find((i) => i.id === l.itemId);
    return sum + (item ? item.price * l.qty : 0);
  }, 0);
  const deliveryCharge =
    cart.length === 0
      ? 0
      : fulfillment === "pickup"
      ? 0
      : subtotal >= business.delivery.freeDeliveryOver
      ? 0
      : business.delivery.charge;
  const total = subtotal + deliveryCharge;

  async function submitOrder(e: React.FormEvent) {
    e.preventDefault();
    if (cart.length === 0) {
      setOrderStatus({ state: "error", message: "Your cart is empty — add something from the menu first." });
      return;
    }
    setOrderStatus({ state: "submitting" });
    try {
      const res = await fetch("/api/v1/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...orderForm, fulfillment, cart }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setOrderStatus({ state: "error", message: json.message ?? "Could not place order." });
        return;
      }
      setOrderStatus({ state: "success", id: json.data.id, total: json.data.total });
      setCart([]);
      setOrderForm({ name: "", phone: "", address: "" });
    } catch {
      setOrderStatus({ state: "error", message: "Network error — please try again." });
    }
  }

  async function submitReservation(e: React.FormEvent) {
    e.preventDefault();
    setResStatus({ state: "submitting" });
    try {
      const res = await fetch("/api/v1/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(resForm),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setResStatus({ state: "error", message: json.message ?? "Could not submit reservation." });
        return;
      }
      setResStatus({ state: "success", id: json.data.id });
      setResForm({ name: "", phone: "", date: "", time: "", guests: 2, notes: "" });
    } catch {
      setResStatus({ state: "error", message: "Network error — please try again." });
    }
  }

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-stone-200 bg-stone-50/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <a href="#top" className="text-lg font-black tracking-tight text-amber-700">
            JAYZEE <span className="text-stone-900">CAFE</span>
          </a>
          <nav className="hidden gap-6 text-sm font-medium text-stone-700 sm:flex">
            {navLinks.map((l) => (
              <a key={l.href} href={l.href} className="hover:text-amber-700">
                {l.label}
              </a>
            ))}
          </nav>
          <a
            href={`tel:${business.phoneDial}`}
            className="rounded-full bg-amber-700 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-800"
          >
            {business.phone}
          </a>
        </div>
      </header>

      {/* Hero */}
      <section id="top" className="relative overflow-hidden bg-stone-900 text-white">
        <div className="absolute inset-0 opacity-40">
          <Image
            src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1600&q=80"
            alt="Jayzee Cafe interior"
            fill
            priority
            className="object-cover"
          />
        </div>
        <div className="relative mx-auto max-w-6xl px-4 py-28 text-center sm:py-36">
          <h1 className="text-4xl font-black tracking-tight sm:text-6xl">JAYZEE CAFE</h1>
          <p className="mt-3 text-lg font-medium text-amber-300 sm:text-2xl">{business.tagline}</p>
          <p className="mx-auto mt-5 max-w-2xl text-stone-200">{business.description}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a href="#order" className="rounded-full bg-amber-600 px-6 py-3 font-semibold hover:bg-amber-500">
              ORDER NOW
            </a>
            <a href="#menu" className="rounded-full border border-white/40 px-6 py-3 font-semibold hover:bg-white/10">
              VIEW MENU
            </a>
            <a href="#location" className="rounded-full border border-white/40 px-6 py-3 font-semibold hover:bg-white/10">
              FIND US
            </a>
          </div>
        </div>
      </section>

      {/* Midnight deal */}
      {midnightDeal.active && (
        <section className={`px-4 py-6 text-center text-white ${midnightActive ? "bg-indigo-900" : "bg-indigo-950/60"}`}>
          <div className="mx-auto max-w-3xl">
            <p className="text-2xl font-black">{midnightDeal.title}</p>
            <p className="mt-1 font-semibold text-indigo-200">{midnightDeal.headline}</p>
            <p className="mt-1 text-sm text-indigo-300">{midnightDeal.description}</p>
            <p className="mt-2 text-xs uppercase tracking-wide text-indigo-400">
              {midnightActive
                ? `Live now — ${midnightDeal.discountPercent}% off selected items`
                : `Active daily ${midnightDeal.startHour}:00–${midnightDeal.endHour}:00`}
            </p>
          </div>
        </section>
      )}

      {/* Menu */}
      <section id="menu" className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-center text-3xl font-black">Our Menu</h2>
        <p className="mx-auto mt-2 max-w-xl text-center text-stone-600">
          Fresh picks, made to order. Prices in {business.currency}.
        </p>
        <div className="mt-10 space-y-12">
          {menu.map((cat) => (
            <div key={cat.id}>
              <h3 className="mb-4 text-xl font-bold text-amber-700">{cat.name}</h3>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {cat.items.map((item) => (
                  <div key={item.id} className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
                    <div className="relative h-40 w-full">
                      <Image src={item.image} alt={item.name} fill className="object-cover" />
                    </div>
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-semibold">{item.name}</h4>
                        <span className="whitespace-nowrap font-bold text-amber-700">{currency(item.price)}</span>
                      </div>
                      <p className="mt-1 text-sm text-stone-500">{item.description}</p>
                      <button
                        onClick={() => addToCart(item.id)}
                        disabled={!item.available}
                        className="mt-3 w-full rounded-full bg-stone-900 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-40"
                      >
                        {item.available ? "Add to Cart" : "Unavailable"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Order section */}
      <section id="order" className="bg-stone-100 py-16">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 lg:grid-cols-2">
          <div>
            <h2 className="text-3xl font-black">Your Order</h2>
            {cart.length === 0 ? (
              <p className="mt-4 text-stone-500">Your cart is empty. Add items from the menu above.</p>
            ) : (
              <div className="mt-4 space-y-3">
                {cart.map((l) => {
                  const item = allItems.find((i) => i.id === l.itemId)!;
                  return (
                    <div key={l.itemId} className="flex items-center justify-between rounded-xl bg-white p-3 shadow-sm">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-stone-500">{currency(item.price)} each</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button onClick={() => changeQty(l.itemId, -1)} className="h-7 w-7 rounded-full bg-stone-200 font-bold">
                          −
                        </button>
                        <span className="w-5 text-center">{l.qty}</span>
                        <button onClick={() => changeQty(l.itemId, 1)} className="h-7 w-7 rounded-full bg-stone-200 font-bold">
                          +
                        </button>
                      </div>
                    </div>
                  );
                })}
                <div className="rounded-xl bg-white p-4 shadow-sm text-sm">
                  <div className="flex justify-between"><span>Subtotal</span><span>{currency(subtotal)}</span></div>
                  <div className="flex justify-between"><span>Delivery</span><span>{deliveryCharge === 0 ? "Free" : currency(deliveryCharge)}</span></div>
                  <div className="mt-2 flex justify-between border-t border-stone-200 pt-2 font-bold"><span>Total</span><span>{currency(total)}</span></div>
                </div>
              </div>
            )}
          </div>

          <form onSubmit={submitOrder} className="space-y-4 rounded-2xl bg-white p-6 shadow-sm">
            <div className="flex gap-2">
              {(["delivery", "pickup"] as const).map((f) => (
                <button
                  type="button"
                  key={f}
                  onClick={() => setFulfillment(f)}
                  className={`flex-1 rounded-full py-2 text-sm font-semibold capitalize ${
                    fulfillment === f ? "bg-amber-700 text-white" : "bg-stone-100 text-stone-600"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
            <input
              required
              placeholder="Full name"
              value={orderForm.name}
              onChange={(e) => setOrderForm({ ...orderForm, name: e.target.value })}
              className="w-full rounded-lg border border-stone-300 px-3 py-2"
            />
            <input
              required
              placeholder="Phone number"
              value={orderForm.phone}
              onChange={(e) => setOrderForm({ ...orderForm, phone: e.target.value })}
              className="w-full rounded-lg border border-stone-300 px-3 py-2"
            />
            {fulfillment === "delivery" && (
              <textarea
                required
                placeholder="Delivery address"
                value={orderForm.address}
                onChange={(e) => setOrderForm({ ...orderForm, address: e.target.value })}
                className="w-full rounded-lg border border-stone-300 px-3 py-2"
              />
            )}
            <p className="text-xs text-stone-500">Payment method: Cash on Delivery.</p>
            <button
              type="submit"
              disabled={orderStatus.state === "submitting"}
              className="w-full rounded-full bg-amber-700 py-3 font-semibold text-white hover:bg-amber-800 disabled:opacity-50"
            >
              {orderStatus.state === "submitting" ? "Placing order..." : "Confirm Order"}
            </button>
            {orderStatus.state === "error" && <p className="text-sm text-red-600">{orderStatus.message}</p>}
            {orderStatus.state === "success" && (
              <p className="rounded-lg bg-green-50 p-3 text-sm text-green-700">
                Order placed! Your order number is <strong>{orderStatus.id}</strong> — total {currency(orderStatus.total)}. We&apos;ll call you to confirm.
              </p>
            )}
          </form>
        </div>
      </section>

      {/* Reservation */}
      <section id="reservation" className="mx-auto max-w-3xl px-4 py-16">
        <h2 className="text-center text-3xl font-black">Reserve a Table</h2>
        <p className="mt-2 text-center text-stone-600">Planning a visit? Let us hold a table for you.</p>
        <form onSubmit={submitReservation} className="mt-8 grid gap-4 rounded-2xl bg-white p-6 shadow-sm sm:grid-cols-2">
          <input
            required
            placeholder="Full name"
            value={resForm.name}
            onChange={(e) => setResForm({ ...resForm, name: e.target.value })}
            className="rounded-lg border border-stone-300 px-3 py-2 sm:col-span-2"
          />
          <input
            required
            placeholder="Phone number"
            value={resForm.phone}
            onChange={(e) => setResForm({ ...resForm, phone: e.target.value })}
            className="rounded-lg border border-stone-300 px-3 py-2"
          />
          <input
            required
            type="number"
            min={1}
            max={30}
            placeholder="Guests"
            value={resForm.guests}
            onChange={(e) => setResForm({ ...resForm, guests: Number(e.target.value) })}
            className="rounded-lg border border-stone-300 px-3 py-2"
          />
          <input
            required
            type="date"
            value={resForm.date}
            onChange={(e) => setResForm({ ...resForm, date: e.target.value })}
            className="rounded-lg border border-stone-300 px-3 py-2"
          />
          <input
            required
            type="time"
            value={resForm.time}
            onChange={(e) => setResForm({ ...resForm, time: e.target.value })}
            className="rounded-lg border border-stone-300 px-3 py-2"
          />
          <textarea
            placeholder="Notes (optional)"
            value={resForm.notes}
            onChange={(e) => setResForm({ ...resForm, notes: e.target.value })}
            className="rounded-lg border border-stone-300 px-3 py-2 sm:col-span-2"
          />
          <button
            type="submit"
            disabled={resStatus.state === "submitting"}
            className="rounded-full bg-stone-900 py-3 font-semibold text-white hover:bg-amber-700 disabled:opacity-50 sm:col-span-2"
          >
            {resStatus.state === "submitting" ? "Sending..." : "Request Reservation"}
          </button>
          {resStatus.state === "error" && <p className="text-sm text-red-600 sm:col-span-2">{resStatus.message}</p>}
          {resStatus.state === "success" && (
            <p className="rounded-lg bg-green-50 p-3 text-sm text-green-700 sm:col-span-2">
              Reservation request sent! Reference <strong>{resStatus.id}</strong>. We&apos;ll confirm by phone.
            </p>
          )}
        </form>
      </section>

      {/* Delivery */}
      <section id="delivery" className="bg-stone-900 py-16 text-white">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h2 className="text-3xl font-black">Delivery Info</h2>
          <div className="mt-8 grid grid-cols-2 gap-6 text-left sm:grid-cols-4">
            <div>
              <p className="text-2xl font-bold text-amber-400">{currency(business.delivery.charge)}</p>
              <p className="text-sm text-stone-300">Delivery charge</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-400">{currency(business.delivery.minOrder)}</p>
              <p className="text-sm text-stone-300">Minimum order</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-400">{currency(business.delivery.freeDeliveryOver)}+</p>
              <p className="text-sm text-stone-300">Free delivery over</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-400">{business.delivery.estimatedTime}</p>
              <p className="text-sm text-stone-300">Estimated time</p>
            </div>
          </div>
          <p className="mt-6 text-sm text-stone-400">
            We deliver to: {business.delivery.areas.join(" · ")}
          </p>
        </div>
      </section>

      {/* Location */}
      <section id="location" className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-center text-3xl font-black">Find Us</h2>
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="overflow-hidden rounded-2xl border border-stone-200">
            <iframe
              title="Jayzee Cafe location"
              src={`https://www.google.com/maps?q=${encodeURIComponent(business.mapEmbedQuery)}&output=embed`}
              className="h-80 w-full"
              loading="lazy"
            />
          </div>
          <div className="flex flex-col justify-center rounded-2xl bg-stone-100 p-6">
            <h3 className="text-xl font-bold">{business.name}</h3>
            <p className="mt-2 text-stone-600">{business.address}</p>
            <p className="mt-1 text-stone-600">Hours: {business.hours}</p>
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(business.mapEmbedQuery)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-block w-fit rounded-full bg-amber-700 px-6 py-3 font-semibold text-white hover:bg-amber-800"
            >
              GET DIRECTIONS
            </a>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="bg-amber-700 py-16 text-white">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h2 className="text-3xl font-black">Get in Touch</h2>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <a href={`tel:${business.phoneDial}`} className="rounded-full bg-white px-6 py-3 font-semibold text-amber-700">
              Call {business.phone}
            </a>
            <a
              href={`https://wa.me/${business.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-green-600 px-6 py-3 font-semibold text-white hover:bg-green-700"
            >
              WhatsApp Us
            </a>
          </div>
          <div className="mt-6 flex justify-center gap-5 text-sm font-medium underline-offset-4">
            <a href={business.social.instagram} target="_blank" rel="noopener noreferrer" className="hover:underline">Instagram</a>
            <a href={business.social.tiktok} target="_blank" rel="noopener noreferrer" className="hover:underline">TikTok</a>
            <a href={business.social.facebook} target="_blank" rel="noopener noreferrer" className="hover:underline">Facebook</a>
          </div>
        </div>
      </section>

      <footer className="bg-stone-950 py-6 text-center text-sm text-stone-400">
        © {new Date().getFullYear()} {business.name} — {business.address}
      </footer>
    </div>
  );
}
