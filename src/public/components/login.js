import { ConfigurationContext } from "../context/configuration.js";
import { ThemeContext } from "../context/theme.js";
import { prepareAuthorizationParams, getPlaceholder, isEmail, useTitle, uuidv4 } from "../utils/utils.js";

export default function Login() {
  const submitButtonText = "Login";

  const configuration = React.useContext(ConfigurationContext);
  const theme = React.useContext(ThemeContext);

  const [buttonText, setButtonText] = React.useState(submitButtonText);
  const [hasError, setHasError] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [miniIconLoaded, setMiniIconLoaded] = React.useState(false);
  const [existingSession, setExistingSession] = React.useState(null);
  const [isLoggedIn, setIsLoggedIn] = React.useState(false);

  const appName = configuration["content.app-name"];

  React.useEffect(() => useTitle(configuration["content.app-name"], "Login"), []);

  React.useEffect(() => {
    (async () => {
      if (configuration["privilege.can-use-existing-session-in-login"]) {
        const response = await fetch("/user/session-state");
        if (response.ok) {
          setIsLoggedIn(true);
          console.log("Bypassing login screen due to an existing session...")
          onLogin();
        }
      }
    })();
  }, [])

  const onSubmitError = (props) => {
    if (hasError) {
      return;
    }
    setHasError(true);
    setButtonText(props.errorText);
    setTimeout(() => {
      setButtonText(submitButtonText);
      setHasError(false);
    }, 2000);
  };

  function onFieldError({ response, buttonText }) {
    let errorField = response.responseJSON.additionalInfo.errors[0].param;
    errorField = errorField.charAt(0).toUpperCase() + errorField.slice(1);
    onSubmitError({ errorText: "Invalid " + errorField, buttonText });
    return;
  }

  async function onLogin() {
    let authParams = prepareAuthorizationParams(configuration);
    const clientInfo = await $.get(`/user/client/${authParams.client_id}`);
    console.log("Client role", clientInfo.data.role);
    if (clientInfo.data.client.role === "internal_client") {
      authParams = new URLSearchParams(authParams);
      window.location = `/oauth/authorize?${authParams.toString()}`;
    } else {
      window.location = `/consent${window.location.search}`;
    }
  }

  async function login(event) {
    event.preventDefault();
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    setSubmitting(true);
    const data = { password };
    if (isEmail(username)) {
      data.email = username;
    } else {
      data.username = username;
    }
    $.post("/user/login", data)
      .done(async function () {
        onLogin();
      })
      .fail(function (response) {
        if (response.responseJSON.error === "RateLimitError") {
          onSubmitError({ errorText: "Too Many Retries" });
          return;
        }
        if (response.responseJSON.error === "ResourceNotActive") {
          onSubmitError({ errorText: "Account not verified" });
          return;
        }
        if (response.status === 400 && response.responseJSON.additionalInfo) {
          return onFieldError({ response });
        }
        onSubmitError({ errorText: "Invalid Login" });
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
    )
  }

  return (
    <form className="form" onSubmit={login}>
      <div className="noselect">
        <h3>
          Login to&nbsp;
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
          Username or Email
        </label>
        <input
          type="text"
          className="form-control"
          aria-label="Username or Email"
          aria-required="true"
          placeholder={getPlaceholder("your_username", configuration)}
          minLength="8"
          autoComplete="username"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
          id="username"
          required
        />
      </div>
      <div className="form-group last">
        <label htmlFor="password">Password</label>
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
              Create Account
            </a>
          </span>
        )}
        {configuration["privilege.can-reset-password"] && (
          <span className="page-link">
            <a href={"/get-code" + window.location.search} className="page-link forgot-password-link" aria-label="Forgot Password?">
              Forgot Password?
            </a>
          </span>
        )}
      </div>
      <input type="submit" disabled={submitting} className={"button" + (hasError ? " shake" : "")} value={buttonText} />
    </form>
  );
}
