/**
 * StartController - Enhanced with modern UI, performance features, and DI
 */
import MainController from './MainController';
import DatabaseTypeQuestion from '../questions/DatabaseTypeQuestion';
import SelectDatabaseQuestion from '../questions/SelectDatabaseQuestion';
import ConfigurationQuestions from '../questions/ConfigurationQuestions';
import { UI } from '../utils/UI';
import { SSHConnectionPool } from '../utils/Performance';
import { TaskFactory } from '../core/TaskFactory';

class StartController extends MainController {
    private taskFactory: TaskFactory;

    constructor() {
        super();
        super.init(); // Initialize parent config
        this.taskFactory = TaskFactory.getInstance();
    }

    public async execute(): Promise<void> {
        return this.executeStart();
    }

    executeStart = async (): Promise<void> => {
        try {
            await this.askQuestions();
            await this.prepareTasks();

            this.showTaskSummary();

            await this.list.run();

            await this.showCompletionMessage();

            await SSHConnectionPool.closeAll();

            process.exit(0);
        } catch (e) {
            const error = e as Error;
            UI.error(`Operation failed: ${error.message}`);

            if (error.stack) {
                console.log('\n' + error.stack);
            }

            await SSHConnectionPool.closeAll();
            process.exit(1);
        }
    };

    private showTaskSummary(): void {
        UI.section('Task Summary');

        const tasks = [];

        if (this.config.settings.syncTypes && Array.isArray(this.config.settings.syncTypes) && this.config.settings.syncTypes.includes('Shopware database')) {
            tasks.push({
                label: 'Download Database',
                value: `${this.config.databases.databaseType} (${this.config.settings.strip === 'custom' ? 'custom strip' : this.config.settings.strip || 'full'})`
            });
        }

        if (this.config.settings.import === 'yes') {
            tasks.push({
                label: 'Import to Shopware',
                value: this.config.settings.currentFolder
            });
        }

        UI.table(tasks);

        console.log('');
        UI.box(
            'This may take a few minutes...\n' +
            'Grab some coffee while you wait!',
            { type: 'info', title: 'Starting Operations' }
        );
    }

    private async showCompletionMessage(): Promise<void> {
        console.log('\n');

        if (this.config.finalMessages.importDomain.length > 0) {
            const configService = this.services.getConfig();
            const settingsConfig = configService.getSettingsConfig();
            const urls = this.config.finalMessages.domains;
            const message =
                `Shopware successfully imported!\n\n` +
                `Your project is available at:\n` +
                urls.map((url: string) => `   ${url}`).join('\n') +
                `\n\n` +
                `Backend Credentials:\n` +
                `   Username: ${settingsConfig.shopwareBackend.adminUsername}\n` +
                `   Password: ${settingsConfig.shopwareBackend.adminPassword}\n\n` +
                `Admin Email: ${settingsConfig.shopwareBackend.adminEmailAddress}`;

            UI.box(message, { type: 'success', title: 'Shopware Import Complete' });
        } else if (this.config.finalMessages.shopwareDatabaseLocation.length > 0) {
            const message = `Downloaded Shopware database to:\n${this.config.finalMessages.shopwareDatabaseLocation}`;

            UI.box(message, { type: 'success', title: 'Download Complete' });
        }

        // Log completion
        const logger = this.services.getLogger();
        logger.info('Operation completed successfully', {
            component: 'StartController'
        });
    }

    askQuestions = async () => {
        UI.section('Configuration');

        const databaseTypeQuestion = await new DatabaseTypeQuestion();
        await databaseTypeQuestion.configure(this.config);

        const selectDatabaseQuestion = await new SelectDatabaseQuestion();
        await selectDatabaseQuestion.configure(this.config);

        const configurationQuestions = await new ConfigurationQuestions();
        await configurationQuestions.configure(this.config);
    };

    prepareTasks = async () => {
        console.log('');
        UI.info('Preparing tasks...\n');

        const logger = this.services.getLogger();
        logger.info('Preparing task pipeline', { component: 'StartController' });

        // Create tasks via factory (DI pattern)
        const checksTask = this.taskFactory.createChecksTask();
        await checksTask.configure(this.list, this.config, this.ssh);

        const downloadTask = this.taskFactory.createDownloadTask();
        await downloadTask.configure(this.list, this.config, this.ssh);

        if (this.config.settings.import === 'yes') {
            const importTask = this.taskFactory.createImportTask();
            await importTask.configure(this.list, this.config);
        }

        if (this.config.settings.import === 'yes') {
            const shopwareConfigureTask = this.taskFactory.createShopwareConfigureTask();
            await shopwareConfigureTask.configure(this.list, this.config);
        }

        logger.info('Task pipeline prepared successfully', {
            taskCount: this.list.tasks.length
        });
    };
}

export default StartController;
export { StartController };
