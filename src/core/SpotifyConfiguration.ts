export interface SpotifyConfigOptions {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

export class SpotifyConfiguration {
  clientId: string;
  clientSecret: string;
  redirectUri: string;

  constructor(config: SpotifyConfigOptions) {
    this.clientId = config.clientId ?? '';
    this.clientSecret = config.clientSecret ?? '';
    this.redirectUri = config.redirectUri ?? '';
  }

  isValid(): boolean {
    return this.clientId !== '' && this.clientSecret !== '' && this.redirectUri !== '';
  }

  getClientID(): string {
    return this.clientId;
  }

  getClientSecret(): string {
    return this.clientSecret;
  }

  getRedirectUri(): string {
    return this.redirectUri;
  }
}
