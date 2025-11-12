/**
 * SSHService - SSH connection management
 */

import { NodeSSH } from 'node-ssh';
import fs from 'fs';
import { SSHError } from '../types/errors';
import { LoggerService } from './LoggerService';
import { RetryService } from './RetryService';

export interface SSHConfig {
    host: string;
    port?: number;
    username: string;
    password?: string;
    privateKeyPath?: string;
    passphrase?: string;
}

export class SSHService {
    private static instance: SSHService;
    private connections: Map<string, NodeSSH>;
    private logger: LoggerService;
    private retry: RetryService;

    private constructor() {
        this.connections = new Map();
        this.logger = LoggerService.getInstance();
        this.retry = RetryService.getInstance();
    }

    public static getInstance(): SSHService {
        if (!SSHService.instance) {
            SSHService.instance = new SSHService();
        }
        return SSHService.instance;
    }

    /**
     * Create SSH connection
     */
    public async connect(config: SSHConfig, connectionId?: string): Promise<NodeSSH> {
        const id = connectionId || `${config.username}@${config.host}`;

        // Return existing connection if available
        if (this.connections.has(id)) {
            const existing = this.connections.get(id)!;
            if (existing.isConnected()) {
                return existing;
            }
        }

        const ssh = new NodeSSH();

        try {
            const connectionConfig: any = {
                host: config.host,
                port: config.port || 22,
                username: config.username,
                readyTimeout: 20000,
                keepaliveInterval: 10000,
                keepaliveCountMax: 3
            };

            if (config.password) {
                connectionConfig.password = config.password;
            }

            if (config.privateKeyPath && fs.existsSync(config.privateKeyPath)) {
                // Read the private key file contents, not just the path
                connectionConfig.privateKey = fs.readFileSync(config.privateKeyPath, 'utf8');
                if (config.passphrase) {
                    connectionConfig.passphrase = config.passphrase;
                }
            }

            await this.retry.execute(
                () => ssh.connect(connectionConfig),
                {
                    maxAttempts: 3,
                    shouldRetry: (error) => this.retry.isRetryableError(error)
                }
            );

            this.connections.set(id, ssh);

            this.logger.info(`SSH connection established: ${id}`, {
                component: 'SSHService'
            });

            return ssh;
        } catch (error) {
            throw new SSHError(
                `Failed to establish SSH connection to ${config.host}: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
        }
    }

    /**
     * Execute command via SSH
     */
    public async execCommand(
        ssh: NodeSSH,
        command: string,
        options?: { cwd?: string }
    ): Promise<{ stdout: string; stderr: string; code: number | null }> {
        try {
            const result = await ssh.execCommand(command, options);
            
            if (result.code !== 0 && result.code !== null) {
                this.logger.warn(`Command exited with code ${result.code}`, {
                    component: 'SSHService',
                    command,
                    code: result.code
                });
            }

            return result;
        } catch (error) {
            throw new SSHError(
                `Failed to execute SSH command: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
        }
    }

    /**
     * Upload file via SFTP
     */
    public async putFile(
        ssh: NodeSSH,
        localPath: string,
        remotePath: string
    ): Promise<void> {
        try {
            await ssh.putFile(localPath, remotePath);
            this.logger.info(`File uploaded: ${localPath} -> ${remotePath}`, {
                component: 'SSHService'
            });
        } catch (error) {
            throw new SSHError(
                `Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
        }
    }

    /**
     * Download file via SFTP
     */
    public async getFile(
        ssh: NodeSSH,
        remotePath: string,
        localPath: string
    ): Promise<void> {
        try {
            await ssh.getFile(localPath, remotePath);
            this.logger.info(`File downloaded: ${remotePath} -> ${localPath}`, {
                component: 'SSHService'
            });
        } catch (error) {
            throw new SSHError(
                `Failed to download file: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
        }
    }

    /**
     * Close specific connection
     */
    public async close(connectionId: string): Promise<void> {
        const ssh = this.connections.get(connectionId);
        if (ssh) {
            ssh.dispose();
            this.connections.delete(connectionId);
            this.logger.info(`SSH connection closed: ${connectionId}`, {
                component: 'SSHService'
            });
        }
    }

    /**
     * Close all connections
     */
    public async closeAll(): Promise<void> {
        for (const [id, ssh] of this.connections) {
            ssh.dispose();
            this.logger.info(`SSH connection closed: ${id}`, {
                component: 'SSHService'
            });
        }
        this.connections.clear();
    }

    /**
     * Get active connection count
     */
    public getConnectionCount(): number {
        return this.connections.size;
    }
}
