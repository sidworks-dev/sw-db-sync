/**
 * CommandService - Execute local commands
 */

import { execa } from 'execa';
import commandExists from 'command-exists';
import { LoggerService } from './LoggerService';

export interface CommandResult {
    stdout: string;
    stderr: string;
    exitCode: number;
    command: string;
}

export class CommandService {
    private static instance: CommandService;
    private logger: LoggerService;

    private constructor() {
        this.logger = LoggerService.getInstance();
    }

    public static getInstance(): CommandService {
        if (!CommandService.instance) {
            CommandService.instance = new CommandService();
        }
        return CommandService.instance;
    }

    /**
     * Execute a command
     */
    public async execute(
        command: string,
        args: string[] = [],
        options: { cwd?: string; shell?: boolean } = {}
    ): Promise<CommandResult> {
        try {
            const result = await execa(command, args, {
                cwd: options.cwd || process.cwd(),
                shell: options.shell ?? true,
                all: true
            });

            return {
                stdout: result.stdout,
                stderr: result.stderr,
                exitCode: result.exitCode || 0,
                command: `${command} ${args.join(' ')}`
            };
        } catch (error: any) {
            this.logger.error(
                'Command execution failed',
                error,
                {
                    component: 'CommandService',
                    command,
                    args
                }
            );

            return {
                stdout: error.stdout || '',
                stderr: error.stderr || error.message,
                exitCode: error.exitCode || 1,
                command: `${command} ${args.join(' ')}`
            };
        }
    }

    /**
     * Execute command with shell string
     */
    public async executeShell(
        commandString: string,
        options: { cwd?: string } = {}
    ): Promise<CommandResult> {
        try {
            const result = await execa(commandString, {
                cwd: options.cwd || process.cwd(),
                shell: true,
                all: true
            });

            return {
                stdout: result.stdout,
                stderr: result.stderr,
                exitCode: result.exitCode || 0,
                command: commandString
            };
        } catch (error: any) {
            return {
                stdout: error.stdout || '',
                stderr: error.stderr || error.message,
                exitCode: error.exitCode || 1,
                command: commandString
            };
        }
    }

    /**
     * Check if command exists
     */
    public async commandExists(command: string): Promise<boolean> {
        try {
            await commandExists(command);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Check multiple commands
     */
    public async checkCommands(commands: string[]): Promise<Record<string, boolean>> {
        const results: Record<string, boolean> = {};
        
        for (const command of commands) {
            results[command] = await this.commandExists(command);
        }

        return results;
    }
}
