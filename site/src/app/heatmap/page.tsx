import type { Metadata } from "next";
import Navbar from "@/components/ui/navbar";
import HeatmapPage from "../pages/heatmap";

export const metadata: Metadata = {
  title: "Connor Bell – Cycling – Heatmap",
};

export default function Heatmap() {
  return (
    <main data-page="cv" className="min-h-svh bg-black">
      <Navbar />
      <HeatmapPage />
    </main>
  );
}
