import * as fs from 'fs'
import { Listr } from 'listr2';
import configFile from '../../config/settings.json'

class ChecksTask {
    private checkTasks: any[] = [];

    configure = async (list: any, config: any, _ssh: any) => {
        await this.addTasks(list, config, _ssh);
        return list;
    }

    // Add tasks
    addTasks = async (list: any, config: any, _ssh: any) => {
        list.add(
            {
                title: 'Running some checks',
                task: (ctx: any, task: any): Listr =>
                task.newListr(
                    this.checkTasks
                )
            }
        )

        if (config.settings.import && config.settings.import == 'yes') {
            // Check if all settings are filled in, if we import
            this.checkTasks.push(
                {
                    title: 'Checking if config/settings.json is correctly filled',
                    task: async (): Promise<void> => {
                        // Lets make sure everything is filled in
                        if (!configFile.shopwareBackend.adminUsername || configFile.shopwareBackend.adminUsername && configFile.shopwareBackend.adminUsername.length == 0) {
                            throw new Error('Admin username is missing config/settings.json');
                        }

                        if (!configFile.shopwareBackend.adminPassword || configFile.shopwareBackend.adminPassword && configFile.shopwareBackend.adminPassword.length == 0) {
                            throw new Error('Admin password is missing in config/settings.json');
                        }

                        if (!configFile.shopwareBackend.adminEmailAddress || configFile.shopwareBackend.adminEmailAddress && configFile.shopwareBackend.adminEmailAddress.length == 0) {
                            throw new Error('Admin email address is missing in config/settings.json');
                        }
                    }
                }
            );

            if (config.settings.import && config.settings.import == 'yes') {
                // Check if target folder exists before downloading
                this.checkTasks.push(
                {
                    title: 'Checking if .env file exists',
                    task: async (): Promise<boolean> => {
                        const envFileLocation = config.settings.currentFolder + '/.env';
                            if (fs.existsSync(envFileLocation)) {
                                return true;
                            }

                            throw new Error(`.env is missing, make sure ${envFileLocation} exists.`);
                        }
                    }
                );
            }
        }

        // Check if target folder exists before downloading
        this.checkTasks.push(
            {
                title: 'Checking if download folder exists',
                task: async (): Promise<boolean> => {
                    if (fs.existsSync(config.customConfig.localDatabaseFolderLocation)) {
                        return true;
                    }

                    throw new Error(`Download folder ${config.customConfig.localDatabaseFolderLocation} does not exist. This can be configured in config/settings.json`);
                }
            }
        );

        // Check if SSH key exists
        this.checkTasks.push(
            {
                title: 'Checking if SSH key exists',
                task: async (): Promise<boolean> => {
                    if (fs.existsSync(config.customConfig.sshKeyLocation)) {
                        return true;
                    }

                    throw new Error(`SSH key ${config.customConfig.sshKeyLocation} does not exist. This can be configured in config/settings.json`);
                }
            }
        );
    }
}

export default ChecksTask
