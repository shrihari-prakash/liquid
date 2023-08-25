import { ConfigurationContext } from "../context/configuration.js";
import { ThemeContext } from "../context/theme.js";
import { countryCodes } from "../utils/country-codes.js";
import { getPlaceholder, useTitle } from "../utils/utils.js";

export default function SignUp() {
  const submitButtonText = "Create Account";

  const configuration = React.useContext(ConfigurationContext);
  const theme = React.useContext(ThemeContext);

  const [buttonText, setButtonText] = React.useState(submitButtonText);
  const [hasError, setHasError] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [miniIconLoaded, setMiniIconLoaded] = React.useState(false);

  const appName = configuration["content.app-name"];
  const termsAndConditions = configuration["content.terms-and-conditions-url"];
  const privacyPolicy = configuration["content.privacy-policy-url"]

  React.useEffect(() => useTitle(configuration["content.app-name"], "Sign Up"), []);

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

  function onFieldError({ response }) {
    let errorField = response.responseJSON.additionalInfo.errors[0].param;
    errorField = errorField.charAt(0).toUpperCase() + errorField.slice(1);
    onSubmitError({ errorText: "Invalid " + errorField });
    return;
  }

  function signup(event) {
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
    if (configuration["privilege.can-use-phone-number"]) {
      user.phone = document.getElementById("phone").value;
      user.phoneCountryCode = document.getElementById("phoneCountryCode").value;
    }
    if (configuration["user.account-creation.enable-invite-only"]) {
      user.inviteCode = document.getElementById("inviteCode").value;
    }
    setSubmitting(true);
    $.post("/user/create", user)
      .done(function () {
        if (configuration["user.account-creation.require-email-verification"]) {
          window.location = `/verify-account${window.location.search}`;
        } else {
          window.location = `/login${window.location.search}`;
        }
      })
      .fail(function (response) {
        if (response.responseJSON.error === "RateLimitError") {
          onSubmitError({ errorText: "Too Many Requests" });
          return;
        }
        if (response.status === 400 && response.responseJSON.additionalInfo) {
          return onFieldError({ response });
        }
        if (response.status === 400 && response.responseJSON.error === "BadEmailDomain") {
          return onSubmitError({ errorText: "Bad email domain" });
        }
        if (response.status === 409) {
          return onSubmitError({ errorText: "Account already exists" });
        }
        if (response.status === 429) {
          return onSubmitError({ errorText: "Account creation limited" });
        }
        onSubmitError({ errorText: "Signup error" });
      })
      .always(function () {
        setSubmitting(false);
      })
  }

  if (!configuration["privilege.can-create-account"]) {
    return null;
  }

  return (
    <form className="form" onSubmit={signup}>
      <div className="noselect">
        <h3>
          Sign up &#x2022;&nbsp;
          {configuration[`assets.header-icon-${theme}`] ? (
            <div className="app-icon-header">
              <div
                style={{ display: miniIconLoaded ? "none" : "block" }}
                className="spinner"
              />
              <img
                style={{ display: miniIconLoaded ? "block" : "none" }}
                onLoad={() => setMiniIconLoaded(true)}
                alt={appName}
                src={configuration[`assets.header-icon-${theme}`]} />
            </div>
          ) : (
            <strong className="app-name">{appName}</strong>
          )}
        </h3>
        <p className="app-tagline">{configuration["content.app-tagline"]}</p>
      </div>
      <div className="form-group first">
        <label className="noselect" htmlFor="username">
          Username
        </label>
        <input
          type="text"
          className="form-control"
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
      {configuration["user.account-creation.enable-invite-only"] &&
        <div className="form-group">
          <label className="noselect" htmlFor="email">
            Invite Code
          </label>
          <input
            type="text"
            className="form-control"
            placeholder={getPlaceholder("YOUR-INVITE-CODE", configuration)}
            spellCheck="false"
            autoComplete="off"
            id="inviteCode"
            required
          />
        </div>
      }
      <div className="form-group">
        <label className="noselect" htmlFor="firstName">
          First Name
        </label>
        <input
          type="text"
          className="form-control"
          placeholder={getPlaceholder("Your First Name", configuration)}
          minLength="3"
          autoCorrect="off"
          autoCapitalize="on"
          spellCheck="false"
          id="firstName"
          required
        />
      </div>
      <div className="form-group">
        <label className="noselect" htmlFor="lastName">
          Last Name
        </label>
        <input
          type="text"
          className="form-control"
          placeholder={getPlaceholder("Your Last Name", configuration)}
          minLength="3"
          autoCorrect="off"
          autoCapitalize="on"
          spellCheck="false"
          id="lastName"
          required
        />
      </div>
      <div className="form-group">
        <label className="noselect" htmlFor="email">
          Email
        </label>
        <input
          type="email"
          className="form-control"
          placeholder={getPlaceholder("your@email.com", configuration)}
          spellCheck="false"
          id="email"
          required
        />
      </div>
      {configuration["privilege.can-use-phone-number"]
        && <div className="form-group phone-group">
          <label className="noselect" htmlFor="phone">
            Phone
          </label>
          <span className="form-control-multi flex">
            <select
              name="phoneCountryCode"
              id="phoneCountryCode"
              className="dropdown"
            >
              <option disabled selected value>
                XX (+00)
              </option>
              {countryCodes.map((countryCode) =>
                <option value={countryCode.code}>
                  {`${countryCode.iso} (${countryCode.code})`}
                </option>)}
            </select>
            <input
              type="tel"
              className="form-control"
              placeholder={getPlaceholder("0000000000", configuration)}
              spellCheck="false"
              id="phone"
            />
          </span>
        </div>}
      <div className="form-group last mb-3">
        <label htmlFor="password">Password</label>
        <input
          type="password"
          className="form-control"
          placeholder={getPlaceholder("********", configuration)}
          minLength="8"
          autoComplete="new-password"
          id="password"
          required
        />
      </div>
      <div className="page-links">
        <span className="page-link">
          <a href={"/login" + window.location.search} className="page-link">
            Have an account? Login
          </a>
        </span>
      </div>
      <input
        type="submit"
        disabled={submitting}
        className={"button" + (hasError ? " shake" : "")}
        value={buttonText}
      />
      <div class="fineprint">
        {(termsAndConditions || privacyPolicy) &&
          "By clicking on Create Account, you"
        }
        {termsAndConditions &&
          <>
            &nbsp;agree to the <a href={termsAndConditions}> terms & conditions</a> of {appName}
            {!privacyPolicy && "."}
          </>
        }
        {privacyPolicy &&
          <>
            &nbsp;{termsAndConditions && "and "}
            confirm that you've read our <a href={privacyPolicy}>privacy policy</a>.
          </>
        }
      </div>
    </form>
  );
}
