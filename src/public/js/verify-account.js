let buttonAnimationTimeout = null;

$(function () {
    let form = document.getElementById("verify-form");
    form.addEventListener("submit", signUp, true);
});

async function signUp(event) {
    event.preventDefault();
    const code = document.getElementById('code').value;
    $.get('/user/verify-email', {
        code
    }).done(function () {
        window.location = `/login`
    }).fail(function () {
        if (buttonAnimationTimeout) {
            clearTimeout(buttonAnimationTimeout);
        }
        const submit = document.getElementById("submit");
        submit.classList.add("shake");
        submit.value = "Invalid Code";
        buttonAnimationTimeout = setTimeout(function () {
            submit.classList.remove("shake");
            submit.value = "Verify";
        }, 2000);
    });
}