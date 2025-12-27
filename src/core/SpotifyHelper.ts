import { SpotifyConfiguration } from "./SpotifyConfiguration.js";
import { Album, Track, Artist } from "./SpotifyTypes.js";

export class SpotifyHelper {
    config: SpotifyConfiguration;
        
    constructor(config: SpotifyConfiguration) {
        this.config = config;
    }

    test(): string {
        return "SpotifyHelper is working!";
    }

    async getAlbum(albumId: string): Promise<Album>{
        throw new Error("Method not implemented.");
    }

    async getTrack(trackId: string) : Promise<Track>{
        throw new Error("Method not implemented.");
    }

    async getArtist(artistId: string) : Promise<Artist>{
        throw new Error("Method not implemented.");
    }

    async getPlaylist(playlistId: string) : Promise<void>{
        throw new Error("Method not implemented.");
    }

    async getAvailableMarkets() : Promise<string[]>{
        throw new Error("Method not implemented.");
    }

}