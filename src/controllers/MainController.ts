import {NodeSSH} from 'node-ssh'
import DatabasesModel from "../models/DatabasesModel";
import * as os from 'os'
import * as path from 'path'
import { Listr } from 'listr2';
import CommandExists from 'command-exists';
import { ServiceContainer } from '../core/ServiceContainer';
import { AppConfig } from '../types';
// inquirer is registered in SelectDatabaseQuestion


class MainController {
    public config: AppConfig;
    protected services: ServiceContainer;
    public list = new Listr(
        [],
        {concurrent: false}
    );
    public ssh = new NodeSSH();
    public databases = new DatabasesModel();

    constructor() {
        this.services = ServiceContainer.getInstance();
        const configService = this.services.getConfig();
        const settingsConfig = configService.getSettingsConfig();
        
        this.config = {
            'customConfig': {
                'sshKeyLocation': settingsConfig.ssh.keyLocation,
                'sshPassphrase': settingsConfig.ssh.passphrase,
                'localDatabaseFolderLocation': settingsConfig.general.databaseLocation,
                'localDomainExtension': settingsConfig.general.localDomainExtension
            },
            'requirements': {
                'shopwareCliVersion': '1.0.0'
            },
            'serverVariables': {
                'shopwareVersion': 6,
                'externalPhpPath': '',
                'shopwareRoot': '',
                'shopwareCliFile': '',
                'databaseName': ''
            },
            'settings': {
                'currentFolder': '',
                'currentFolderName': '',
                'strip': '',
                'syncImages': 'no',
                'shopwareLocalhostDomainName': '',
                'rsyncInstalled': false,
                'import': 'no',
                'currentFolderIsShopware': false,
                'runCommands': false,
                'shopwareCliCommand': '',
                'shopwareCliCommandLocal': '',
                'databaseCommand': '',
                'syncImageTypes': null as string[] | null,
                'syncTypes': null as string[] | null
            },
            'finalMessages': {
                'shopwareDatabaseLocation': '',
                'shopwareDatabaseIncludeLocation': '',
                'importDomain': '',
                'domains': []
            },
            'databases': {
                'databasesList': null as any,
                'databaseType': null as string | null,
                'databaseData': null as any
            }
        };
    }

    init() {
        this.configureConfig().then();
    }

    configureConfig = async () => {
        // Fetch SSH key location, if non configured
        if (!this.config.customConfig.sshKeyLocation) {
            this.config.customConfig.sshKeyLocation = os.userInfo().homedir + '/.ssh/id_rsa';
        }

        // Check if rsync is installed locally
        await CommandExists('rsync')
            .then(() =>{
                this.config.settings.rsyncInstalled = true;
            }).catch(function(){});

        // Get current folder from cwd
        this.config.settings.currentFolder = process.cwd();

        // Set current folder name based on current folder
        this.config.settings.currentFolderName = path.basename(path.resolve(this.config.settings.currentFolder));
    }
}

export default MainController
