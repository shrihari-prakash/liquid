import { ConfigurationContext } from "../context/configuration.js";
import { getPlaceholder, useTitle } from "../utils/utils.js";
import { get } from "../utils/api.js";

const RESEND_COOLDOWN = 30;

export default function VerifyAccount() {
  const submitButtonText = i18next.t("button.verify");

  const configuration = React.useContext(ConfigurationContext);

  const [errorMessage, setErrorMessage] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [countdown, setCountdown] = React.useState(RESEND_COOLDOWN);
  const [resendStatus, setResendStatus] = React.useState("");

  React.useEffect(() => useTitle(configuration["content.app-name"], i18next.t("title.verify-account")), []);

  // Start countdown on mount
  React.useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const onSubmitError = (props) => {
    setErrorMessage(props.errorText);
  };

  async function verifyAccount(event) {
    event.preventDefault();
    setErrorMessage("");

    const code = document.getElementById("code").value;
    const urlParams = new URLSearchParams(window.location.search);
    const target = urlParams.get("target");
    setSubmitting(true);
    try {
      const result = await get("/user/verify-email", { target, code });
      if (result.ok) {
        window.location = `/login${window.location.search}`;
      } else {
        onSubmitError({ errorText: i18next.t("error.invalid-code") });
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function resendCode(event) {
    event.preventDefault();
    setResendStatus("");
    const urlParams = new URLSearchParams(window.location.search);
    const target = urlParams.get("target");
    try {
      const result = await get("/user/resend-verification", { target });
      if (result.ok) {
        setResendStatus(i18next.t("message.verification-resent"));
      } else {
        setResendStatus(i18next.t("error.resend-failed"));
      }
    } catch {
      setResendStatus(i18next.t("error.resend-failed"));
    }
    setCountdown(RESEND_COOLDOWN);
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
      <div className="page-links">
        {countdown > 0 ? (
          <span className="resend-countdown">{i18next.t("message.resend-code-in", { seconds: countdown })}</span>
        ) : (
          <a href="#" className="page-link" onClick={resendCode}>
            {i18next.t("link.resend-code")}
          </a>
        )}
      </div>
      <input type="submit" disabled={submitting} className="button" value={submitButtonText} />
      {resendStatus && <div className="form-success-message">{resendStatus}</div>}
      <div className="form-error-message">{errorMessage}</div>
    </form>
  );
}

