$(function () {
  let form = document.getElementById("reset-password-form");
  form.addEventListener("submit", getCode, true);
});

function getCode(event) {
  event.preventDefault();
  const code = document.getElementById("code").value;
  const password = document.getElementById("password").value;
  const submit = document.getElementById("submit");
  submit.disabled = true;
  $.post("/user/reset-password", {
    code,
    password,
  })
    .done(function () {
      window.location = `/login${window.location.search}`;
    })
    .fail(function () {
      onSubmitError({ errorText: "Invalid Code", buttonText: "Verify" });
    });
}
