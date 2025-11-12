/**
 * Custom error classes for sw-db-sync v2
 */

export class SwDbSyncError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'SwDbSyncError';
    }
}

export class ConfigurationError extends SwDbSyncError {
    constructor(message: string) {
        super(message);
        this.name = 'ConfigurationError';
    }
}

export class SSHError extends SwDbSyncError {
    constructor(message: string) {
        super(message);
        this.name = 'SSHError';
    }
}

export class DatabaseError extends SwDbSyncError {
    constructor(message: string) {
        super(message);
        this.name = 'DatabaseError';
    }
}

export class ValidationError extends SwDbSyncError {
    constructor(message: string) {
        super(message);
        this.name = 'ValidationError';
    }
}

export class FileSystemError extends SwDbSyncError {
    constructor(message: string) {
        super(message);
        this.name = 'FileSystemError';
    }
}
