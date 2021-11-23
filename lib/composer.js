const fs = require('fs');
const path = require('path');
const core = require('@actions/core');

module.exports = {
	generateComposer,
	doesComposerExist,
	isOrgComposer,
};

/**
 * Check if the composer file belongs to the organization
 */
async function isOrgComposer(dir, org) {
	const file = path.join(dir, 'composer.json');
	const data = fs.readFileSync(file);
	const composer = JSON.parse(data);
	if (composer.name.startsWith(org)) {
		return true;
	}

	return false;
}

/**
 * Check if composer files exist
 */
async function doesComposerExist(dir) {
	const file = path.join(dir, 'composer.json');
	return fs.existsSync(file);
}

/**
 * Generate composer file
 */
async function generateComposer(dir, installer, owner, repo, p) {
	const file = path.join(dir, 'composer.json');
	const name = `${owner}/${repo}`;
	const type = 'wordpress-plugin';

	const composer = {
		name,
		...(p.description && { description: p.description }),
		...(p.homepage && { homepage: p.homepage }),
		type,
		require: {
			'composer/installers': installer,
		},
		...(p.license && { license: p.license }),
		authors: [
			{
				...(p.author && { name: p.author }),
				...(p.authorUri && { homepage: p.authorUri }),
			},
		],
	};

	core.debug(`Writing composer.json to ${file}`);
	json = JSON.stringify(composer, null, 2);
	core.debug(json);
	fs.writeFileSync(file, json);
}
