$(function () {
  useTitle("Verify Your Identity")
  let form = document.getElementById("get-code-form");
  form.addEventListener("submit", getCode, true);
  STORE.autoFocusElement = $("#email");
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
    .fail(function (response) {
      const buttonText = submit.value;
      if (response.responseJSON.additionalInfo && response.status === 400) {
        return onFieldError({ response, buttonText });
      }
      onSubmitError({ errorText: "Invalid Login", buttonText });
    })
    .always(function () {
      submit.disabled = false;
    });
}
