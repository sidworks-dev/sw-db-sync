import {localhostRsyncDownloadCommand, sshNavigateToShopwareRootCommand, extractDatabaseDetails } from '../utils/Console';
import { Listr } from 'listr2';
import * as fs from 'fs';

class DownloadTask {
    private downloadTasks: any[] = [];

    configure = async (list: any, config: any, ssh: any) => {
        await this.addTasks(list, config, ssh);
        return list;
    }

    // Add tasks
    addTasks = async (list: any, config: any, ssh: any) => {
        list.add(
            {
                title: 'Download database from server ' + '(' + config.databases.databaseData.username + ')',
                task: (ctx: any, task: any): Listr =>
                task.newListr(
                    this.downloadTasks
                )
            }
        )

        this.downloadTasks.push(
            {
                title: 'Connecting to server through SSH',
                task: async (): Promise<void> => {
                    // Build SSH config
                    const sshConfig: any = {
                        host: config.databases.databaseData.server,
                        username: config.databases.databaseData.username,
                        port: config.databases.databaseData.port,
                        readyTimeout: 20000,
                        keepaliveInterval: 10000,
                        keepaliveCountMax: 3
                    };

                    // Add password if provided
                    if (config.databases.databaseData.password) {
                        sshConfig.password = config.databases.databaseData.password;
                    }

                    // Read private key file contents if provided
                    if (config.customConfig.sshKeyLocation && fs.existsSync(config.customConfig.sshKeyLocation)) {
                        sshConfig.privateKey = fs.readFileSync(config.customConfig.sshKeyLocation, 'utf8');
                        if (config.customConfig.sshPassphrase) {
                            sshConfig.passphrase = config.customConfig.sshPassphrase;
                        }
                    }

                    // Open connection to SSH server
                    await ssh.connect(sshConfig);
                }
            }
        );

        this.downloadTasks.push(
            {
                title: 'Retrieving server settings',
                task: async (): Promise<void> => {
                    // Retrieve settings from server to use
                    await ssh.execCommand(sshNavigateToShopwareRootCommand('pwd; which php;', config)).then((result: any) => {
                        if (result) {
                            const serverValues = result.stdout.split("\n");
                            config.serverVariables.shopwareRoot = serverValues[0];

                            // Get PHP path
                            config.serverVariables.externalPhpPath = serverValues[1];
                        }
                    });

                    // Use custom PHP path instead if given
                    if (config.databases.databaseData.externalPhpPath && config.databases.databaseData.externalPhpPath.length > 0) {
                        config.serverVariables.externalPhpPath = config.databases.databaseData.externalPhpPath;
                    }
                }
            }
        );

        this.downloadTasks.push(
            {
                title: 'Downloading Shopware6 DB Dump File to server',
                task: async (): Promise<void> => {
                    await ssh.execCommand(sshNavigateToShopwareRootCommand('curl -O https://raw.githubusercontent.com/jellesiderius/shopware6-database-dump/main/shopware6-database-dump.sh', config));
                }
            },
        );

        this.downloadTasks.push(
            {
                title: 'Dumping Shopware database and moving it to server root (' + config.settings.strip + ')',
                task: async (): Promise<void> => {
                    let username = '',
                        password = '',
                        host = '',
                        port = '',
                        database = '';

                    // Retrieve database name
                    await ssh.execCommand(sshNavigateToShopwareRootCommand('cat .env | grep "DATABASE_URL="', config)).then((result: any) => {
                        if (result) {
                            const resultValues = result.stdout,
                                databaseDetails = extractDatabaseDetails(resultValues);

                            username = databaseDetails.username;
                            password = databaseDetails.password;
                            host = databaseDetails.host;
                            port = databaseDetails.port;
                            database = databaseDetails.database;

                            config.settings.databaseFileName = database;
                        }
                    });

                    // Dump database
                    let dumpCommand = `/bin/bash shopware6-database-dump.sh -d ${database} -u ${username} -pa ${password} --host ${host} -p ${port} --gdpr`
                    if (config.settings.strip == 'full') {
                        dumpCommand = `/bin/bash shopware6-database-dump.sh -d ${database} -u ${username} -pa ${password} --host ${host} -p ${port}`
                    }

                    await ssh.execCommand(sshNavigateToShopwareRootCommand(`${dumpCommand}; mv ${config.settings.databaseFileName}.sql ~`, config));
                }
            }
        );

        this.downloadTasks.push(
            {
                title: 'Downloading Shopware 6 database to localhost',
                task: async (): Promise<void> => {
                    // Download file and place it on localhost
                    const localDatabaseFolderLocation = config.customConfig.localDatabaseFolderLocation;
                    const localDatabaseLocation = localDatabaseFolderLocation + `/${config.settings.databaseFileName}.sql`;

                    if (config.settings.rsyncInstalled) {
                        await localhostRsyncDownloadCommand(`~/${config.settings.databaseFileName}.sql`, `${localDatabaseFolderLocation}`, config);
                    } else {
                        await ssh.getFile(localDatabaseLocation, config.settings.databaseFileName + '.sql').then(function (_Contents: any) {
                        }, function (error: any) {
                            throw new Error(error)
                        });
                    }

                    // Set final message with Shopware 6 DB location
                    config.finalMessages.shopwareDatabaseLocation = localDatabaseLocation;
                    config.settings.databaseFullPath = localDatabaseFolderLocation;
                }
            }
        );

        this.downloadTasks.push(
            {
                title: 'Cleaning up and closing SSH connection',
                task: async (): Promise<void> => {
                    // Remove the Shopware 6 database file on the server
                    await ssh.execCommand(`rm ${config.settings.databaseFileName}.sql`);

                    // Remove database dump file and close connection to SSH
                    await ssh.execCommand(sshNavigateToShopwareRootCommand('rm shopware6-database-dump.sh', config));

                    // Close the SSH connection
                    await ssh.dispose();
                }
            }
        );
    }
}

export default DownloadTask
