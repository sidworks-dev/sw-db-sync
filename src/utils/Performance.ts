/**
 * Performance utilities
 */

import { NodeSSH } from 'node-ssh';

/**
 * SSH Connection Pool for reusing connections
 */
export class SSHConnectionPool {
    private static connections: Map<string, NodeSSH> = new Map();

    /**
     * Get or create an SSH connection
     */
    static async getConnection(key: string, config: any): Promise<NodeSSH> {
        if (this.connections.has(key)) {
            const conn = this.connections.get(key)!;
            if (conn.isConnected()) {
                return conn;
            }
        }

        const ssh = new NodeSSH();
        await ssh.connect(config);
        this.connections.set(key, ssh);
        return ssh;
    }

    /**
     * Close a specific connection
     */
    static async closeConnection(key: string): Promise<void> {
        const conn = this.connections.get(key);
        if (conn) {
            conn.dispose();
            this.connections.delete(key);
        }
    }

    /**
     * Close all connections
     */
    static async closeAll(): Promise<void> {
        for (const [_key, conn] of this.connections) {
            conn.dispose();
        }
        this.connections.clear();
    }
}
