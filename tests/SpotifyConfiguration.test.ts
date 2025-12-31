import {SpotifyConfiguration} from "../src/core/SpotifyConfiguration";

describe('Configuration Module', () => {
    let mainConfig: SpotifyConfiguration;
    
    beforeAll(() => {
        mainConfig = new SpotifyConfiguration({
            clientId: process.env.SPOTIFY_CLIENT_ID || "",
            clientSecret: process.env.SPOTIFY_CLIENT_SECRET || "",
            redirectUri: process.env.SPOTIFY_REDIRECT_URI || ""
        });
    });

    test('Should load configuration from environment variables', async () => {
        expect(process.env.SPOTIFY_CLIENT_ID).toBeDefined();
        expect(process.env.SPOTIFY_CLIENT_SECRET).toBeDefined();
        expect(process.env.SPOTIFY_REDIRECT_URI).toBeDefined();
    });

    test('Should create a valid SpotifyConfiguration instance', async () => {
        expect(mainConfig.isValid()).toBe(true);
    });

    //Test all possible configurations with empty values for individual fields
    describe('Invalid Configurations', () => {
        test('Should create an invalid SpotifyConfiguration instance with missing values', async () => {
            const config = new SpotifyConfiguration({
                clientId: "",
                clientSecret: "",
                redirectUri: ""
            });
            expect(config.isValid()).toBe(false);
        });
        test('Should create an invalid SpotifyConfiguration instance with missing clientId', async () => {
            const config = new SpotifyConfiguration({
                clientId: "",
                clientSecret: "someSecret",
                redirectUri: "someUri"
            });
            expect(config.isValid()).toBe(false);
        });
        test('Should create an invalid SpotifyConfiguration instance with missing clientSecret', async () => {
            const config = new SpotifyConfiguration({
                clientId: "someId", 
                clientSecret: "",
                redirectUri: "someUri"  
            });
            expect(config.isValid()).toBe(false);
        });
        test('Should create an invalid SpotifyConfiguration instance with missing redirectUri', async () => {
            const config = new SpotifyConfiguration({
                clientId: "someId",
                clientSecret: "someSecret",
                redirectUri: ""
            });
            expect(config.isValid()).toBe(false);
        });
    });

    test('Should return correct values from getters', async () => {
        const clientId = process.env.SPOTIFY_CLIENT_ID || "";
        const clientSecret = process.env.SPOTIFY_CLIENT_SECRET || "";
        const redirectUri = process.env.SPOTIFY_REDIRECT_URI || "";

        expect(mainConfig.getClientID()).toBe(clientId);
        expect(mainConfig.getClientSecret()).toBe(clientSecret);
        expect(mainConfig.getRedirectUri()).toBe(redirectUri);
    });
})