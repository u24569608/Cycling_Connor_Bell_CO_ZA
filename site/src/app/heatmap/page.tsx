import type { Metadata } from "next";
import Banner from "@/components/ui/banner";
import Navbar from "@/components/ui/navbar";
import HeatmapPage from "../pages/heatmap";

export const metadata: Metadata = {
  title: "Connor Bell – Cycling – Heatmap",
};

export default function Heatmap() {
  return (
    <main data-page="heatmap" className="flex h-svh flex-col overflow-hidden bg-black">
      <Navbar />
      <Banner heading="Heatmap" />
      <HeatmapPage />
    </main>
  );
}
