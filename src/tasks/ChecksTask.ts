import * as fs from 'fs'
import { Listr } from 'listr2';
import configFile from '../../config/settings.json'
import { ConfigPathResolver } from '../utils/ConfigPathResolver';

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

        // Check if target folder exists before downloading (or create it)
        this.checkTasks.push(
            {
                title: 'Checking if download folder exists',
                task: async (): Promise<boolean> => {
                    const downloadFolder = config.customConfig.localDatabaseFolderLocation;
                    
                    if (fs.existsSync(downloadFolder)) {
                        return true;
                    }

                    // Try to create the folder
                    try {
                        fs.mkdirSync(downloadFolder, { recursive: true });
                        return true;
                    } catch (error) {
                        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
                        throw new Error(
                            `Download folder does not exist and could not be created:\n` +
                            `  Path: ${downloadFolder}\n` +
                            `  Error: ${errorMsg}\n\n` +
                            `You can change this location in your settings.json file:\n` +
                            `  ${ConfigPathResolver.getUserConfigDir()}/settings.json`
                        );
                    }
                }
            }
        );

        // Check if SSH key exists
        this.checkTasks.push(
            {
                title: 'Checking if SSH key exists',
                task: async (): Promise<boolean> => {
                    const sshKeyPath = config.customConfig.sshKeyLocation;
                    
                    if (fs.existsSync(sshKeyPath)) {
                        return true;
                    }

                    throw new Error(
                        `SSH key not found:\n` +
                        `  Path: ${sshKeyPath}\n\n` +
                        `You can change this location in your settings.json file:\n` +
                        `  ${ConfigPathResolver.getUserConfigDir()}/settings.json`
                    );
                }
            }
        );
    }
}

export default ChecksTask
