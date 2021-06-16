const core = require('@actions/core');

module.exports = { createPr, approvePr };

async function createPr(octokit, owner, repo, title, head, base) {
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

async function sleep(ms) {
	return await new Promise((resolve) => setTimeout(resolve, ms));
}
