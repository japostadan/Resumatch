import { Shell } from "./Shell";
import { Eyebrow } from "./Eyebrow";
import { Heading } from "./Heading";
import { Muted } from "./Muted";

export function SessionEnded() {
  return (
    <Shell>
      <Eyebrow>Session ended</Eyebrow>
      <Heading>Rejoin the game</Heading>
      <Muted>
        We couldn&apos;t find your session on this device. Head back and rejoin with the Game ID and
        password.
      </Muted>
    </Shell>
  );
}
