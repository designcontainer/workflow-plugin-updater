const core = require('@actions/core');

module.exports = {
	cloneRepo,
	pushRepo,
	areFilesChanged,
	createBranch,
};

/**
 * Git clone
 */
async function cloneRepo(dir, owner, repo, token, git) {
	const url = getGitUrl(token, owner, repo);
	await git.clone(url, dir, { '--depth': 1 });
}

/**
 *
 * @param {string} token GitHub gpg token.
 * @param {string} owner Repo user/owner.
 * @param {string} repo The GitHub Repository.
 * @returns {string} URL.
 */
function getGitUrl(token, owner, repo) {
	return `https://${token}@github.com/${owner}/${repo}.git`;
}

/**
 * Git push
 */
async function pushRepo(token, owner, repo, branchName, git) {
	const url = getGitUrl(token, owner, repo);
	await git.addRemote('auth', url);
	await git.push(['-u', 'auth', branchName]);
}

function getGitUrl(token, owner, repo) {
	return `https://${token}@github.com/${owner}/${repo}.git`;
}

/**
 * Check if files are changed
 * Git add & git status
 */
async function areFilesChanged(git, exceptions) {
	await git.add('./*');
	await git.reset(exceptions);

	const status = await git.status();
	core.debug('DEBUG: List of differences spotted in the repository');
	core.debug(JSON.stringify(status, null, 2));

	return status.files.length > 0;
}

/**
 * Git checkout -b branchName
 */
async function createBranch(branchName, git) {
	return await git.checkout(`-b${branchName}`);
}
