const core = require('@actions/core');

module.exports = { createPr, approvePr };

async function createPr(octokit, owner, repo, title, head, base) {
	let retries = 5;
	let count = 0;
	let pr = undefined;

	while (retries-- > 0) {
		count++;
		try {
			core.info('Waiting 5sec before PR creation');
			await sleep(5000);
			core.info(`PR creation attempt ${count}`);

			pr = await octokit
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

			retries = 0;
		} catch (error) {
			//if error is different than rate limit/timeout related we should throw error as it is very probable that
			//next PR will also fail anyway, we should let user know early in the process by failing the action
			if (error.message !== 'was submitted too quickly') {
				core.setFailed(`Unable to create a PR: ${error}`);
			}
		}
	}

	return pr;
}

async function approvePr(octokit, owner, repo, pr) {
	let retries = 5;
	let count = 0;

	while (retries-- > 0) {
		count++;
		try {
			core.info('Waiting 5sec before approve attempt');
			await sleep(5000);
			core.info(`approve attempt attempt ${count}`);

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

			retries = 0;
		} catch (error) {
			//if error is different than rate limit/timeout related we should throw error as it is very probable that
			//next PR will also fail anyway, we should let user know early in the process by failing the action
			if (error.message !== 'was submitted too quickly') {
				core.setFailed(`Unable to approve PR: ${error}`);
			}
		}
	}
}

async function sleep(ms) {
	return await new Promise((resolve) => setTimeout(resolve, ms));
}
