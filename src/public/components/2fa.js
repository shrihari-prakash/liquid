import { ConfigurationContext } from "../context/configuration.js";
import { afterLogin, errorTextTimeout, getPlaceholder, useTitle } from "../utils/utils.js";
import { post } from "../utils/api.js";

const OtpInput = ({ length = 6, id }) => {
  const [otp, setOtp] = React.useState(new Array(length).fill(""));
  const inputRefs = React.useRef([]);

  const handleChange = (e, index) => {
    const value = e.target.value;
    if (isNaN(value)) return;

    const newOtp = [...otp];
    // take the last entered character if multiple are somehow entered
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    // move to next input if a digit was entered
    const combinedOtp = newOtp.join("");
    if (value && index < length - 1) {
      inputRefs.current[index + 1].focus();
    }

    // Sync to hidden input for form submission
    const hiddenInput = document.getElementById(id);
    if (hiddenInput) {
      hiddenInput.value = combinedOtp;
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace") {
      if (!otp[index] && index > 0) {
        // Move focus to the previous input on backspace if current is empty
        inputRefs.current[index - 1].focus();
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1].focus();
    } else if (e.key === "ArrowRight" && index < length - 1) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData
      .getData("text/plain")
      .slice(0, length)
      .replace(/[^0-9]/g, "");
    if (!pasteData) return;

    const newOtp = [...otp];
    for (let i = 0; i < pasteData.length; i++) {
      newOtp[i] = pasteData[i];
    }
    setOtp(newOtp);

    const hiddenInput = document.getElementById(id);
    if (hiddenInput) {
      hiddenInput.value = newOtp.join("");
    }

    if (pasteData.length > 0) {
      inputRefs.current[Math.min(pasteData.length, length - 1)].focus();
    }
  };

  return (
    <div className="otp-container">
      {otp.map((data, index) => (
        <input
          key={index}
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          pattern="\d*"
          maxLength={1}
          className="otp-input"
          value={data}
          onChange={(e) => handleChange(e, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          onPaste={handlePaste}
          ref={(ref) => (inputRefs.current[index] = ref)}
          aria-label={`Digit ${index + 1} of ${length}`}
          required={!data} // require input if it's empty
        />
      ))}
      <input type="hidden" id={id} required minLength={length} />
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
        style={{ marginTop: "24px" }}
      />
      <div className="form-error-message">{errorMessage}</div>
    </form>
  );
}

