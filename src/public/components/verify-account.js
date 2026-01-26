import { ConfigurationContext } from "../context/configuration.js";
import { errorTextTimeout, getPlaceholder, useTitle } from "../utils/utils.js";

export default function VerifyAccount() {
  const submitButtonText = i18next.t("button.verify");

  const configuration = React.useContext(ConfigurationContext);

  const [errorMessage, setErrorMessage] = React.useState("");
  // hasError removed
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => useTitle(configuration["content.app-name"], i18next.t("title.verify-account")), []);

  const onSubmitError = (props) => {
    
    setErrorMessage(props.errorText);
  };

  function verifyAccount(event) {
    event.preventDefault();
    setErrorMessage("");
    
    const code = document.getElementById("code").value;
    const urlParams = new URLSearchParams(window.location.search);
    const target = urlParams.get("target");
    setSubmitting(true);
    $.get("/user/verify-email", {
      target,
      code,
    })
      .done(function () {
        window.location = `/login${window.location.search}`;
      })
      .fail(function () {
        onSubmitError({ errorText: "Invalid Code" });
      })
      .always(function () {
        setSubmitting(false);
      });
  }

  if (!configuration["user.account-creation.require-email-verification"]) {
    return null;
  }

  return (
    <form className="form" onSubmit={verifyAccount}>
      <div className="noselect">
        <h3>{i18next.t("heading.verify-account")}</h3>
        <p className="app-tagline">{i18next.t("message.verification-instructions")}</p>
      </div>
      <div className="form-group first last">
        <label className="noselect" htmlFor="username">
          {i18next.t("field.label.verification-code")}
        </label>
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
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
          id="code"
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

