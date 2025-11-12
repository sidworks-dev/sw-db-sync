/**
 * RetryService - Retry logic with exponential backoff
 */

import { LoggerService } from './LoggerService';

export interface RetryOptions {
    maxAttempts?: number;
    initialDelay?: number;
    maxDelay?: number;
    backoffMultiplier?: number;
    shouldRetry?: (_error: Error) => boolean;
}

export class RetryService {
    private static instance: RetryService;
    private logger: LoggerService;

    private constructor() {
        this.logger = LoggerService.getInstance();
    }

    public static getInstance(): RetryService {
        if (!RetryService.instance) {
            RetryService.instance = new RetryService();
        }
        return RetryService.instance;
    }

    /**
     * Execute function with retry logic
     */
    public async execute<T>(
        fn: () => Promise<T>,
        options: RetryOptions = {}
    ): Promise<T> {
        const {
            maxAttempts = 3,
            initialDelay = 1000,
            maxDelay = 30000,
            backoffMultiplier = 2,
            shouldRetry = () => true
        } = options;

        let lastError: Error | null = null;
        let delay = initialDelay;

        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                return await fn();
            } catch (error) {
                lastError = error as Error;

                // Check if we should retry this error
                if (!shouldRetry(lastError)) {
                    throw lastError;
                }

                // Don't retry on last attempt
                if (attempt === maxAttempts) {
                    break;
                }

                this.logger.warn(
                    `Operation failed (attempt ${attempt}/${maxAttempts}), retrying in ${delay}ms...`,
                    {
                        component: 'RetryService',
                        attempt,
                        maxAttempts,
                        error: lastError.message
                    }
                );

                // Wait before retrying
                await this.delay(delay);

                // Increase delay with exponential backoff
                delay = Math.min(delay * backoffMultiplier, maxDelay);
            }
        }

        // All attempts failed
        this.logger.error(
            `Operation failed after ${maxAttempts} attempts`,
            lastError || undefined,
            { component: 'RetryService' }
        );

        throw lastError || new Error('Operation failed after retries');
    }

    /**
     * Delay execution
     */
    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Check if error is retryable (network/timeout errors)
     */
    public isRetryableError(error: Error): boolean {
        const retryableMessages = [
            'ETIMEDOUT',
            'ECONNREFUSED',
            'ECONNRESET',
            'EPIPE',
            'EHOSTUNREACH',
            'EAI_AGAIN'
        ];

        return retryableMessages.some(msg => 
            error.message.includes(msg) || error.name.includes(msg)
        );
    }
}
