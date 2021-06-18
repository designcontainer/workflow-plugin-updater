const fs = require('fs');
const path = require('path');

module.exports = {
	generateComposer,
	doesComposerExist,
};

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

	json = JSON.stringify(composer);
	fs.writeFileSync(file, json);
}
