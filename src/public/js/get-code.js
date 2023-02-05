$(function () {
  let form = document.getElementById("get-code-form");
  form.addEventListener("submit", getCode, true);
});

function getCode(event) {
  event.preventDefault();
  const email = document.getElementById("email").value;
  const submit = document.getElementById("submit");
  submit.disabled = true;
  $.get("/user/code", {
    email,
  })
    .done(function () {
      window.location = `/reset-password${window.location.search}`;
    })
    .fail(function () {
      onSubmitError({ errorText: "Invalid Login", buttonText: "Verify" });
    });
}
