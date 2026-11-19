"use client";

let sharedCtx: AudioContext | null = null;

/**
 * Plays a single, short "ding" via the Web Audio API — a one-shot chime,
 * unlike useRingtone's repeating alarm. Callers are responsible for only
 * invoking this once per genuinely new event (the pending-popups API
 * already guarantees that server-side).
 */
export function playNotificationChime() {
  if (typeof window === "undefined") return;
  type WindowWithWebkitAudio = typeof window & {
    webkitAudioContext?: typeof AudioContext;
  };
  const AudioContextCtor =
    window.AudioContext || (window as WindowWithWebkitAudio).webkitAudioContext;
  if (!AudioContextCtor) return;

  const ctx = sharedCtx ?? new AudioContextCtor();
  sharedCtx = ctx;
  if (ctx.state === "suspended") ctx.resume().catch(() => {});

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.value = 988;
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.2, now + 0.02);
  gain.gain.linearRampToValueAtTime(0, now + 0.45);
  osc.connect(gain).connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.45);
}

const SOUND_KEY = "wira_quotation_sound_enabled";

export function readSoundEnabled() {
  if (typeof window === "undefined") return true;
  try {
    return localStorage.getItem(SOUND_KEY) !== "off";
  } catch {
    return true;
  }
}

export function writeSoundEnabled(enabled: boolean) {
  try {
    localStorage.setItem(SOUND_KEY, enabled ? "on" : "off");
  } catch {
    // ignore (private browsing, storage disabled, etc.)
  }
}
