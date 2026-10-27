import Navbar from "@/components/ui/navbar";
import HomePage from "../pages/home";

export default function Home() {
  return (
    <main data-page="home" className="h-svh overflow-hidden bg-black">
      <Navbar />
      <HomePage />
    </main>
  );
}
