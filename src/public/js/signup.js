$(function () {
  let form = document.getElementById("signup-form");
  form.addEventListener("submit", signup, true);
});

function signup(event) {
  event.preventDefault();
  const username = document.getElementById("username").value;
  const firstName = document.getElementById("firstName").value;
  const lastName = document.getElementById("lastName").value;
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const submit = document.getElementById("submit");
  submit.disabled = true;
  $.post("/user/create", {
    username,
    password,
    firstName,
    lastName,
    email,
  })
    .done(function () {
      window.location = `/verify-account${window.location.search}`;
    })
    .fail(function (response) {
      if (response.responseJSON.error === "RateLimitError") {
        onSubmitError({ errorText: "Too Many Requests", buttonText: "Create Account" });
        return;
      }
      onSubmitError({ errorText: "Signup error", buttonText: "Create Account" });
    });
}
