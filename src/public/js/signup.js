$(function () {
    let form = document.getElementById("signup-form");
    form.addEventListener("submit", verifyAccount, true);
});

function verifyAccount(event) {
    event.preventDefault();
    const username = document.getElementById('username').value;
    const firstName = document.getElementById('firstName').value;
    const lastName = document.getElementById('lastName').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    $.post('/user/create', {
        username, password, firstName, lastName, email
    }).done(function () {
        window.location = `/verify-account`;
    }).fail(function () {
        onSubmitError({ errorText: "Signup error", buttonText: "Create Account" });
    });
}