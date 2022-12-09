let buttonAnimationTimeout = null;

$(function () {
    let form = document.getElementById("signup-form");
    form.addEventListener("submit", signUp, true);
});

async function signUp(event) {
    event.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const firstName = document.getElementById('firstName').value;
    const lastName = document.getElementById('lastName').value;
    const email = document.getElementById('email').value;
    $.post('/user/create', {
        username, password, firstName, lastName, email
    }).done(function () {
        window.location = `/verify-account`
    }).fail(function () {
        if (buttonAnimationTimeout) {
            clearTimeout(buttonAnimationTimeout);
        }
        const submit = document.getElementById("submit");
        submit.classList.add("shake");
        submit.value = "Signup error";
        buttonAnimationTimeout = setTimeout(function () {
            submit.classList.remove("shake");
            submit.value = "Create Account";
        }, 2000);
    });
}