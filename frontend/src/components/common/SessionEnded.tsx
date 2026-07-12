import { Shell } from "./Shell";
import { Eyebrow } from "./Eyebrow";
import { Heading } from "./Heading";

export function SessionEnded() {
  return (
    <Shell>
      <Eyebrow>Session ended</Eyebrow>
      <Heading>Rejoin the game</Heading>
      <p className="mt-5 max-w-[42ch] text-base leading-relaxed text-muted">
        We couldn&apos;t find your session on this device. Head back and rejoin with the Game ID and
        password.
      </p>
    </Shell>
  );
}
