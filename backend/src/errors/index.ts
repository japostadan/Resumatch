export class GameNotFoundError extends Error {
  readonly status = 404
  constructor() { super('Game not found') }
}

export class GameExpiredError extends Error {
  readonly status = 404
  constructor() { super('Game has expired') }
}

export class WrongPasswordError extends Error {
  readonly status = 403
  constructor() { super('Wrong password') }
}

export class BadTokenError extends Error {
  readonly status = 403
  constructor() { super('Missing or invalid token') }
}

export class WrongStatusError extends Error {
  readonly status = 409
  constructor(message: string) { super(message) }
}

export class AlreadyVotedError extends Error {
  readonly status = 409
  constructor() { super('You have already voted on this statement') }
}

export class AlreadySubmittedError extends Error {
  readonly status = 409
  constructor() { super('You have already submitted a statement') }
}

export class NotEnoughPlayersError extends Error {
  readonly status = 422
  constructor() { super('At least 2 players must have submitted a statement') }
}

export type GameError =
  | GameNotFoundError
  | GameExpiredError
  | WrongPasswordError
  | BadTokenError
  | WrongStatusError
  | AlreadyVotedError
  | AlreadySubmittedError
  | NotEnoughPlayersError

export function isGameError(err: unknown): err is GameError {
  return (
    err instanceof GameNotFoundError ||
    err instanceof GameExpiredError ||
    err instanceof WrongPasswordError ||
    err instanceof BadTokenError ||
    err instanceof WrongStatusError ||
    err instanceof AlreadyVotedError ||
    err instanceof AlreadySubmittedError ||
    err instanceof NotEnoughPlayersError
  )
}
