import { cn } from "cn";

const socialItems = [
  {
    // Strava Profile Link
    href: "https://www.strava.com/athletes/48844564",
    label: "STRAVA",
  },
];

type SocialLinksProps = {
  className?: string;
};

function SocialLinks({ className }: SocialLinksProps) {
  return (
    <div
      className={cn(
        "flex gap-2 text-[1.1rem] font-medium",
        className,
      )}
    >
      {socialItems.map((item) => (
        <a
          key={item.href}
          href={item.href}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current"
        >
          <span className="underline underline-offset-4">{item.label}</span>
          <span aria-hidden="true" className="material-symbols-sharp">
            north_east
          </span>
        </a>
      ))}
    </div>
  );
}

export default SocialLinks;
