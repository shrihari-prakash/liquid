import { ConfigurationContext } from "../context/configuration.js";
import { ThemeContext } from "../context/theme.js";
import { isEmail, useTitle, uuidv4 } from "../utils/utils.js";
import Layout from "./layout.js";

export default function Login() {
  const submitButtonText = "Login";

  const configuration = React.useContext(ConfigurationContext);
  const theme = React.useContext(ThemeContext);

  const [buttonText, setButtonText] = React.useState(submitButtonText);
  const [hasError, setHasError] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  const appName = configuration["content.app-name"];
  const favicon = configuration["assets.favicon-uri"];

  React.useEffect(() => useTitle(configuration["content.app-name"], "Login"), []);

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

  function login(event) {
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
      .done(function () {
        const urlString = window.location;
        const url = new URL(urlString);
        const clientId = url.searchParams.get("clientId");
        const redirect = url.searchParams.get("redirect");
        const state = url.searchParams.get("state");
        const params = new URLSearchParams({
          response_type: "code",
          client_id: clientId || configuration["oauth.client-id"],
          redirect_uri: redirect || configuration["oauth.redirect-uri"],
          state: state || uuidv4(),
        });
        window.location = `/oauth/authorize?${params.toString()}`;
      })
      .fail(function (response) {
        if (response.responseJSON.error === "RateLimitError") {
          onSubmitError({ errorText: "Too Many Retries" });
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

  return (
    <form className="form" onSubmit={login}>
      <div className="noselect">
        <h3>
          Login to&nbsp;
          {configuration[`assets.header-icon-${theme}`] ? (
            <img height="32" alt={appName} src={configuration[`assets.header-icon-${theme}`]} />
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
          placeholder="your_username"
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
          placeholder="********"
          minLength="8"
          autoComplete="current-password"
          id="password"
          required
        />
      </div>
      <div className="page-links">
        {configuration["privilege.can-create-account"] && (
          <span className="page-link">
            <a href={"/signup" + window.location.search} className="page-link signup-link">
              Create Account
            </a>
          </span>
        )}
        {configuration["privilege.can-reset-password"] && (
          <span className="page-link">
            <a href={"/get-code" + window.location.search} className="page-link forgot-password-link">
              Forgot Password?
            </a>
          </span>
        )}
      </div>
      <input type="submit" disabled={submitting} className={"button" + (hasError ? " shake" : "")} value={buttonText} />
    </form>
  );
}
