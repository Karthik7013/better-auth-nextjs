interface NumberSVGProps {
  number: number;
  className?: string;
}

export function NumberSVG({ number, className }: NumberSVGProps) {
  return (
    <span
      aria-hidden
      className="select-none font-black leading-none text-background"
      style={{
        fontSize: "clamp(140px, 18vw, 230px)",
        WebkitTextStroke: "4px var(--color-foreground)",
        transform: "translateY(0px)",
      }}
    >
      {number}
    </span>
  );
}
