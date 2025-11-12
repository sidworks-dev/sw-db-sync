import { consoleCommand } from "../utils/Console";
import { ServiceContainer } from '../core/ServiceContainer';

class OpenFolderController {
    private services: ServiceContainer;

    constructor() {
        this.services = ServiceContainer.getInstance();
    }

    // V2 compatibility method
    public async execute(): Promise<void> {
        await this.executeStart(undefined);
    }

    executeStart = async (_serviceName: string | undefined): Promise<boolean> => {
        const configService = this.services.getConfig();
        const databaseLocation = configService.getSettingsConfig().general.databaseLocation;
        
        await consoleCommand(`open ${databaseLocation}`, false);
        
        process.exit();
    }
}

export default OpenFolderController;
export { OpenFolderController };
