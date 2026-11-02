/** Play/pause glyphs local to TextToSpeechPlayer — kept out of the shared page icon sets since this component lives outside any one route. */

type IconProps = { className?: string };

export function PlayIcon({ className = "size-4" }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M8 5.5v13l11-6.5-11-6.5z" />
    </svg>
  );
}

export function PauseIcon({ className = "size-4" }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M7 5h4v14H7zM13 5h4v14h-4z" />
    </svg>
  );
}
