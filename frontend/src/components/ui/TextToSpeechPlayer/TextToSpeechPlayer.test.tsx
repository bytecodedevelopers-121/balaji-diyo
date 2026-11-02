import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import {
  TextToSpeechPlayer,
  estimateSpeechSeconds,
  formatTime,
  generateWaveformBars,
} from "./TextToSpeechPlayer";

// jsdom has no Web Speech API — stand in a minimal fake so the component
// can exercise its real play/pause/seek logic against something.
class FakeUtterance {
  static instances: FakeUtterance[] = [];
  text: string;
  lang = "";
  rate = 1;
  pitch = 1;
  voice: unknown = null;
  onboundary: ((event: { name: string; charIndex: number }) => void) | null = null;
  onend: (() => void) | null = null;
  onerror: (() => void) | null = null;
  constructor(text: string) {
    this.text = text;
    FakeUtterance.instances.push(this);
  }
}

// Mirrors the real API's `speaking`/`paused` flags (the component's
// togglePlay reads these, not just its own React state) — speak() turns
// speaking on, cancel() turns both off, pause()/resume() only flip
// `paused` while a real browser keeps `speaking` true throughout.
function installFakeSpeechSynthesis() {
  const speak = vi.fn();
  const cancel = vi.fn();
  const pause = vi.fn();
  const resume = vi.fn();
  const fakeSynthesis = {
    speaking: false,
    paused: false,
    speak: speak.mockImplementation(() => {
      fakeSynthesis.speaking = true;
      fakeSynthesis.paused = false;
    }),
    cancel: cancel.mockImplementation(() => {
      fakeSynthesis.speaking = false;
      fakeSynthesis.paused = false;
    }),
    pause: pause.mockImplementation(() => {
      fakeSynthesis.paused = true;
    }),
    resume: resume.mockImplementation(() => {
      fakeSynthesis.paused = false;
    }),
    getVoices: () => [],
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  };
  vi.stubGlobal("speechSynthesis", fakeSynthesis);
  vi.stubGlobal("SpeechSynthesisUtterance", FakeUtterance);
  return { speak, cancel, pause, resume, fakeSynthesis };
}

describe("TextToSpeechPlayer", () => {
  beforeEach(() => {
    FakeUtterance.instances = [];
    installFakeSpeechSynthesis();
  });

  afterEach(() => {
    // Unmount before unstubbing — the component's unmount effect still
    // reaches for `window.speechSynthesis` to cancel/cleanup, so pulling
    // the stub out from under it first would crash the teardown itself.
    cleanup();
    vi.unstubAllGlobals();
  });

  it("renders a play button with the estimated duration before playback starts", () => {
    render(
      <TextToSpeechPlayer
        text="A short trip overview."
        label="Ama Dablam Base Camp"
      />,
    );

    expect(screen.getByRole("button", { name: "Play narration for Ama Dablam Base Camp" })).toBeInTheDocument();
    expect(screen.getByRole("slider", { name: "Seek Ama Dablam Base Camp narration" })).toBeInTheDocument();
  });

  it("starts speaking on click and swaps the button to Pause", () => {
    const { speak } = installFakeSpeechSynthesis();
    render(
      <TextToSpeechPlayer
        text="A short trip overview."
        label="Ama Dablam Base Camp"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Play narration for Ama Dablam Base Camp" }));

    expect(speak).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "Pause narration for Ama Dablam Base Camp" })).toBeInTheDocument();
  });

  it("pauses via speechSynthesis.pause() and resumes via resume()", () => {
    const { pause, resume } = installFakeSpeechSynthesis();
    render(<TextToSpeechPlayer text="A short trip overview." />);

    fireEvent.click(screen.getByRole("button", { name: /play narration/i }));
    fireEvent.click(screen.getByRole("button", { name: /pause narration/i }));
    expect(pause).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: /play narration/i }));
    expect(resume).toHaveBeenCalledTimes(1);
  });

  it("seeks by re-synthesizing from the clicked position", () => {
    const { speak, cancel } = installFakeSpeechSynthesis();
    render(<TextToSpeechPlayer text="one two three four five six seven eight nine ten" />);

    const slider = screen.getByRole("slider");
    vi.spyOn(slider, "getBoundingClientRect").mockReturnValue({
      left: 0,
      width: 200,
      top: 0,
      height: 16,
      right: 200,
      bottom: 16,
      x: 0,
      y: 0,
      toJSON: () => {},
    });

    fireEvent.click(slider, { clientX: 100 });

    expect(cancel).toHaveBeenCalled();
    expect(speak).toHaveBeenCalledTimes(1);
  });

  it("still plays/pauses correctly after seeking, even if the cancelled utterance's onend fires late", () => {
    const { pause } = installFakeSpeechSynthesis();
    render(<TextToSpeechPlayer text="one two three four five six seven eight nine ten" label="trip" />);

    fireEvent.click(screen.getByRole("button", { name: /play narration for trip/i }));

    const slider = screen.getByRole("slider");
    vi.spyOn(slider, "getBoundingClientRect").mockReturnValue({
      left: 0,
      width: 200,
      top: 0,
      height: 16,
      right: 200,
      bottom: 16,
      x: 0,
      y: 0,
      toJSON: () => {},
    });
    // Seeking cancels the first utterance and starts a second one.
    fireEvent.click(slider, { clientX: 100 });

    // Simulate the browser firing the *first* (cancelled) utterance's
    // onend after the second one has already started speaking — this is
    // the race that used to reset the button back to "Play".
    const utterances = FakeUtterance.instances;
    utterances[0].onend?.();

    expect(screen.getByRole("button", { name: /pause narration for trip/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /pause narration for trip/i }));
    expect(pause).toHaveBeenCalledTimes(1);
  });

  it("falls back to an unsupported message when speechSynthesis is unavailable", () => {
    vi.unstubAllGlobals();
    // @ts-expect-error -- deliberately simulating an environment without the API
    delete window.speechSynthesis;

    render(<TextToSpeechPlayer text="A short trip overview." />);
    fireEvent.click(screen.getByRole("button", { name: /play narration/i }));

    expect(screen.getByText("Read-aloud isn't supported in this browser.")).toBeInTheDocument();
  });
});

describe("formatTime", () => {
  it("formats seconds as m:ss", () => {
    expect(formatTime(0)).toBe("0:00");
    expect(formatTime(65)).toBe("1:05");
  });

  it("clamps invalid input to 0:00", () => {
    expect(formatTime(Number.NaN)).toBe("0:00");
    expect(formatTime(-5)).toBe("0:00");
  });
});

describe("estimateSpeechSeconds", () => {
  it("returns 0 for empty text", () => {
    expect(estimateSpeechSeconds("", 1)).toBe(0);
  });

  it("scales down as rate increases", () => {
    const text = "one two three four five six seven eight nine ten";
    expect(estimateSpeechSeconds(text, 2)).toBeLessThan(estimateSpeechSeconds(text, 1));
  });
});

describe("generateWaveformBars", () => {
  it("is deterministic for the same seed", () => {
    expect(generateWaveformBars("hello world", 10)).toEqual(generateWaveformBars("hello world", 10));
  });

  it("returns the requested number of bars, each within range", () => {
    const bars = generateWaveformBars("some narration text", 16);
    expect(bars).toHaveLength(16);
    for (const height of bars) {
      expect(height).toBeGreaterThanOrEqual(0.3);
      expect(height).toBeLessThanOrEqual(1);
    }
  });
});
