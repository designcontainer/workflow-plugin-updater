const core = require('@actions/core');

module.exports = { createPr, approvePr, mergePr, createRelease };

async function createPr(octokit, owner, repo, title, head, base) {
	// Wait 5 seconds between requests. Github is kinda slow sometimes.
	await sleep(5000);
	const pr = await octokit
		.request(`POST /repos/{owner}/{repo}/pulls`, {
			owner,
			repo,
			title,
			head,
			base,
		})
		.then((res) => {
			return res.data.number;
		})
		.catch((error) => {
			throw new Error(error);
		});
	core.info(`Submitted PR number: ${pr}`);
	return pr;
}

async function approvePr(octokit, owner, repo, pull_number) {
	// Wait 1 seconds between requests. Github is kinda slow sometimes.
	await sleep(1000);
	await octokit
		.request(`POST /repos/{owner}/{repo}/pulls/{pull_number}/reviews`, {
			owner,
			repo,
			pull_number,
			event: 'APPROVE',
		})
		.catch((error) => {
			throw new Error(error);
		});
}

async function mergePr(octokit, owner, repo, pull_number, commit_title) {
	// Wait 1 seconds between requests. Github is kinda slow sometimes.
	await sleep(1000);
	await octokit
		.request('PUT /repos/{owner}/{repo}/pulls/{pull_number}/merge', {
			owner,
			repo,
			pull_number,
			commit_title,
		})
		.catch((error) => {
			throw new Error(error);
		});
}
async function createRelease(octokit, owner, repo, tag_name, name) {
	// Wait 10 seconds between requests. Github is kinda slow sometimes.
	await sleep(10000);
	await octokit
		.request('POST /repos/{owner}/{repo}/releases', {
			owner,
			repo,
			tag_name,
			name,
		})
		.catch((error) => {
			throw new Error(error);
		});
}

async function sleep(ms) {
	return await new Promise((resolve) => setTimeout(resolve, ms));
}
