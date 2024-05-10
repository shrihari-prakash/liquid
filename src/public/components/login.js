import { ConfigurationContext } from "../context/configuration.js";
import { ThemeContext } from "../context/theme.js";
import {
  prepareAuthorizationParams,
  getPlaceholder,
  isEmail,
  useTitle,
  uuidv4,
  errorTextTimeout,
  afterLogin,
} from "../utils/utils.js";

export default function Login() {
  const submitButtonText = i18next.t("button.login");

  const configuration = React.useContext(ConfigurationContext);
  const theme = React.useContext(ThemeContext);

  const [buttonText, setButtonText] = React.useState(submitButtonText);
  const [hasError, setHasError] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [miniIconLoaded, setMiniIconLoaded] = React.useState(false);
  const [existingSession, setExistingSession] = React.useState(null);
  const [isLoggedIn, setIsLoggedIn] = React.useState(false);

  const appName = configuration["content.app-name"];

  React.useEffect(() => useTitle(configuration["content.app-name"], i18next.t("title.login")), []);

  React.useEffect(() => {
    (async () => {
      if (configuration["privilege.can-use-existing-session-in-login"]) {
        const response = await fetch("/user/session-state");
        if (response.ok) {
          setIsLoggedIn(true);
          console.log("Bypassing login screen due to an existing session...");
          onLogin({});
        }
      }
    })();
  }, []);

  const onSubmitError = (props) => {
    if (hasError) {
      return;
    }
    setHasError(true);
    setButtonText(props.errorText);
    setTimeout(() => {
      setButtonText(submitButtonText);
      setHasError(false);
    }, errorTextTimeout);
  };

  function onFieldError({ response, buttonText }) {
    let errorField = response.responseJSON.additionalInfo.errors[0].path;
    errorField = errorField.charAt(0).toUpperCase() + errorField.slice(1);
    onSubmitError({ errorText: "Invalid " + errorField, buttonText });
    return;
  }

  async function onLogin(data) {
    if (data["2faEnabled"]) {
      const urlParams = new URLSearchParams(window.location.search);
      urlParams.set("target", data.userInfo._id);
      urlParams.set("session_hash", data.sessionHash);
      window.location = `/2fa?${urlParams.toString()}`;
    } else {
      afterLogin(configuration);
    }
  }

  async function login(event) {
    event.preventDefault();
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    setSubmitting(true);
    const data = { password, userAgent: window.navigator.userAgent };
    if (isEmail(username)) {
      data.email = username;
    } else {
      data.username = username;
    }
    $.post("/user/login", data)
      .done(async function (response) {
        onLogin(response.data);
      })
      .fail(function (response) {
        if (response.responseJSON.error === "RateLimitError") {
          onSubmitError({ errorText: i18next.t("error.too-many-retries") });
          return;
        }
        if (response.responseJSON.error === "ResourceNotActive") {
          onSubmitError({ errorText: i18next.t("error.account-not-verified") });
          return;
        }
        if (response.status === 400 && response.responseJSON.additionalInfo) {
          return onFieldError({ response });
        }
        onSubmitError({ errorText: i18next.t("error.invalid-login") });
      })
      .always(function () {
        setSubmitting(false);
      });
  }

  if (isLoggedIn) {
    return (
      <div className="form-loader">
        <div className="spinner"></div>
        Redirecting... Please Wait...
      </div>
    );
  }

  return (
    <form className={`form ${configuration["form.animate-entrance"] && "animate-jelly"}`} onSubmit={login}>
      <div className="noselect">
        <h3>
          {i18next.t("heading.login")}&nbsp;
          {configuration[`assets.header-icon-${theme}`] ? (
            <div className="app-icon-header">
              <div style={{ display: miniIconLoaded ? "none" : "block" }} className="spinner" />
              <img
                style={{ display: miniIconLoaded ? "block" : "none" }}
                onLoad={() => setMiniIconLoaded(true)}
                alt={appName}
                src={configuration[`assets.header-icon-${theme}`]}
              />
            </div>
          ) : (
            <strong className="app-name">{appName}</strong>
          )}
        </h3>
        <p className="app-tagline">{configuration["content.app-tagline"]}</p>
      </div>
      <div className="form-group first">
        <label className="noselect" htmlFor="username">
          {i18next.t("field.label.username-or-email")}
        </label>
        <input
          type="text"
          className="form-control"
          aria-label="Username or Email"
          aria-required="true"
          placeholder={getPlaceholder(i18next.t("field.placeholder.username-or-email"), configuration)}
          minLength="6"
          autoComplete="username"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
          id="username"
          required
        />
      </div>
      <div className="form-group last">
        <label htmlFor="password">{i18next.t("field.label.password")}</label>
        <input
          type="password"
          className="form-control"
          aria-label="Password"
          aria-required="true"
          placeholder={getPlaceholder("********", configuration)}
          minLength="8"
          autoComplete="current-password"
          id="password"
          required
        />
      </div>
      <div className="page-links">
        {configuration["privilege.can-create-account"] && (
          <span className="page-link">
            <a href={"/signup" + window.location.search} className="page-link signup-link" aria-label="Sign Up">
              {i18next.t("link.create-account")}
            </a>
          </span>
        )}
        {configuration["privilege.can-reset-password"] && (
          <span className="page-link">
            <a
              href={"/get-code" + window.location.search}
              className="page-link forgot-password-link"
              aria-label="Forgot Password?"
            >
              {i18next.t("link.forgot-password")}
            </a>
          </span>
        )}
      </div>
      <div className="flex flex-col gap">
        <input
          type="submit"
          disabled={submitting}
          className={"button" + (hasError ? " shake" : "")}
          value={buttonText}
        />
        <button type="button" disabled={submitting} className={"button outline"}>
          <img src="/images/icon-google.png" alt="Google" height="20" /> {i18next.t("button.signin.google")}
        </button>
      </div>
    </form>
  );
}
