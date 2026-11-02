"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Pause, Play } from "lucide-react";

export interface TextToSpeechPlayerProps {
  /** The content to read aloud — plain text, not HTML. */
  text: string;
  /**
   * What's being read, used to build the play/pause button's accessible
   * name ("Play narration for {label}" / "Pause narration for {label}").
   * Falls back to a generic "content" if omitted.
   */
  label?: string;
  /** BCP-47 language tag used to pick a voice. Defaults to "en-US". */
  lang?: string;
  /** Speech rate passed to SpeechSynthesisUtterance. Defaults to 1. */
  rate?: number;
  /** Speech pitch passed to SpeechSynthesisUtterance. Defaults to 1. */
  pitch?: number;
  /**
   * Defaults to a fixed 300px-wide pill. Pass a width utility (e.g.
   * `"w-full"`) to size it to its container instead — the waveform
   * bars are flex-1 and stretch to fill however wide the pill ends up.
   */
  className?: string;
  /** Number of bars the waveform renders. Defaults to 28. */
  barCount?: number;
}

/**
 * Reusable, self-contained text-to-speech player — a round play/pause
 * button, a seekable pseudo-waveform, and a running time readout —
 * built on the browser's native Web Speech API (`speechSynthesis`)
 * rather than any pre-recorded audio file. There is no audio asset to
 * store or serve: the caller hands it a string and the browser voices
 * it client-side, for free, with no extra package or backend involved.
 *
 * Generic over any `text`, so any page that needs to read content
 * aloud (an itinerary overview, a blog post, a place description) can
 * drop this in — see `TripHeader` for the itinerary usage.
 *
 * The waveform bars are a deterministic pseudo-waveform derived from
 * `text` (see `generateWaveformBars`), purely decorative — there's no
 * audio signal to draw real peaks from.
 *
 * Known browser-API limits (not bugs in this component): `pause()` /
 * `resume()` support is inconsistent on some mobile browsers, and
 * seeking works by re-synthesizing from the nearest word boundary
 * rather than jumping mid-utterance, since `speechSynthesis` has no
 * native seek.
 */
