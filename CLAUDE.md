# CLAUDE.md

This file provides context for Claude Code when working on this project.

## Project Overview

Spotify API Helper (`@benliam12/spotify-api-helper`) — a TypeScript/Node.js wrapper library for the Spotify Web API. It simplifies authentication token management and provides methods for accessing Spotify data (tracks, albums, artists, playlists, search).

## Tech Stack

- **Language:** TypeScript 5.9 (strict mode)
- **Runtime:** Node.js with ESM modules (`"type": "module"`)
- **Build:** `tsc` compiler, output to `dist/`
- **Test:** Jest 29 with `ts-jest` (ESM preset)
- **Lint:** ESLint 9 + `@typescript-eslint`
- **Format:** Prettier (120 char width, single quotes, semicolons, 2-space indent)
- **Release:** semantic-release on `main` (release) and `DEV` (prerelease) branches

## Common Commands

```bash
npm run build        # Clean and compile TypeScript
npm test             # Run tests (requires .env.test.local)
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Run tests with coverage
npm run lint         # Lint src/ files
npm run release:dry  # Dry-run semantic release
```

## Project Structure

```
src/
  index.ts                    # Public exports
  core/
    SpotifyTypes.ts           # Types, interfaces, enums
    SpotifyConfiguration.ts   # API credential configuration
    SpotifyHelper.ts          # Main class — auth, API calls
tests/
  Basics.test.ts              # Smoke tests
  SpotifyConfiguration.test.ts # Configuration validation tests
  SpotifyHelper.test.ts       # API integration tests (mocked fetch)
  Fixtures/                   # Mock JSON responses
```

## Code Conventions

- **Commits:** Conventional Commits (`feat:`, `fix:`, `docs:`, `test:`, `style:`, `chore:`, `refactor:`, `perf:`)
- **Classes/Interfaces/Types/Enums:** PascalCase
- **Methods/variables:** camelCase
- **Error handling:** Result-based pattern (`SpotifyResult<T>`) — no thrown exceptions for API failures
- **Module exports:** Re-exported through `src/index.ts`

## Testing

- Tests require a `.env.test.local` file with `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, `SPOTIFY_REDIRECT_URI`
- API calls are mocked using `jest.spyOn(global, 'fetch')`
- Test fixtures live in `tests/Fixtures/`

## Key Design Decisions

- Client Credentials OAuth2 flow with automatic token refresh (configurable buffer, default 60s before expiry)
- All API methods return `null` or empty results on failure — no exceptions thrown to callers
- Optional error callback and console logging for monitoring
- The library targets ESM-only (no CJS build)
