$(function () {
	let form = document.getElementById("login-form");
	form.addEventListener("submit", verifyAccount, true);
});

function verifyAccount(event) {
	event.preventDefault();
	const username = document.getElementById('username').value;
	const password = document.getElementById('password').value;
	const submit = document.getElementById("submit");
	submit.disabled = true;
	$.post('/user/login', {
		username, password
	}).done(async function () {
		const configuration = await getConfig();
		const params = new URLSearchParams({
			response_type: "code",
			client_id: configuration.oauth.clientId,
			redirect_uri: configuration.oauth.redirectUri,
			state: uuidv4()
		});
		window.location = `/oauth/authorize?${params.toString()}`;
	}).fail(function () {
		onSubmitError({ errorText: "Invalid Login", buttonText: "Login" });
	});
}