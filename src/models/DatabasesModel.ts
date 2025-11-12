import * as fs from 'fs';
import { ConfigPathResolver } from '../utils/ConfigPathResolver';

interface DatabaseEntry {
	username: string;
	password?: string;
	server: string;
	domainFolder: string;
	port?: string | number;
	externalProjectFolder?: string;
	externalPhpPath?: string;
	localProjectUrl?: string;
}

interface DatabaseConfig {
	databases: {
		[key: string]: DatabaseEntry;
	};
}

class DatabasesModel {
	public databasesList: { [k: string]: any } = [];
	public databaseData = {
		'username': '',
		'password': '',
		'server': '',
		'domainFolder': '',
		'port': 22,
		'localProjectFolder': '',
		'externalProjectFolder': '',
		'externalPhpPath': '',
	};

	/**
	 * Load database configuration from file
	 */
	private loadDatabaseConfig(databaseType: string): DatabaseConfig | null {
		try {
			const configPath = ConfigPathResolver.resolveConfigPath(`databases/${databaseType}.json`);
			
			if (!configPath) {
				console.error(`Database config not found: databases/${databaseType}.json`);
				return null;
			}

			const configContent = fs.readFileSync(configPath, 'utf8');
			return JSON.parse(configContent) as DatabaseConfig;
		} catch (error) {
			console.error(`Error loading database config for ${databaseType}:`, error);
			return null;
		}
	}

	// Collect databases | collect single database
	collectDatabaseData = async (databaseKey: string | void, databaseType: string | void ) => {
		const type = databaseType || 'staging';
		const config = this.loadDatabaseConfig(type.toString());

		if (!config || !config.databases) {
			console.error(`No databases found in ${type} configuration`);
			return;
		}

		const databases = config.databases;

		for (const [key, database] of Object.entries(databases)) {
			if (databaseKey == key) {
				// Collect single database info
				this.databaseData.username = database.username;
				this.databaseData.password = database.password || '';
				this.databaseData.server = database.server;
				this.databaseData.domainFolder = database.domainFolder;
				this.databaseData.port = typeof database.port === 'string' ? parseInt(database.port) : (database.port || 22);
				this.databaseData.externalProjectFolder = database.externalProjectFolder || '';
				this.databaseData.externalPhpPath = database.externalPhpPath || '';
			} else {
				// Collect all database
				this.databasesList.push(`${database.domainFolder} / ${database.username} (${key})`);
			}
		}
	}
}

export default DatabasesModel;
