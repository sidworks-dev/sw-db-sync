#!/usr/bin/env node

/**
 * Migrate config from package directory to user directory
 * Usage: npm run migrate-config
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const readline = require('readline');

const userConfigDir = path.join(os.homedir(), '.sw-db-sync', 'config');
const packageRoot = path.resolve(__dirname, '..');
const packageConfigDir = path.join(packageRoot, 'config');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function ask(question) {
    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            resolve(answer);
        });
    });
}

async function migrateConfig() {
    console.log('\n🔄 Config Migration Tool\n');
    console.log(`From: ${packageConfigDir}`);
    console.log(`To:   ${userConfigDir}\n`);

    // Ensure user config directory exists
    if (!fs.existsSync(userConfigDir)) {
        fs.mkdirSync(userConfigDir, { recursive: true });
    }
    const userDatabasesDir = path.join(userConfigDir, 'databases');
    if (!fs.existsSync(userDatabasesDir)) {
        fs.mkdirSync(userDatabasesDir, { recursive: true });
    }

    const configFiles = [
        'settings.json',
        'databases/staging.json',
        'databases/production.json'
    ];

    let migrated = 0;
    let skipped = 0;

    for (const file of configFiles) {
        const sourcePath = path.join(packageConfigDir, file);
        const targetPath = path.join(userConfigDir, file);

        if (!fs.existsSync(sourcePath)) {
            console.log(`⚠️  Source not found: ${file}`);
            skipped++;
            continue;
        }

        if (fs.existsSync(targetPath)) {
            const answer = await ask(`File exists in user config: ${file}\nOverwrite? (y/N): `);
            if (answer.toLowerCase() !== 'y') {
                console.log(`   Skipped: ${file}`);
                skipped++;
                continue;
            }
        }

        // Copy the file
        try {
            const targetDir = path.dirname(targetPath);
            if (!fs.existsSync(targetDir)) {
                fs.mkdirSync(targetDir, { recursive: true });
            }

            // Check if source is symlink
            const stats = fs.lstatSync(sourcePath);
            if (stats.isSymbolicLink()) {
                const linkTarget = fs.readlinkSync(sourcePath);
                fs.symlinkSync(linkTarget, targetPath);
                console.log(`✓ Migrated (symlink): ${file} -> ${linkTarget}`);
            } else {
                fs.copyFileSync(sourcePath, targetPath);
                console.log(`✓ Migrated: ${file}`);
            }
            migrated++;
        } catch (err) {
            console.error(`❌ Failed to migrate ${file}: ${err.message}`);
            skipped++;
        }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   Migrated: ${migrated}`);
    console.log(`   Skipped:  ${skipped}`);

    if (migrated > 0) {
        console.log(`\n✅ Config files migrated to: ${userConfigDir}`);
        console.log(`\n💡 You can now safely delete configs from package directory if desired.`);
    }

    rl.close();
}

migrateConfig().catch(err => {
    console.error('❌ Migration failed:', err.message);
    rl.close();
    process.exit(1);
});
