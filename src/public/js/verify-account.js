$(function () {
  let form = document.getElementById("verify-form");
  form.addEventListener("submit", getCode, true);
});

function getCode(event) {
  event.preventDefault();
  const code = document.getElementById("code").value;
  const submit = document.getElementById("submit");
  submit.disabled = true;
  $.get("/user/verify-email", {
    code,
  })
    .done(function () {
      window.location = `/login${window.location.search}`;
    })
    .fail(function () {
      onSubmitError({ errorText: "Invalid Code", buttonText: "Verify" });
    })
    .always(function () {
      submit.disabled = false;
    });
}
