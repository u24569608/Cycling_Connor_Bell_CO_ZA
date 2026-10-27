import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-svh flex-col items-start justify-center bg-black px-6 py-12 text-left text-white md:px-24">

        <p className="tracking-wide text-lg text-white">
          <span className="font-semibold"> CONNOR BELL</span> <span className="font-light">Cycling</span>
        </p>

      <h1 className="text-[clamp(6rem,30vw,8rem)] leading-none font-semibold tracking-tight sm:text-[12rem] md:text-[16rem]">
        404
      </h1>
      <p className="-mt-2 mb-16 text-2xl font-medium sm:text-2xl md:text-3xl lg:text-4xl">
        Page Not Found
      </p>

      <Button
        nativeButton={false}
        render={<Link href="/" />}
        className="fade-underline h-auto cursor-pointer underline-offset-4 bg-white px-4 py-2 text-sm text-black duration-500 ease-in-out hover:bg-white/90 sm:px-5 sm:text-base motion-reduce:transition-none"
      >
        Go Home
      </Button>
    </main>
  );
}
