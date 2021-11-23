const path = require('path');
const core = require('@actions/core');
const { isOrgComposer } = require('./composer');

module.exports = {
	cloneRepo,
	pushRepo,
	doesTagExist,
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
 * Git push
 */
async function pushRepo(token, owner, repo, branchName, message, committerUsername, committerEmail, git) {
	const url = getGitUrl(token, owner, repo);

	await git.addConfig('user.name', committerUsername);
	await git.addConfig('user.email', committerEmail);
	await git.commit(message);
	await git.addRemote('auth', url);
	await git.push(['-u', 'auth', branchName]);
}

function getGitUrl(token, owner, repo) {
	return `https://${token}@github.com/${owner}/${repo}.git`;
}

/**
 * Check wether a tag already exists in a given repo.
 */
async function doesTagExist(git, tag) {
	const tags = await git.tags();
	console.log(tags);
	return tags.all.includes(tag);
}

/**
 * Git checkout -b branchName
 */
async function createBranch(branchName, git) {
	return await git.checkout(`-b${branchName}`);
}
