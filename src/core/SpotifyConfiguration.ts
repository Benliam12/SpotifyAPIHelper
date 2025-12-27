export class SpotifyConfiguration {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
    constructor(clientId: string, clientSecret: string, redirectUri: string) {
        this.clientId = clientId;
        this.clientSecret = clientSecret;
        this.redirectUri = redirectUri;
    }
}