import { SpotifyConfiguration } from "./SpotifyConfiguration";
import { Album } from "./SpotifyTypes";

export class SpotifyHelper {
    config: SpotifyConfiguration;
        
    constructor(config: SpotifyConfiguration) {
        this.config = config;
    }

    async getAlbum(albumId: string): Promise<Album | null>{
        try{

        } catch (error){
            return null;
        }

        return null;
    }

    async getTrack(trackId: string) : Promise<void>{
    
    
    }

}