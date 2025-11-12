/**
 * SelfUpdateController - Update sw-db-sync to latest version
 */
import { getInstalledPath } from 'get-installed-path';
import { ServiceContainer } from '../core/ServiceContainer';
import { UI } from '../utils/UI';

class SelfUpdateController {
    private services: ServiceContainer;

    constructor() {
        this.services = ServiceContainer.getInstance();
    }

    public async execute(): Promise<void> {
        await this.executeStart();
    }

    executeStart = async (): Promise<void> => {
        try {
            const packageJson = require('../../package.json');
            const versionCheck = this.services.getVersionCheck();
            const commandService = this.services.getCommand();
            
            const versionInfo = await versionCheck.checkForUpdates('sw-db-sync', packageJson.version);

            if (!versionInfo.updateAvailable) {
                UI.success('sw-db-sync is already up to date!');
                process.exit(0);
            }

            UI.info(`Updating from ${versionInfo.currentVersion} to ${versionInfo.latestVersion}...`);

            const npmPath = await getInstalledPath('sw-db-sync');

            // Update using npm
            const result = await commandService.executeShell(
                `cd ${npmPath} && npm install -g sw-db-sync@latest`
            );

            if (result.exitCode === 0) {
                UI.success(`Updated sw-db-sync from ${versionInfo.currentVersion} to ${versionInfo.latestVersion}`);
            } else {
                UI.error('Update failed. Please try: npm install -g sw-db-sync@latest');
            }

            process.exit(0);
        } catch (error) {
            UI.error(`Update failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            process.exit(1);
        }
    }
}

export default SelfUpdateController;
export { SelfUpdateController };
