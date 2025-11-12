/**
 * DatabaseService - Database operations and utilities
 */

import { DatabaseError } from '../types/errors';
import { LoggerService } from './LoggerService';
import { CommandService } from './CommandService';

export interface DatabaseCredentials {
    host: string;
    port?: number;
    username: string;
    password: string;
    database: string;
}

export class DatabaseService {
    private static instance: DatabaseService;
    private logger: LoggerService;
    private command: CommandService;

    private constructor() {
        this.logger = LoggerService.getInstance();
        this.command = CommandService.getInstance();
    }

    public static getInstance(): DatabaseService {
        if (!DatabaseService.instance) {
            DatabaseService.instance = new DatabaseService();
        }
        return DatabaseService.instance;
    }

    /**
     * Test database connection
     */
    public async testConnection(credentials: DatabaseCredentials): Promise<boolean> {
        try {
            const result = await this.command.executeShell(
                `mysql -h ${credentials.host} -u ${credentials.username} -p${credentials.password} -e "SELECT 1"`
            );

            return result.exitCode === 0;
        } catch (error) {
            this.logger.error('Database connection test failed', error as Error, {
                component: 'DatabaseService'
            });
            return false;
        }
    }

    /**
     * Import SQL file
     */
    public async importSql(
        credentials: DatabaseCredentials,
        sqlFilePath: string
    ): Promise<void> {
        try {
            const command = this.buildMysqlCommand(credentials);
            const result = await this.command.executeShell(
                `${command} < ${sqlFilePath}`
            );

            if (result.exitCode !== 0) {
                throw new DatabaseError(`Import failed: ${result.stderr}`);
            }

            this.logger.info(`Database imported: ${sqlFilePath}`, {
                component: 'DatabaseService'
            });
        } catch (error) {
            throw new DatabaseError(
                `Failed to import database: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
        }
    }

    /**
     * Export database
     */
    public async exportDatabase(
        credentials: DatabaseCredentials,
        outputPath: string,
        options?: {
            strip?: string[];
            includeData?: boolean;
        }
    ): Promise<void> {
        try {
            let command = `mysqldump -h ${credentials.host} -u ${credentials.username} -p${credentials.password} ${credentials.database}`;

            if (options?.includeData === false) {
                command += ' --no-data';
            }

            if (options?.strip && options.strip.length > 0) {
                options.strip.forEach(table => {
                    command += ` --ignore-table=${credentials.database}.${table}`;
                });
            }

            command += ` > ${outputPath}`;

            const result = await this.command.executeShell(command);

            if (result.exitCode !== 0) {
                throw new DatabaseError(`Export failed: ${result.stderr}`);
            }

            this.logger.info(`Database exported: ${outputPath}`, {
                component: 'DatabaseService'
            });
        } catch (error) {
            throw new DatabaseError(
                `Failed to export database: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
        }
    }

    /**
     * Execute SQL query
     */
    public async executeQuery(
        credentials: DatabaseCredentials,
        query: string
    ): Promise<string> {
        try {
            const command = this.buildMysqlCommand(credentials);
            const result = await this.command.executeShell(
                `${command} -e "${query}"`
            );

            if (result.exitCode !== 0) {
                throw new DatabaseError(`Query failed: ${result.stderr}`);
            }

            return result.stdout;
        } catch (error) {
            throw new DatabaseError(
                `Failed to execute query: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
        }
    }

    /**
     * Get database size
     */
    public async getDatabaseSize(credentials: DatabaseCredentials): Promise<number> {
        try {
            const query = `SELECT SUM(data_length + index_length) as size FROM information_schema.TABLES WHERE table_schema = '${credentials.database}'`;
            const result = await this.executeQuery(credentials, query);
            
            // Parse the size from result
            const match = result.match(/\d+/);
            return match ? parseInt(match[0]) : 0;
        } catch (error) {
            this.logger.warn('Failed to get database size', {
                component: 'DatabaseService',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            return 0;
        }
    }

    /**
     * Build MySQL command string
     */
    private buildMysqlCommand(credentials: DatabaseCredentials): string {
        let command = 'mysql';
        
        if (credentials.host) {
            command += ` -h ${credentials.host}`;
        }
        
        if (credentials.port) {
            command += ` -P ${credentials.port}`;
        }
        
        command += ` -u ${credentials.username}`;
        
        if (credentials.password) {
            command += ` -p${credentials.password}`;
        }
        
        command += ` ${credentials.database}`;
        
        return command;
    }
}
