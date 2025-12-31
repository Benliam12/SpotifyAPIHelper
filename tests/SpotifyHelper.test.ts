import {SpotifyHelper} from "../src/core/SpotifyHelper.js";
import {SpotifyConfiguration} from "../src/core/SpotifyConfiguration.js";
import { SearchType } from "../src/core/SpotifyTypes.js";

describe('Spotify Helper Module', () => {

    let spotifyHelper: SpotifyHelper;

    beforeAll(async () => {
        const config = new SpotifyConfiguration({
            clientId: process.env.SPOTIFY_CLIENT_ID || "",
            clientSecret: process.env.SPOTIFY_CLIENT_SECRET || "",
            redirectUri: process.env.SPOTIFY_REDIRECT_URI || ""
        });
        spotifyHelper = new SpotifyHelper(config);
        await spotifyHelper.initialize();
    });

    describe('Initialization', () => {
        test('Should initialize SpotifyHelper instance', async () => {
            expect(spotifyHelper).toBeDefined();
        });

        test('Should have a valid SpotifyConfiguration instance', async () => {
            expect(spotifyHelper.getConfig()).toBeDefined();
            expect(spotifyHelper.getConfig().isValid()).toBe(true);
        });
    });

    describe('Seach Functionality', () => {
        test('Should perform a search for albums', async () => {
            const results = await spotifyHelper.search("The Dark Side of the Moon", SearchType.ALBUM, 5);
            expect(results).toBeDefined();
            expect(results.albums).toBeDefined();
            expect(results.albums.items.length).toBeGreaterThan(0);
        });
    });

}); 