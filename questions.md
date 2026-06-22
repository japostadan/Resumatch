# CV Matching Game — Instructor Clarification Questions

## Deployment & Operations

- [ ] What platform should we deploy to? Is there a CYF-preferred host or a hosting budget?
- [ ] Who owns the deployment after the project is done — does CYF take it over, or is it ours?
- [ ] "Easy for CYF volunteers to maintain" — does this mean documentation, or a specific setup requirement?

## Tech Stack

- [ ] Are there any required or forbidden technologies for this project?
- [ ] Is there a minimum test coverage requirement, or is "enough testing" left to our judgement?

## Game Mechanics

- [ ] How many trainees typically play at once? (Affects state management and load assumptions)
- [ ] Can a volunteer restart a game mid-session, or is a game single-run only?
- [ ] Can a trainee change their personal statement after submitting it?
- [ ] During voting, does the volunteer manually advance to results, or does it auto-advance when all players have voted?
- [ ] Can a player vote for their own statement (i.e. do they see their own name in the options list)?

## Auth & Access

- [ ] The spec says "not easy to accidentally view a personal statement" — is a simple room password enough, or do we need something stronger?
- [ ] Does the volunteer need any special controls beyond creating the game (e.g. kick a player, skip a statement)?
- [ ] Players join using a server-generated game ID + a volunteer-chosen password — is this sufficient security for the classroom context?

## Results & End State

- [ ] Should results be shareable/exportable (e.g. screenshot, PDF), or just displayed on screen?
- [ ] After the 24-hour deletion window, should there be any confirmation to the volunteer that data was deleted?

## Accessibility

- [ ] Are there specific accessibility standards we must meet (WCAG AA, specific screen reader support)?
