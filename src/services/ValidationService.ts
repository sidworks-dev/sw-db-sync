/**
 * ValidationService - Input validation and data verification
 */

import { ValidationError } from '../types/errors';

export class ValidationService {
    private static instance: ValidationService;

    private constructor() {}

    public static getInstance(): ValidationService {
        if (!ValidationService.instance) {
            ValidationService.instance = new ValidationService();
        }
        return ValidationService.instance;
    }

    /**
     * Validate required string field
     */
    public validateRequired(value: any, fieldName: string): void {
        if (!value || (typeof value === 'string' && value.trim().length === 0)) {
            throw new ValidationError(`${fieldName} is required`);
        }
    }

    /**
     * Validate email format
     */
    public validateEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Validate port number
     */
    public validatePort(port: number): boolean {
        return Number.isInteger(port) && port > 0 && port <= 65535;
    }

    /**
     * Validate hostname/IP
     */
    public validateHost(host: string): boolean {
        // Basic validation for hostname or IP
        const hostnameRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
        const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
        return hostnameRegex.test(host) || ipRegex.test(host);
    }

    /**
     * Validate path exists
     */
    public validatePath(filepath: string): boolean {
        const fs = require('fs');
        return fs.existsSync(filepath);
    }

    /**
     * Sanitize SQL input (basic)
     */
    public sanitizeSql(input: string): string {
        // eslint-disable-next-line no-control-regex
        return input.replace(/[';"\\\x00]/g, '');
    }

    /**
     * Validate configuration object structure
     */
    public validateConfig(config: any, requiredFields: string[]): void {
        for (const field of requiredFields) {
            const value = field.split('.').reduce((obj, key) => obj?.[key], config);
            if (value === undefined || value === null) {
                throw new ValidationError(`Missing required configuration field: ${field}`);
            }
        }
    }
}
