import type { ReactNode } from "react";

type BannerProps = {
  heading: string;
  children?: ReactNode;
};

function Banner({ heading, children }: BannerProps) {
  return (
    <header
      className={`dark sticky top-0 z-10 flex bg-black px-8 text-white md:px-24 ${children !== undefined ? "h-52 pt-20 pb-6" : "h-40 pt-20 pb-8"}`}
    >
      <div className="flex w-full max-w-screen-xl flex-col items-start justify-end gap-4">
        <h1 className="text-2xl font-medium sm:text-2xl md:text-3xl lg:text-4xl">
          {heading}
        </h1>
        {children}
      </div>
    </header>
  );
}

export default Banner;
