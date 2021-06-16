const core = require('@actions/core');

module.exports = { createPr };

async function createPr(octokit, owner, repo, title, head, base) {
	let retries = 5;
	let count = 0;

	while (retries-- > 0) {
		count++;
		try {
			core.info('Waiting 5sec before PR creation');
			await sleep(5000);
			core.info(`PR creation attempt ${count}`);

			await octokit
				.request(`POST /repos/{owner}/{repo}/pulls`, {
					owner,
					repo,
					title,
					head,
					base,
				})
				.catch((error) => {
					throw new Error(error);
				});

			retries = 0;
		} catch (error) {
			//if error is different than rate limit/timeout related we should throw error as it is very probable that
			//next PR will also fail anyway, we should let user know early in the process by failing the action
			if (error.message !== 'was submitted too quickly') {
				throw new Error(`Unable to create a PR: ${error}`);
			}
		}
	}

	function sleep(ms) {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}
}
