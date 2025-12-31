import {SpotifyHelper} from "../src/core/SpotifyHelper.js";
import {SpotifyConfiguration} from "../src/core/SpotifyConfiguration.js";
import { SearchType } from "../src/core/SpotifyTypes.js";
import searchFixtures from "./Fixtures/Seach.json";
import { jest } from '@jest/globals';
import { mock } from "node:test";

describe('Spotify Helper Module', () => {
    let mockFetch: any
    let spotifyHelper: SpotifyHelper;

    beforeEach(async () => {
        // 1. Create mockFetch FIRST
        mockFetch = jest.fn()
        global.fetch = mockFetch as any;

        // 2. Mock token response
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                access_token: "mock",
                token_type: "Bearer",
                expires_in: 3600
            })
        });

        // 3. Create config and helper
        const config = new SpotifyConfiguration({
            clientId: process.env.SPOTIFY_CLIENT_ID || "",
            clientSecret: process.env.SPOTIFY_CLIENT_SECRET || "",
            redirectUri: process.env.SPOTIFY_REDIRECT_URI || ""
        });

        spotifyHelper = new SpotifyHelper(config);
        
        // 4. Initialize (this will use the mocked token)
        await spotifyHelper.initialize();
        
        // 5. Clear mock history for cleaner test assertions
        mockFetch.mockClear();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('Initialization', () => {
        test('Should initialize SpotifyHelper instance', () => {
            expect(spotifyHelper).toBeDefined();
        });

        test('Should have a valid SpotifyConfiguration instance', () => {
            expect(spotifyHelper.getConfig()).toBeDefined();
            expect(spotifyHelper.getConfig().isValid()).toBe(true);
        });
    });

    describe('Search Functionality', () => {
        test('Should perform a search for albums', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => searchFixtures
            });

            const results = await spotifyHelper.search("What is sounds like", SearchType.TRACK);
            expect(results).toBeDefined();
            expect(mockFetch).toHaveBeenCalledTimes(1); // Only the search call
            expect(mockFetch).toHaveBeenCalledWith(
                "https://api.spotify.com/v1/search?q=What%20is%20sounds%20like&type=track&limit=20&offset=0",
                expect.objectContaining({
                    method: "GET",
                })
            );
        });
    });
});