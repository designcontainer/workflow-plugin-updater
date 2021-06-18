const fs = require('fs-extra');
const path = require('path');
const axios = require('axios').default;
const rimraf = require('rimraf');
const extract = require('extract-zip');
const { v4: uuidv4 } = require('uuid');
const core = require('@actions/core');

module.exports = {
	downloadZip,
	removeFiles,
	extractZip,
	getPluginInfo,
	sleep,
};

/**
 * Downloads a zip file from url.
 *
 * @param {string} dir The working path.
 * @param {string} url Download url.
 * @param {string} query URL Parameters.
 * @return {string} Returns a string with the zip file path.
 */
async function downloadZip(dir, url) {
	const file = path.join(dir, 'dist.zip');

	return await axios
		.request({
			url,
			method: 'GET',
			responseType: 'arraybuffer',
		})
		.then((result) => {
			fs.writeFileSync(file, result.data);
			return file;
		})
		.catch((error) => {
			core.setFailed(`Action failed because of: ${error}`);
		});
}

/**
 * Remove files and dirs in a path
 *
 * @param {string} dir The working path.
 * @param {Array} exceptions Files that should be kept.
 */
async function removeFiles(dir, exceptions) {
	const files = fs.readdirSync(dir);

	for (let i = 0; i < files.length; i++) {
		if (exceptions.includes(files[i]) === false) {
			let absFile = path.join(dir, files[i]);
			let stat = await fs.lstat(absFile);

			if (stat.isFile() === true) {
				fs.unlinkSync(absFile);
			} else {
				rimraf.sync(absFile);
			}
		}
	}
}

/**
 * Extract a zip file
 *
 * @param {string} zip A zip file
 * @param {string} output The output path
 */
async function extractZip(zip, output) {
	try {
		const before = fs.readdirSync(output).filter((e) => e !== path.basename(zip));
		// Unzip and delete the zip file
		await extract(zip, { dir: output });
		fs.unlinkSync(zip);
		const after = fs.readdirSync(output);

		// If the total new files is more than 1,
		// we assume that the plugin files are not wrapped in a folder.
		const totalNewFiles = after.length - before.length;
		if (totalNewFiles > 1) return;

		// Find the difference between the two arrays to find the new folder
		const diff = after.filter((x) => before.indexOf(x) === -1);
		const wrapperDir = path.join(output, diff[0]);

		// Copy the contents of the wrapper folder to root.
		fs.copySync(wrapperDir, output);
		// Remove the wrapper folder.
		rimraf.sync(wrapperDir);
	} catch (error) {
		core.setFailed(`Action failed because of: ${error}`);
	}
}

/**
 * Get the info of a Wordpress plugin
 *
 * @param {string} dir The plugin directory
 * @return {Object} Plugin information
 * @return {Object.name} Plugin Name
 * @return {Object.uri} Plugin Uri
 * @return {Object.description} Plugin Description
 * @return {Object.version} Plugin Version
 * @return {Object.author} Plugin Author
 * @return {Object.authorUri} Plugin Author Uri
 * @return {Object.textDomain} Plugin Text Domain
 */
async function getPluginInfo(dir) {
	files = fs.readdirSync(dir);

	let pluginData = undefined;

	for (let i = 0; i < files.length; i++) {
		if (path.extname(files[i]) == '.php') {
			let absFile = path.join(dir, files[i]);
			let content = fs.readFileSync(absFile).toString();

			if (content.includes('Plugin Name:')) {
				pluginData = {
					name: getStringAfterColon(content, 'Plugin Name'),
					uri: getStringAfterColon(content, 'Plugion URI'),
					description: getStringAfterColon(content, 'Description'),
					version: getStringAfterColon(content, 'Version'),
					author: getStringAfterColon(content, 'Author'),
					authorUri: getStringAfterColon(content, 'Author URI'),
					textDomain: getStringAfterColon(content, 'Text Domain'),
					domainPath: getStringAfterColon(content, 'Domain Path'),
				};
				break;
			}
		}
	}

	return pluginData;
}

/**
 * Get the string after a colon for a needle.
 * String will end at new line.
 *
 * @param {string} haystack The content to search in.
 * @param {string} needle The key before the colon.
 * @return {string} Content after colon
 */
function getStringAfterColon(haystack, needle) {
	if (haystack.includes(`${needle}:`) === false) {
		return undefined;
	}
	return haystack.split(`${needle}:`)[1].split(/\r?\n/)[0].trim();
}

/**
 * Async delay
 *
 * @param {string} ms Amout of milliseconds to delat/sleep.
 */
async function sleep(ms) {
	return await new Promise((resolve) => setTimeout(resolve, ms));
}
