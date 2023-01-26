$(function () {
	let form = document.getElementById("login-form");
	form.addEventListener("submit", login, true);
	$('#username').focus();
});

function login(event) {
	event.preventDefault();
	const username = document.getElementById('username').value;
	const password = document.getElementById('password').value;
	const submit = document.getElementById("submit");
	submit.disabled = true;
	const data = { password };
	if (isEmail(username)) {
		data.email = username;
	} else {
		data.username = username;
	}
	$.post('/user/login', data).done(async function () {
		const urlString = window.location;
		const url = new URL(urlString);
		const clientId = url.searchParams.get("clientId");
		const redirect = url.searchParams.get("redirect");
		const state = url.searchParams.get("state");
		const configuration = await getConfig();
		const params = new URLSearchParams({
			response_type: "code",
			client_id: clientId || configuration.oauth.clientId,
			redirect_uri: redirect || configuration.oauth.redirectUri,
			state: state || uuidv4()
		});
		window.location = `/oauth/authorize?${params.toString()}`;
	}).fail(function () {
		onSubmitError({ errorText: "Invalid Login", buttonText: "Login" });
	});
}