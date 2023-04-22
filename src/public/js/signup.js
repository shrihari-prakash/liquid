$(async function () {
  useTitle("Sign Up");
  let form = document.getElementById("signup-form");
  form.addEventListener("submit", signup, true);
  STORE.autoFocusElement = $("#username");
  if (!await getOption("privilege.can-create-account")) {
    $("body").empty();
  }
  if (!await getOption("privilege.can-use-phone-number")) {
    $(".phone-group").hide();
  } else {
    const onPhoneChange = function () {
      $("#width_tmp_option").html($('#phoneCountryCode option:selected').text());
      $('#phoneCountryCode').width($("#width_tmp_select").width());
    };
    $('#phoneCountryCode').change(onPhoneChange);
    onPhoneChange();
  }
});

async function signup(event) {
  event.preventDefault();
  const username = document.getElementById("username").value;
  const firstName = document.getElementById("firstName").value;
  const lastName = document.getElementById("lastName").value;
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const submit = document.getElementById("submit");
  const user = {
    username,
    password,
    firstName,
    lastName,
    email,
  };
  if (await getOption("privilege.can-use-phone-number")) {
    user.phone = document.getElementById("phone").value;
    user.phoneCountryCode = "+" + document.getElementById("phoneCountryCode").value;
  }
  submit.disabled = true;
  $.post("/user/create", user)
    .done(async function () {
      if (await getOption("user.require-email-verification")) {
        window.location = `/verify-account${window.location.search}`;
      } else {
        window.location = `/login${window.location.search}`
      }
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
