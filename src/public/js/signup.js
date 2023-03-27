$(function () {
  let form = document.getElementById("signup-form");
  form.addEventListener("submit", signup, true);
  STORE.autoFocusElement = $("#username");
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
      const buttonText = submit.value;
      if (response.responseJSON.error === "RateLimitError") {
        onSubmitError({ errorText: "Too Many Requests", buttonText });
        return;
      }
      if (response.status === 400 && response.responseJSON.additionalInfo) {
        return onFieldError({ response, buttonText });
      }
      if (response.status === 409) {
        return onSubmitError({ errorText: "Account already exists", buttonText });
      }
      onSubmitError({ errorText: "Signup error", buttonText });
    })
    .always(function () {
      submit.disabled = false;
    });
}
