/**
 * VersionCheck - Legacy version check utility
 * This is kept for backwards compatibility but the new VersionCheckService should be used instead
 */
import packageFile from "../../package.json";
import fetch from 'node-fetch'

class VersionCheck {
	public config = {
		'latestVersion': '',
		'currentVersion': packageFile.version
	}

	// versions
	getToolVersions = async () => {
		try {
			const response = await fetch('https://raw.githubusercontent.com/sidworks-dev/sw-db-sync/master/package.json');
			const json: any = await response.json();
			this.config.latestVersion = json.version;
		} catch (error) {
			console.warn('Failed to check version:', error);
		}
	}
}

export default VersionCheck;
