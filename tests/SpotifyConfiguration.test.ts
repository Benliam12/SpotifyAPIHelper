import { SpotifyConfiguration } from '../src/core/SpotifyConfiguration';

describe('Configuration Module', () => {
  let mainConfig: SpotifyConfiguration;

  beforeAll(() => {
    mainConfig = new SpotifyConfiguration({
      clientId: process.env.SPOTIFY_CLIENT_ID || '',
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET || '',
      redirectUri: process.env.SPOTIFY_REDIRECT_URI || '',
    });
  });

  test('Should load configuration from environment variables', () => {
    expect(process.env.SPOTIFY_CLIENT_ID).toBeDefined();
    expect(process.env.SPOTIFY_CLIENT_SECRET).toBeDefined();
    expect(process.env.SPOTIFY_REDIRECT_URI).toBeDefined();
  });

  test('Should create a valid SpotifyConfiguration instance', () => {
    expect(mainConfig.isValid()).toBe(true);
  });

  //Test all possible configurations with empty values for individual fields
  describe('Invalid Configurations', () => {
    test.each([
      {
        name: 'all values missing',
        clientId: '',
        clientSecret: '',
        redirectUri: '',
      },
      {
        name: 'clientId missing',
        clientId: '',
        clientSecret: 'someSecret',
        redirectUri: 'someUri',
      },
      {
        name: 'clientSecret missing',
        clientId: 'someId',
        clientSecret: '',
        redirectUri: 'someUri',
      },
      {
        name: 'redirectUri missing',
        clientId: 'someId',
        clientSecret: 'someSecret',
        redirectUri: '',
      },
    ])(
      'Should be invalid when $name',
      ({ clientId, clientSecret, redirectUri }) => {
        const config = new SpotifyConfiguration({
          clientId,
          clientSecret,
          redirectUri,
        });
        expect(config.isValid()).toBe(false);
      }
    );
  });

  test('Should return correct values from getters', () => {
    const clientId = process.env.SPOTIFY_CLIENT_ID || '';
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET || '';
    const redirectUri = process.env.SPOTIFY_REDIRECT_URI || '';

    expect(mainConfig.getClientID()).toBe(clientId);
    expect(mainConfig.getClientSecret()).toBe(clientSecret);
    expect(mainConfig.getRedirectUri()).toBe(redirectUri);
  });
});
