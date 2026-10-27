import type { Metadata } from "next";
import Navbar from "@/components/ui/navbar";
import RacingPage from "../pages/racing";

export const metadata: Metadata = {
  title: "Connor Bell – Cycling – Racing",
};

export default function Racing() {
  return (
    <main data-page="cv" className="min-h-svh bg-black">
      <Navbar />
      <RacingPage />
    </main>
  );
}
