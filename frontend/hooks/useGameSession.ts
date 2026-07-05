import { useCallback } from "react";

export function useGameSession() {
  const getPlayerToken = useCallback(() => {
    const params = new URLSearchParams(
      window.location.hash.slice(1),
    );

    return params.get("playerToken");
  }, []);

  const setPlayerToken = useCallback((token: string) => {
    const params = new URLSearchParams(
      window.location.hash.slice(1),
    );

    params.set("playerToken", token);

    window.location.hash = params.toString();
  }, []);

  return {
    getPlayerToken,
    setPlayerToken,
  };
}