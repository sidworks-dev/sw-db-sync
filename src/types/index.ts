/**
 * Type definitions for sw-db-sync
 */

export interface SettingsConfig {
    general: {
        localDomainExtension: string;
        databaseLocation: string;
    };
    ssh: {
        keyLocation: string;
        passphrase: string;
    };
    shopwareBackend: {
        adminUsername: string;
        adminPassword: string;
        adminEmailAddress: string;
    };
}

export interface StaticSettings {
    settings: {
        databaseStripDevelopment: string;
        databaseStripKeepCustomerData: string;
    };
}

export interface ProjectConfig {
    [key: string]: any;
}

export interface DatabaseConfig {
    username: string;
    password: string;
    server: string;
    domainFolder: string;
    port: number;
    localProjectFolder?: string;
    externalProjectFolder: string;
    externalPhpPath?: string;
    localProjectUrl?: string;
    commandsFolder?: string;
    stagingUsername?: string;
    sshKeyName?: string;
    sshKeyLocation?: string;
}

export interface AppConfig {
    customConfig: {
        sshKeyLocation: string;
        sshPassphrase: string;
        localDatabaseFolderLocation: string;
        localDomainExtension: string;
    };
    requirements: {
        shopwareCliVersion?: string;
    };
    serverVariables: {
        shopwareVersion: number;
        externalPhpPath: string;
        shopwareRoot: string;
        shopwareCliFile: string;
        databaseName: string;
    };
    settings: {
        currentFolder: string;
        currentFolderName: string;
        strip: string;
        syncImages: string;
        shopwareLocalhostDomainName: string;
        rsyncInstalled: boolean;
        import: string;
        currentFolderIsShopware: boolean;
        runCommands: boolean;
        shopwareCliCommand: string;
        shopwareCliCommandLocal: string;
        databaseCommand: string;
        syncImageTypes: any;
        syncTypes: any;
    };
    finalMessages: {
        shopwareDatabaseLocation: string;
        shopwareDatabaseIncludeLocation: string;
        importDomain: string;
        domains: string[];
    };
    databases: {
        databasesList: any;
        databaseType: string | null;
        databaseData: DatabaseConfig | null;
    };
}
