interface NumberSVGProps {
  number: number;
  className?: string;
}

export function NumberSVG({ number, className }: NumberSVGProps) {
  return (
    <svg
      viewBox="0 0 200 300"
      fill="currentColor"
      className={className}
      aria-hidden="true"
      preserveAspectRatio="xMinYMid meet"
    >
      <text
        x="0"
        y="260"
        fontSize="320"
        fontWeight="900"
        fontFamily="ui-sans-serif, system-ui, sans-serif"
      >
        {number}
      </text>
    </svg>
  );
}
