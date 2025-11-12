import {localhostShopwareRootExec, localhostShopwareRootMysqlExec} from '../utils/Console';
import { Listr } from 'listr2';
import configFile from '../../config/settings.json';
import * as fs from 'fs';
import * as path from 'path';

class ShopwareConfigureTask {
    private configureTasks: any[] = [];

    configure = async (list: any, config: any) => {
        await this.addTasks(list, config);
        return list;
    }

    // Add tasks
    addTasks = async (list: any, config: any) => {
        list.add(
            {
                title: 'Configuring Shopware 6 for development usage',
                task: (ctx: any, task: any): Listr =>
                task.newListr(
                    this.configureTasks
                )
            }
        )

        this.configureTasks.push(
            {
                title: "Setting URL for sales channels",
                task: async (ctx: any, task: any): Promise<void> => {
                    const projectConfigPath = path.join(config.settings.currentFolder, '.sw-db-sync-config.json');
                    const hasProjectConfig = fs.existsSync(projectConfigPath);
                    
                    if (hasProjectConfig) {
                        // Load project-specific domain mapping
                        const projectConfig = JSON.parse(fs.readFileSync(projectConfigPath, 'utf8'));
                        const salesChannelDomains = projectConfig.sales_channel_domains;
                        
                        if (salesChannelDomains && Object.keys(salesChannelDomains).length > 0) {
                            task.output = `Using custom domain mapping from .sw-db-sync-config.json`;
                            
                            // Get all sales channels with their domains
                            const result = await localhostShopwareRootMysqlExec(
                                "SELECT HEX(scd.id) as id, HEX(scd.sales_channel_id) as sales_channel_id, sc.name, scd.url FROM sales_channel_domain scd LEFT JOIN sales_channel sc ON sc.id = scd.sales_channel_id",
                                config,
                                true
                            );
                            
                            const domains: string[] = [];
                            
                            // Update domains for each mapped sales channel
                            for (const [salesChannelId, domain] of Object.entries(salesChannelDomains)) {
                                const protocol = config.localhost.https ? 'https://' : 'http://';
                                const fullUrl = `${protocol}${domain}`;
                                
                                // Update the domain for this specific sales channel
                                await localhostShopwareRootMysqlExec(
                                    `UPDATE sales_channel_domain SET url = '${fullUrl}' WHERE HEX(sales_channel_id) = '${salesChannelId.toUpperCase()}'`,
                                    config
                                );
                                
                                domains.push(fullUrl);
                            }
                            
                            // Set final messages with all mapped domains
                            config.finalMessages.domains = domains;
                            config.finalMessages.importDomain = domains[0] || '';
                            
                            task.output = `Updated ${Object.keys(salesChannelDomains).length} sales channel domain(s)`;
                            return;
                        }
                    }
                    
                    // Fallback to default behavior: update all domains with single URL
                    await localhostShopwareRootExec(`bin/console sales-channel:update:domain ${config.localhost.domainUrl}`, config);

                    if (config.localhost.https) {
                        await localhostShopwareRootMysqlExec("UPDATE sales_channel_domain SET url = REPLACE(url,'http://', 'https://')", config);
                        config.finalMessages.importDomain = `https://${config.localhost.domainUrl}`;
                        config.finalMessages.domains = [`https://${config.localhost.domainUrl}`];
                    } else {
                        await localhostShopwareRootMysqlExec("UPDATE sales_channel_domain SET url = REPLACE(url,'https://', 'http://')", config);
                        config.finalMessages.importDomain = `http://${config.localhost.domainUrl}`;
                        config.finalMessages.domains = [`http://${config.localhost.domainUrl}`];
                    }
                }
            }
        );

        // Add system config task if project config exists
        const projectConfigPath = path.join(config.settings.currentFolder, '.sw-db-sync-config.json');
        if (fs.existsSync(projectConfigPath)) {
            const projectConfig = JSON.parse(fs.readFileSync(projectConfigPath, 'utf8'));
            
            if (projectConfig.system_config && Object.keys(projectConfig.system_config).length > 0) {
                this.configureTasks.push(
                    {
                        title: 'Setting system configurations from .sw-db-sync-config.json',
                        task: async (ctx: any, task: any): Promise<void> => {
                            const systemConfig = projectConfig.system_config;
                            let updateCount = 0;
                            
                            for (const [salesChannelId, configs] of Object.entries(systemConfig)) {
                                for (const [configKey, value] of Object.entries(configs as Record<string, string | number | boolean | null>)) {
                                    // Determine if this is for a specific sales channel or global (null)
                                    const channelCondition = salesChannelId === 'null' || salesChannelId === 'global' 
                                        ? "sales_channel_id IS NULL" 
                                        : `HEX(sales_channel_id) = '${salesChannelId.toUpperCase()}'`;
                                    
                                    // Convert value to JSON format for storage
                                    const jsonValue = JSON.stringify({ "_value": value });
                                    const escapedValue = jsonValue.replace(/'/g, "\\'");
                                    
                                    // Delete existing config
                                    await localhostShopwareRootMysqlExec(
                                        `DELETE FROM system_config WHERE configuration_key = '${configKey}' AND ${channelCondition}`,
                                        config
                                    );
                                    
                                    // Insert new config
                                    const salesChannelIdValue = salesChannelId === 'null' || salesChannelId === 'global' 
                                        ? "NULL" 
                                        : `UNHEX('${salesChannelId.toUpperCase()}')`;
                                    
                                    await localhostShopwareRootMysqlExec(
                                        `INSERT INTO system_config (id, configuration_key, configuration_value, sales_channel_id, created_at) VALUES (UNHEX(REPLACE(UUID(), '-', '')), '${configKey}', '${escapedValue}', ${salesChannelIdValue}, NOW())`,
                                        config
                                    );
                                    
                                    updateCount++;
                                }
                            }
                            
                            task.output = `Updated ${updateCount} system configuration value(s)`;
                        }
                    }
                );
            }
        }

        if (config.settings.syncImages == 'no') {
            this.configureTasks.push(
                {
                    title: "Emptying media tables",
                    task: async (): Promise<void> => {
                        // Product media
                        await localhostShopwareRootMysqlExec('TRUNCATE TABLE product_media', config);

                        // Theme media
                        await localhostShopwareRootMysqlExec('TRUNCATE TABLE theme_media', config);
                    }
                }
            );
        }

        this.configureTasks.push(
            {
                title: "Refreshing plugins",
                task: async (): Promise<void> => {
                    await localhostShopwareRootExec(`bin/console plugin:refresh`, config);
                }
            }
        );

        this.configureTasks.push(
            {
                title: "Compiling theme",
                task: async (): Promise<void> => {
                    await localhostShopwareRootExec(`bin/console theme:compile`, config);
                }
            }
        );

        this.configureTasks.push(
            {
                title: 'Creating a admin user',
                task: async (): Promise<void> => {
                    await localhostShopwareRootExec(`bin/console user:create -a ${configFile.shopwareBackend.adminUsername} -p ${configFile.shopwareBackend.adminPassword} --email ${configFile.shopwareBackend.adminEmailAddress}`, config);
                }
            }
        );

        this.configureTasks.push(
            {
                title: 'Reindexing Shopware (ES)',
                task: async (): Promise<void> => {
                    // Reindex
                    await localhostShopwareRootExec(`bin/console es:index -n`, config);
                    // Reset indexes
                    await localhostShopwareRootExec(`bin/console es:reset -n`, config);
                }
            }
        );

        this.configureTasks.push(
            {
                title: 'Flushing Shopware 6 caches',
                task: async (): Promise<void> => {
                    // Flush the shopware caches and import config data
                    await localhostShopwareRootExec(`bin/console cache:clear`, config);
                }
            }
        );
    }
}

export default ShopwareConfigureTask
