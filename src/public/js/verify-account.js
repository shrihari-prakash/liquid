$(function () {
    let form = document.getElementById("verify-form");
    form.addEventListener("submit", verifyAccount, true);
});

function verifyAccount(event) {
    event.preventDefault();
    const code = document.getElementById('code').value;
    $.get('/user/verify-email', {
        code
    }).done(function () {
        window.location = `/login`
    }).fail(function () {
        onSubmitError({ errorText: "Invalid Code", buttonText: "Verify" });
    });
}