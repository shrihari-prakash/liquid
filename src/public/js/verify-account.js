$(function () {
  let form = document.getElementById("verify-form");
  form.addEventListener("submit", getCode, true);
  STORE.autoFocusElement = $("#code");
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
      const buttonText = submit.value;
      onSubmitError({ errorText: "Invalid Code", buttonText });
    })
    .always(function () {
      submit.disabled = false;
    });
}
