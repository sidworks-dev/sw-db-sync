import { error } from "../utils/Console";
import inquirer from 'inquirer'

class ConfigurationQuestions {
    private questionsOne: any[] = [];
    private questionsTwo: any[] = [];

    configure = async (config: any) => {
        await this.addQuestions(config);

        // Set import configs
        await inquirer
            .prompt(this.questionsOne)
            .then((answers) => {
                // Set stripped setting
                config.settings.strip = answers.strip;

                // Set import setting for Shopware
                config.settings.import = answers.import

                // Set image import setting for Shopware
                config.settings.syncImages = answers.syncImages

                // Change location of database download depending on answer
                if (config.settings.import == 'yes') {
                    config.customConfig.localDatabaseFolderLocation = config.settings.currentFolder;
                }
            })
            .catch((err: { message: any; }) => {
                error(`Something went wrong: ${err.message}`)
            });
    }

    // Add questions
    addQuestions = async (config: any) => {
        this.questionsOne.push(
            {
                type: 'list',
                name: 'strip',
                default: 'stripped',
                message: 'Does the Shopware database need to be stripped for development?',
                choices: ['stripped', 'full'],
                validate: (input: string) => {
                    return input !== ''
                }
            }
        );

        // Only push questions if Shopware project is found
        if (config.settings.currentFolderIsShopware) {
            this.questionsOne.push(
                {
                    type: 'list',
                    name: 'import',
                    default: 'yes',
                    message: 'Import Shopware database?',
                    choices: ['yes', 'no'],
                    validate: (_input: string) => {
                        return true;
                    },
                }
            );

            if (config.settings.rsyncInstalled) {
                this.questionsOne.push(
                    {
                        type: 'list',
                        name: 'syncImages',
                        default: 'yes',
                        message: 'Synchronize images from public/media?',
                        choices: ['yes', 'no'],
                        validate: (_input: string) => {
                            return true;
                        },
                    }
                );
            }
        }
    }
}

export default ConfigurationQuestions