export function TextToSpeechPlayer({
  text,
  label = "content",
  lang = "en-US",
  rate = 1,
  pitch = 1,
  className,
  barCount = 28,
}: TextToSpeechPlayerProps) {
  const [status, setStatus] = useState<
    "idle" | "playing" | "paused" | "unsupported"
  >("idle");
  const [spokenChars, setSpokenChars] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Base offset (into `text`) that the *current* utterance starts from —
  // non-zero after a seek, since seeking re-synthesizes from a substring
  // rather than jumping inside one utterance.
  const baseOffsetRef = useRef(0);
  const elapsedAtBaseRef = useRef(0);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);
  // Identifies the utterance currently "owned" by this player. Seeking
  // (and replaying) calls `speechSynthesis.cancel()` on whatever was
  // speaking before starting the next utterance — but the *cancelled*
  // utterance's own onend/onerror still fires asynchronously afterward.
  // Without this guard, that stale callback resets `status` to "idle"
  // right after the new utterance starts, which is exactly what made
  // play/pause look broken after seeking: the button believed nothing
  // was playing when the browser was, in fact, still speaking.
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const bars = useMemo(
    () => generateWaveformBars(text, barCount),
    [text, barCount],
  );
  const estimatedTotalSeconds = useMemo(
    () => estimateSpeechSeconds(text, rate),
    [text, rate],
  );

  // Pick a voice matching `lang` once the browser's voice list is ready
  // (it loads asynchronously and is empty on first paint in most
  // browsers).
  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    const pickVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      voiceRef.current =
        voices.find((voice) => voice.lang === lang) ??
        voices.find((voice) => voice.lang.startsWith(lang.split("-")[0])) ??
        null;
    };

    pickVoice();
    window.speechSynthesis.addEventListener("voiceschanged", pickVoice);
    return () =>
      window.speechSynthesis.removeEventListener("voiceschanged", pickVoice);
  }, [lang]);

  const stopTicking = useCallback(() => {
    if (tickRef.current !== null) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
  }, []);

  const startTicking = useCallback(() => {
    stopTicking();
    const startedAt = Date.now();
    tickRef.current = setInterval(() => {
      setElapsedSeconds(
        elapsedAtBaseRef.current + (Date.now() - startedAt) / 1000,
      );
    }, 200);
  }, [stopTicking]);

  // Cancel any in-flight speech on unmount so navigating away doesn't
  // leave the browser talking over the next page.
  useEffect(() => {
    return () => {
      stopTicking();
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [stopTicking]);

  const speakFrom = useCallback(
    (charOffset: number) => {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) {
        setStatus("unsupported");
        return;
      }

      window.speechSynthesis.cancel();
      const slice = text.slice(charOffset);
      if (!slice.trim()) return;

      const utterance = new SpeechSynthesisUtterance(slice);
      utterance.lang = lang;
      utterance.rate = rate;
      utterance.pitch = pitch;
      if (voiceRef.current) utterance.voice = voiceRef.current;

      // Every handler below first checks it's still the utterance this
      // player last started — see `currentUtteranceRef` above for why.
      utterance.onboundary = (event) => {
        if (currentUtteranceRef.current !== utterance) return;
        if (event.name === "word" || event.charIndex !== undefined) {
          setSpokenChars(charOffset + event.charIndex);
        }
      };
      utterance.onend = () => {
        if (currentUtteranceRef.current !== utterance) return;
        setStatus("idle");
        stopTicking();
        setSpokenChars(text.length);
      };
      utterance.onerror = () => {
        if (currentUtteranceRef.current !== utterance) return;
        setStatus("idle");
        stopTicking();
      };

      baseOffsetRef.current = charOffset;
      elapsedAtBaseRef.current = estimateSpeechSeconds(
        text.slice(0, charOffset),
        rate,
      );
      setElapsedSeconds(elapsedAtBaseRef.current);
      setSpokenChars(charOffset);

      currentUtteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
      setStatus("playing");
      startTicking();
    },
    [text, lang, rate, pitch, startTicking, stopTicking],
  );

  const togglePlay = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setStatus("unsupported");
      return;
    }

    // Ask the browser what it's actually doing rather than trusting our
    // own `status` alone — after a seek/cancel, the engine's real
    // speaking/paused flags are the source of truth, and they're what
    // pause()/resume() act on regardless of what our state thinks.
    const synth = window.speechSynthesis;
    if (synth.speaking && !synth.paused) {
      synth.pause();
      setStatus("paused");
      stopTicking();
    } else if (synth.paused) {
      synth.resume();
      setStatus("playing");
      startTicking();
    } else {
      // Nothing queued — fresh start, or replay after finishing.
      const restartFrom = spokenChars >= text.length ? 0 : spokenChars;
      speakFrom(restartFrom);
    }
  };

  const seekToRatio = (ratio: number) => {
    const clamped = Math.min(1, Math.max(0, ratio));
    const targetIndex = Math.round(clamped * text.length);
    // Snap forward to the next word boundary so we don't start
    // mid-word — nicer to listen to than an arbitrary cut.
    const nextSpace = text.indexOf(" ", targetIndex);
    const snapped = nextSpace === -1 ? text.length : nextSpace + 1;
    speakFrom(Math.min(snapped, text.length));
  };

  const handleSeekClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    seekToRatio((event.clientX - rect.left) / rect.width);
  };

  const handleSeekKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const currentRatio = text.length ? spokenChars / text.length : 0;
    const step = 0.05;
    if (event.key === "ArrowRight") {
      event.preventDefault();
      seekToRatio(currentRatio + step);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      seekToRatio(currentRatio - step);
    } else if (event.key === "Home") {
      event.preventDefault();
      seekToRatio(0);
    } else if (event.key === "End") {
      event.preventDefault();
      seekToRatio(1);
    }
  };

  if (status === "unsupported") {
    return (
      <span
        className={cn(
          "font-poppins text-body-m text-brand-neutral-800",
          className,
        )}
      >
        Read-aloud isn&apos;t supported in this browser.
      </span>
    );
  }

  const isPlaying = status === "playing";
  const progress = text.length ? spokenChars / text.length : 0;
  const activeBars = Math.round(progress * barCount);

  return (
    <div
      className={cn(
        "flex w-75 items-center gap-3 rounded-pill border border-brand-neutral-300 bg-white px-5 py-3",
        className,
      )}
    >
      <button
        type="button"
        onClick={togglePlay}
        aria-label={
          isPlaying
            ? `Pause narration for ${label}`
            : `Play narration for ${label}`
        }
        className="flex shrink-0 items-center justify-center text-brand-neutral-1000 transition-colors hover:text-primary-500 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary-500"
      >
        {isPlaying ? (
          <Pause className="size-4 cursor-pointer" />
        ) : (
          <Play className="size-4 cursor-pointer" />
        )}
      </button>

      <div
        role="slider"
        tabIndex={0}
        aria-label={`Seek ${label} narration`}
        aria-valuemin={0}
        aria-valuemax={Math.round(estimatedTotalSeconds)}
        aria-valuenow={Math.round(elapsedSeconds)}
        aria-valuetext={`${formatTime(elapsedSeconds)} of ${formatTime(estimatedTotalSeconds)}`}
        onClick={handleSeekClick}
        onKeyDown={handleSeekKeyDown}
        className="flex h-4 min-w-0 flex-1 cursor-pointer items-center gap-0.75 outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
      >
        {bars.map((height, index) => {
          // Fully black before playback ever starts, matching the flat
          // reference design — once there's real progress to show, bars
          // ahead of the playhead fade to gray so the position reads
          // clearly without losing the original look at rest.
          const hasStarted = spokenChars > 0;
          const isActive = index < activeBars;
          const isCurrent = isPlaying && index === activeBars;
          return (
            <span
              key={index}
              className={cn(
                "min-w-0.5 flex-1 rounded-full transition-colors duration-150",
                !hasStarted || isActive
                  ? "bg-brand-neutral-1000"
                  : "bg-brand-neutral-300",
                isCurrent && "animate-pulse bg-primary-500",
              )}
              style={{ height: `${height * 100}%` }}
            />
          );
        })}
      </div>

      <span className="shrink-0 font-poppins text-body-m font-medium whitespace-nowrap text-brand-neutral-600 tabular-nums">
        {status === "playing" || status === "paused" || spokenChars > 0
          ? `${formatTime(elapsedSeconds)} / ${formatTime(estimatedTotalSeconds)}`
          : formatTime(estimatedTotalSeconds)}
      </span>
    </div>
  );
}

