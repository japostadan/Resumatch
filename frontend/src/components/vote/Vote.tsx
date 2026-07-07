import { useGameSession } from "../../hooks/useGameSession";
import { PlayerVote } from "./PlayerVote";
import { HostAdvance } from "./HostAdvance";

// Lobby when the game becomes ACTIVE; the voting UI itself is built in Slice C.
export function Vote() {
  const { session } = useGameSession();

  return session?.role === "player" ? <PlayerVote /> : <HostAdvance />;
}
