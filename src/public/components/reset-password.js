import { ConfigurationContext } from "../context/configuration.js";
import { errorTextTimeout, getPlaceholder, useTitle } from "../utils/utils.js";

export default function ResetPassword() {
  const submitButtonText = i18next.t("button.change-password");

  const configuration = React.useContext(ConfigurationContext);

  const [errorMessage, setErrorMessage] = React.useState("");
  // hasError removed - errors now shown in dedicated area
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => useTitle(configuration["content.app-name"], i18next.t("title.reset-password")), []);

  const onSubmitError = (props) => {
    
    setErrorMessage(props.errorText);
  };

  function resetPassword(event) {
    event.preventDefault();
    setErrorMessage("");
    
    const code = document.getElementById("code").value;
    const password = document.getElementById("password").value;
    const urlParams = new URLSearchParams(window.location.search);
    const target = urlParams.get("target");
    setSubmitting(true);
    $.post("/user/reset-password", {
      target,
      code,
      password,
    })
      .done(function () {
        window.location = `/login${window.location.search}`;
      })
      .fail(function () {
        onSubmitError({ errorText: i18next.t("error.invalid-code") });
      })
      .always(function () {
        setSubmitting(false);
      });
  }

  if (!configuration["privilege.can-reset-password"]) {
    return null;
  }

  return (
    <form className="form" onSubmit={resetPassword}>
      <div className="noselect">
        <h3>{i18next.t("heading.reset-password")}</h3>
        <p className="app-tagline">{i18next.t("message.reset-password-instructions")}</p>
      </div>
      <div className="form-group first">
        <label htmlFor="code">{i18next.t("field.label.verification-code")}</label>
        <input
          type="text"
          className="form-control"
          aria-label="Verification Code"
          aria-required="true"
          placeholder={getPlaceholder(i18next.t("field.placeholder.verification-code"), configuration)}
          pattern="[0-9]*"
          inputMode="numeric"
          minLength="6"
          autoComplete="off"
          id="code"
          required
        />
      </div>
      <div className="form-group mb-3 last">
        <label htmlFor="password">{i18next.t("field.label.new-password")}</label>
        <input
          type="password"
          className="form-control"
          aria-label="Password"
          aria-required="true"
          placeholder={getPlaceholder(i18next.t("field.placeholder.new-password"), configuration)}
          minLength="8"
          autoComplete="new-password"
          id="password"
          required
        />
      </div>
      <div className="page-links"></div>
      <input
        type="submit"
        disabled={submitting}
        className="button"
        value={submitButtonText}
      />
      <div className="form-error-message">{errorMessage}</div>
    </form>
  );
}

