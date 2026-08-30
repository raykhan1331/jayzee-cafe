import type { Metadata } from "next";
import HomeClient from "@/components/HomeClient";
import { business } from "@/data/site-config";

export const metadata: Metadata = {
  title: `${business.name} — ${business.tagline}`,
  description: business.description,
  openGraph: {
    title: business.name,
    description: business.description,
    type: "website",
  },
};

export default function Home() {
  return <HomeClient />;
}
