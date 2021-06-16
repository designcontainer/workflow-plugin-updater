// External dependencies
const fs = require('fs');
const path = require('path');
const rimraf = require('rimraf');
const simpleGit = require('simple-git');
const core = require('@actions/core');
const { retry } = require('@octokit/plugin-retry');
const { GitHub, getOctokitOptions } = require('@actions/github/lib/utils');

// Internal dependencies
const { removeFiles, downloadZip, extractZip, getPluginVersion, sleep } = require('./util');
const { cloneRepo, areFilesChanged, pushRepo, createBranch } = require('./git');
const { createPr, approvePr, mergePr, deleteRef, createRelease } = require('./api-calls');

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
		const pVersion = 'v' + version;

		core.info('Check for differences');
		if (await areFilesChanged(git)) {
			core.info(`Creating branch`);
			const newBranch = `release/v${version}`;
			const commitMessage = `Updated plugin to version: ${version}`;
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

				// Adding some delays because GitHub can be a bit janky.
				core.info('Approve Pull request');
				await sleep(5000);
				await approvePr(secondOctokit, owner, repo, pr);

				core.info('Merge Pull request');
				await sleep(1000);
				await mergePr(myOctokit, owner, repo, pr, commitMessage);

				core.info(`Delete branch: ${newBranch}.`);
				await sleep(1000);
				const ref = `heads/${newBranch}`;
				await deleteRef(myOctokit, owner, repo, ref);

				core.info('Create release');
				await sleep(5000);
				await createRelease(myOctokit, owner, repo, pVersion, pVersion);
			}

			// Output the version number, so we can use it to create tags.
			core.setOutput('version', version);
			core.setOutput('update', true);

			core.info(`Finished updating plugin. New version is: ${version}`);
		} else {
			core.info('No changes found. Finishing up.');
			core.setOutput('update', false);
		}
		core.endGroup();
	} catch (error) {
		core.setFailed(`Action failed because of: ${error}`);
	}
}

run();
