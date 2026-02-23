import { ConfigurationContext } from "../context/configuration.js";
import { errorTextTimeout, getPlaceholder, useTitle } from "../utils/utils.js";
import { get } from "../utils/api.js";

export default function GetCode() {
  const submitButtonText = i18next.t("button.get-code");

  const configuration = React.useContext(ConfigurationContext);

  const [errorMessage, setErrorMessage] = React.useState("");
  // hasError removed
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => useTitle(configuration["content.app-name"], i18next.t("title.verify-your-identity")), []);

  const onSubmitError = (props) => {
    setErrorMessage(props.errorText);
  };

  async function getCode(event) {
    event.preventDefault();
    setErrorMessage("");

    const email = document.getElementById("email").value;
    setSubmitting(true);
    try {
      const result = await get("/user/code", { email });
      if (result.ok) {
        const urlParams = new URLSearchParams(window.location.search);
        urlParams.set("target", result.data.data.target);
        window.location = `/reset-password?${urlParams.toString()}`;
      } else {
        if (result.error.additionalInfo && result.status === 400) {
          return onFieldError({ response: { responseJSON: result.error, status: result.status } });
        }
        onSubmitError({ errorText: i18next.t("error.invalid-login") });
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (!configuration["privilege.can-reset-password"]) {
    return null;
  }

  return (
    <form className="form" onSubmit={getCode}>
      <div className="noselect">
        <h3>{i18next.t("heading.verify-your-identity")}</h3>
        <p className="app-tagline">{i18next.t("message.recover-instructions")}</p>
      </div>
      <div className="form-group first last">
        <label className="noselect" htmlFor="email">
          {i18next.t("field.label.email")}
        </label>
        <input
          type="email"
          className="form-control"
          aria-label="Email"
          aria-required="true"
          placeholder={getPlaceholder(i18next.t("field.placeholder.email"), configuration)}
          minLength="8"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
          id="email"
          required
        />
      </div>
      <div className="page-links">
        <span className="page-link">
          <a href={"/login" + window.location.search} className="page-link" aria-label="Login">
            {i18next.t("link.login-minimal")}
          </a>
        </span>
      </div>
      <input type="submit" disabled={submitting} className="button" value={submitButtonText} />
      <div className="form-error-message">{errorMessage}</div>
    </form>
  );
}

