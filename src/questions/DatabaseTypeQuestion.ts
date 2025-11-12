import { error } from "../utils/Console";
import inquirer from 'inquirer'
import DatabasesModel from "../models/DatabasesModel";

class DatabaseTypeQuestion {
    private databasesModel = new DatabasesModel();
    private questions: any[] = [];

    configure = async (config: any) => {
        await this.addQuestions(config);

        // Set database type
        await inquirer
        .prompt(this.questions)
        .then((answers: { databaseType: any; }) => {
            // Set the database type
            config.databases.databaseType = answers.databaseType;

            // Collect databases
            this.databasesModel.collectDatabaseData('', answers.databaseType);
            
            // Set database list
            config.databases.databasesList = this.databasesModel.databasesList;
        })
        .catch((err: { message: any; }) => {
            error(`Something went wrong: ${err.message}`)
        });
    }

    // Add questions
    addQuestions = async (_config: any) => {
        this.questions.push(
            {
                type: 'list',
                name: 'databaseType',
                message: 'Which database do you want to synchronize?',
                default: 'staging',
                choices: ['staging', 'production'],
                validate: (_input: string) => {
                    return true;
                }
            }
        )
    }
}

export default DatabaseTypeQuestion