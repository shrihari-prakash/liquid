import { ConfigurationContext } from "../context/configuration.js";
import { afterLogin, errorTextTimeout, getPlaceholder, useTitle } from "../utils/utils.js";
import { post } from "../utils/api.js";

const OtpInput = ({ length = 6, id, autoFocus = true }) => {
  const [value, setValue] = React.useState("");
  const [isFocused, setIsFocused] = React.useState(false);
  const inputRef = React.useRef(null);

  React.useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleChange = (e) => {
    const digitsOnly = e.target.value.replace(/\D/g, "").slice(0, length);
    setValue(digitsOnly);
  };

  const handleClick = () => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <div className="otp-wrapper" onClick={handleClick}>
      <div className="otp-container" aria-hidden="true">
        {Array.from({ length }).map((_, index) => {
          const char = value[index] || "";
          const isActive =
            isFocused &&
            (value.length === index ||
              (value.length === length && index === length - 1));

          return (
            <div
              key={index}
              className={
                "otp-slot" +
                (isActive ? " otp-slot-active" : "") +
                (char ? " otp-slot-filled" : "")
              }
            >
              {char}
              {isActive && !char && <span className="otp-caret" />}
            </div>
          );
        })}
      </div>
      <input
        ref={inputRef}
        id={id}
        name={id}
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="[0-9]*"
        maxLength={length}
        value={value}
        onChange={handleChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className="otp-real-input"
        aria-label="Verification Code"
        required
      />
    </div>
  );
};

export default function TwoFactorAuthentication() {
  const submitButtonText = i18next.t("button.submit");

  const configuration = React.useContext(ConfigurationContext);

  const [errorMessage, setErrorMessage] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => useTitle(configuration["content.app-name"], i18next.t("title.2fa")), []);

  const onSubmitError = (props) => {
    setErrorMessage(props.errorText);
  };

  async function submit2fa(event) {
    event.preventDefault();
    setErrorMessage("");
    const code = document.getElementById("code").value;
    const urlParams = new URLSearchParams(window.location.search);
    const target = urlParams.get("target");
    const sessionHash = urlParams.get("session_hash");
    setSubmitting(true);
    try {
      const result = await post("/user/do-2fa", { target, code, sessionHash });
      if (result.ok) {
        afterLogin(configuration);
      } else {
        onSubmitError({ errorText: i18next.t("error.invalid-code") });
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="form" onSubmit={submit2fa}>
      <div className="noselect">
        <h3>{i18next.t("heading.2fa")}</h3>
        <p className="app-tagline">{i18next.t("message.enter-login-code")}</p>
      </div>
      <div className="form-group first">
        <OtpInput length={6} id="code" />
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

