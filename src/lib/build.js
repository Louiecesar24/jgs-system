const build = (path) => {
	return import.meta.env.DEV
		? `http://127.0.0.1:8000/api/v1${path}`
		: `https://fra-heroku-deploy-testing-7a28c04a73f0.herokuapp.com/api/v1${path}`;
};

export default build;
