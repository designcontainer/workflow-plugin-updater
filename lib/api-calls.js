const core = require('@actions/core');

module.exports = { createPr, approvePr, mergePr, deleteRef, createRelease };

async function createPr(octokit, owner, repo, title, head, base) {
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

async function deleteRef(octokit, owner, repo, ref) {
	await octokit
		.request(`DELETE /repos/{owner}/{repo}/git/refs/{ref}`, {
			owner,
			repo,
			ref,
		})
		.catch((error) => {
			throw new Error(error);
		});
}

async function mergePr(octokit, owner, repo, pull_number, commit_title) {
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
