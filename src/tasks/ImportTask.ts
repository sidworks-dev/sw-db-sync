import {extractDatabaseDetails, localhostShopwareRootExec} from '../utils/Console';
import { Listr } from 'listr2';

class ImportTask {
    private importTasks: any[] = [];

    configure = async (list: any, config: any) => {
        await this.addTasks(list, config);
        return list;
    }

    // Add tasks
    addTasks = async (list: any, config: any) => {
        list.add(
            {
                title: 'Import Shopware database to localhost',
                task: (ctx: any, task: any): Listr =>
                task.newListr(
                    this.importTasks
                )
            }
        )

        this.importTasks.push(
            {
                title: 'Getting localhost .env info',
                task: async (): Promise<void> => {
                    await localhostShopwareRootExec(`cat .env | grep "DATABASE_URL="`, config).then((result: any) => {
                        if (result) {
                            const databaseDetails = extractDatabaseDetails(result);

                            config.localhost.username = databaseDetails.username;
                            config.localhost.password = databaseDetails.password;
                            config.localhost.host = databaseDetails.host;
                            config.localhost.port = databaseDetails.port;
                            config.localhost.database = databaseDetails.database;
                        }
                    });

                    await localhostShopwareRootExec(`cat .env | grep "APP_URL="`, config).then((result: any) => {
                        if (result) {
                            const appUrl = result,
                                splittedAppUrl = appUrl.split('//'),
                                appUrlFromArray = splittedAppUrl[1].replace('"', '').trim();

                            config.localhost.domainUrl = appUrlFromArray;

                            // Determine http or https
                            if (appUrl.indexOf('https') !== -1) {
                                config.localhost.https = true;
                            }
                        }
                    });
                }
            }
        );

        this.importTasks.push(
            {
                title: 'Importing database to localhost',
                task: async (): Promise<void> => {
                    // Drop database
                    await localhostShopwareRootExec(`mysqladmin -u ${config.localhost.username} --password=${config.localhost.password} drop ${config.localhost.database} -f`, config, true);

                    // Create database
                    await localhostShopwareRootExec(`mysqladmin -u ${config.localhost.username} --password=${config.localhost.password} create ${config.localhost.database} -f`, config, true);

                    // Import database
                    await localhostShopwareRootExec(`mysql -u ${config.localhost.username} --password=${config.localhost.password} ${config.localhost.database} --force < ${config.settings.databaseFullPath}/${config.settings.databaseFileName}.sql`, config, true);
                }
            }
        );

        if (config.settings.syncImages == 'yes') {
            this.importTasks.push(
                {
                    title: 'Synchronizing public/media & public/thumbnail',
                    task: async (): Promise<void> => {
                        // Sync media
                        await localhostShopwareRootExec(`rsync -avz -e "ssh -p ${config.databases.databaseData.port}" ${config.databases.databaseData.username}@${config.databases.databaseData.server}:${config.serverVariables.shopwareRoot}/public/media/* public/media/`, config, true, false, true);

                        // Sync thumbnail
                        await localhostShopwareRootExec(`rsync -avz -e "ssh -p ${config.databases.databaseData.port}" ${config.databases.databaseData.username}@${config.databases.databaseData.server}:${config.serverVariables.shopwareRoot}/public/thumbnail/* public/thumbnail/`, config, true, false, true);
                    }
                }
            );
        }

        this.importTasks.push(
            {
                title: 'Cleaning up',
                task: async (): Promise<void> => {
                    // Remove local SQL file
                    await localhostShopwareRootExec(`rm ${config.settings.databaseFileName}.sql`, config);
                }
            }
        );
    }
}

export default ImportTask