/** Formats a seconds count as "m:ss" (e.g. 65 -> "1:05"). */
export function formatTime(totalSeconds: number): string {
  const safeSeconds = Number.isFinite(totalSeconds)
    ? Math.max(0, totalSeconds)
    : 0;
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = Math.floor(safeSeconds % 60);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

/**
 * Rough spoken-duration estimate for `text` at a given rate, used only
 * to size the time readout and progress denominator before/while
 * speaking — `speechSynthesis` doesn't expose a real duration up
 * front. Based on ~155 words/minute average speech at rate 1.
 */
export function estimateSpeechSeconds(text: string, rate: number): number {
  const words = text.trim().length ? text.trim().split(/\s+/).length : 0;
  const wordsPerMinute = 155 * Math.max(0.1, rate);
  return Math.max((words / wordsPerMinute) * 60, words > 0 ? 1 : 0);
}

/**
 * Deterministic pseudo-waveform: hashes `seed` (the text being read)
 * into a small PRNG so the same content always renders the same bar
 * pattern across renders/reloads — there's no audio signal to draw
 * real peaks from.
 */
export function generateWaveformBars(seed: string, count: number): number[] {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }

  const bars: number[] = [];
  let state = hash || 1;
  for (let i = 0; i < count; i++) {
    // xorshift32 — fast, seedable, good enough for a decorative shape.
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    state >>>= 0;
    const value = state / 0xffffffff;
    bars.push(0.3 + value * 0.7); // keep every bar visible (30%-100% height)
  }
  return bars;
}
