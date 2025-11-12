/**
 * VersionCheckService - Check for updates
 */

import latestVersion from 'latest-version';
import semver from 'semver';
import { LoggerService } from './LoggerService';

export class VersionCheckService {
    private static instance: VersionCheckService;
    private logger: LoggerService;
    private currentVersion: string = '';
    private latestVersion: string = '';

    private constructor() {
        this.logger = LoggerService.getInstance();
    }

    public static getInstance(): VersionCheckService {
        if (!VersionCheckService.instance) {
            VersionCheckService.instance = new VersionCheckService();
        }
        return VersionCheckService.instance;
    }

    /**
     * Check for updates
     */
    public async checkForUpdates(packageName: string, currentVersion: string): Promise<{
        updateAvailable: boolean;
        currentVersion: string;
        latestVersion: string;
    }> {
        this.currentVersion = currentVersion;

        try {
            this.latestVersion = await latestVersion(packageName);
            const updateAvailable = semver.lt(currentVersion, this.latestVersion);

            if (updateAvailable) {
                this.logger.info('Update available', {
                    component: 'VersionCheckService',
                    currentVersion,
                    latestVersion: this.latestVersion
                });
            }

            return {
                updateAvailable,
                currentVersion: this.currentVersion,
                latestVersion: this.latestVersion
            };
        } catch (error) {
            this.logger.warn('Failed to check for updates', {
                component: 'VersionCheckService',
                error: error instanceof Error ? error.message : 'Unknown error'
            });

            return {
                updateAvailable: false,
                currentVersion: this.currentVersion,
                latestVersion: this.currentVersion
            };
        }
    }

    /**
     * Get current version
     */
    public getCurrentVersion(): string {
        return this.currentVersion;
    }

    /**
     * Get latest version
     */
    public getLatestVersion(): string {
        return this.latestVersion;
    }
}
