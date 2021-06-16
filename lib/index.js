// External dependencies
const fs = require('fs');
const path = require('path');
const rimraf = require('rimraf');
const simpleGit = require('simple-git');
const core = require('@actions/core');
const { retry } = require('@octokit/plugin-retry');
const { GitHub, getOctokitOptions } = require('@actions/github/lib/utils');

// Internal dependencies
const { removeFiles, downloadZip, extractZip, getPluginVersion } = require('./util');
const { cloneRepo, areFilesChanged, pushRepo, createBranch } = require('./git');
const { createPr, approvePr } = require('./api-calls');

async function run() {
	try {
		// Action inputs
		const token = core.getInput('github_token', { required: true });
		const approval_token = core.getInput('approval_github_token');
		const committerUsername = core.getInput('committer_username');
		const committerEmail = core.getInput('committer_email');
		const source = core.getInput('source', { required: true });

		// Github envs
		const [owner, repo] = process.env.GITHUB_REPOSITORY.split('/');
		const [refs, head, branch] = process.env.GITHUB_REF.split('/');

		const octokit = GitHub.plugin(retry);
		const myOctokit = new octokit(getOctokitOptions(token));
		const exceptions = ['.git', '.github']; // Files that shouldn't be touched

		core.startGroup('Fetching latest plugin');

		core.info('Create working dir');
		const dir = path.join(process.cwd(), 'clones', repo);
		if (fs.existsSync(dir)) rimraf.sync(dir); // Delete the folder if it already exists for some reason.
		fs.mkdirSync(dir, { recursive: true });

		core.info('Clone repo and cleanup repo');
		const git = simpleGit({ baseDir: dir });
		await cloneRepo(dir, owner, repo, token, git);
		await removeFiles(dir, exceptions);

		core.info('Download zip');
		const zip = await downloadZip(dir, source);

		core.info('Extract zip');
		await extractZip(zip, dir);

		core.info('Get version number');
		const version = await getPluginVersion(dir);

		core.info('Check for differences');
		if (await areFilesChanged(git)) {
			core.info(`Creating branch`);
			const newBranch = `release/v${version}`;
			const commitMessage = `Updated plugin to version: v${version}`;
			await createBranch(newBranch, git);

			core.info(`Pushing to ${newBranch}.`);
			await pushRepo(
				token,
				owner,
				repo,
				newBranch,
				commitMessage,
				committerUsername,
				committerEmail,
				git
			);
			core.info('Creating Pull request');
			const pr = await createPr(myOctokit, owner, repo, commitMessage, newBranch, branch);

			// If an approval token is supplied, we will go ahead and autoapprove the PR.
			if (approval_token.length && approval_token !== '') {
				const secondOctokit = new octokit(getOctokitOptions(approval_token));
				await approvePr(secondOctokit, owner, repo, pr);
			}

			// Output the version number, so we can use it to create tags.
			core.setOutput('version', version);
		} else {
			core.info('No changes found. Finishing up.');
		}

		core.endGroup();
	} catch (error) {
		core.setFailed(`Action failed because of: ${error}`);
	}
}

run();
