/**
 * FileSystemService - File system operations
 */

import fs from 'fs';
import path from 'path';
import { FileSystemError } from '../types/errors';
import { LoggerService } from './LoggerService';

export class FileSystemService {
    private static instance: FileSystemService;
    private logger: LoggerService;

    private constructor() {
        this.logger = LoggerService.getInstance();
    }

    public static getInstance(): FileSystemService {
        if (!FileSystemService.instance) {
            FileSystemService.instance = new FileSystemService();
        }
        return FileSystemService.instance;
    }

    /**
     * Ensure directory exists
     */
    public ensureDir(dirPath: string): void {
        try {
            if (!fs.existsSync(dirPath)) {
                fs.mkdirSync(dirPath, { recursive: true });
                this.logger.info(`Directory created: ${dirPath}`, {
                    component: 'FileSystemService'
                });
            }
        } catch (error) {
            throw new FileSystemError(
                `Failed to create directory: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
        }
    }

    /**
     * Read file content
     */
    public readFile(filePath: string): string {
        try {
            return fs.readFileSync(filePath, 'utf-8');
        } catch (error) {
            throw new FileSystemError(
                `Failed to read file: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
        }
    }

    /**
     * Write file content
     */
    public writeFile(filePath: string, content: string): void {
        try {
            const dir = path.dirname(filePath);
            this.ensureDir(dir);
            fs.writeFileSync(filePath, content, 'utf-8');
            this.logger.info(`File written: ${filePath}`, {
                component: 'FileSystemService'
            });
        } catch (error) {
            throw new FileSystemError(
                `Failed to write file: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
        }
    }

    /**
     * Check if path exists
     */
    public exists(filePath: string): boolean {
        return fs.existsSync(filePath);
    }

    /**
     * Delete file
     */
    public deleteFile(filePath: string): void {
        try {
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                this.logger.info(`File deleted: ${filePath}`, {
                    component: 'FileSystemService'
                });
            }
        } catch (error) {
            throw new FileSystemError(
                `Failed to delete file: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
        }
    }

    /**
     * Delete directory
     */
    public deleteDir(dirPath: string): void {
        try {
            if (fs.existsSync(dirPath)) {
                fs.rmSync(dirPath, { recursive: true, force: true });
                this.logger.info(`Directory deleted: ${dirPath}`, {
                    component: 'FileSystemService'
                });
            }
        } catch (error) {
            throw new FileSystemError(
                `Failed to delete directory: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
        }
    }

    /**
     * Copy file
     */
    public copyFile(source: string, destination: string): void {
        try {
            const dir = path.dirname(destination);
            this.ensureDir(dir);
            fs.copyFileSync(source, destination);
            this.logger.info(`File copied: ${source} -> ${destination}`, {
                component: 'FileSystemService'
            });
        } catch (error) {
            throw new FileSystemError(
                `Failed to copy file: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
        }
    }

    /**
     * Get file size
     */
    public getFileSize(filePath: string): number {
        try {
            const stats = fs.statSync(filePath);
            return stats.size;
        } catch (error) {
            throw new FileSystemError(
                `Failed to get file size: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
        }
    }

    /**
     * List directory contents
     */
    public listDir(dirPath: string): string[] {
        try {
            return fs.readdirSync(dirPath);
        } catch (error) {
            throw new FileSystemError(
                `Failed to list directory: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
        }
    }

    /**
     * Get file stats
     */
    public getStats(filePath: string): fs.Stats {
        try {
            return fs.statSync(filePath);
        } catch (error) {
            throw new FileSystemError(
                `Failed to get file stats: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
        }
    }
}
