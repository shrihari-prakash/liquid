import { ConfigurationContext } from "../context/configuration.js";
import { ThemeContext } from "../context/theme.js";
import { countryCodes } from "../utils/country-codes.js";
import { errorTextTimeout, getPlaceholder, useTitle } from "../utils/utils.js";

export default function SignUp() {
  const submitButtonText = i18next.t("button.signup");

  const configuration = React.useContext(ConfigurationContext);
  const theme = React.useContext(ThemeContext);

  const [buttonText, setButtonText] = React.useState(submitButtonText);
  const [hasError, setHasError] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [miniIconLoaded, setMiniIconLoaded] = React.useState(false);

  const appName = configuration["content.app-name"];
  const termsAndConditions = configuration["content.terms-and-conditions-url"];
  const privacyPolicy = configuration["content.privacy-policy-url"]

  React.useEffect(() => useTitle(configuration["content.app-name"], i18next.t("title.signup")), []);

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

  function onFieldError({ response }) {
    let errorField = response.responseJSON.additionalInfo.errors[0].path;
    errorField = errorField.charAt(0).toUpperCase() + errorField.slice(1);
    onSubmitError({ errorText: i18next.t("error.invalid-field", { field_name: errorField }) });
    return;
  }

  function signup(event) {
    event.preventDefault();
    const username = document.getElementById("username").value.trim();
    const firstName = document.getElementById("firstName").value.trim();
    const lastName = document.getElementById("lastName").value.trim();
    const email = document.getElementById("email").value.trim();
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
      .done(function (response) {
        console.log(response);
        if (configuration["user.account-creation.require-email-verification"]) {
          const urlParams = new URLSearchParams(window.location.search);
          urlParams.set('target', response.data.user._id);
          window.location = `/verify-account?${urlParams.toString()}`;
        } else {
          window.location = `/login${window.location.search}`;
        }
      })
      .fail(function (response) {
        if (response.responseJSON.error === "RateLimitError") {
          onSubmitError({ errorText: i18next.t("error.too-many-requests") });
          return;
        }
        if (response.status === 400 && response.responseJSON.additionalInfo) {
          return onFieldError({ response });
        }
        if (response.status === 400 && response.responseJSON.error === "BadEmailDomain") {
          return onSubmitError({ errorText: i18next.t("error.bad-email-domain") });
        }
        if (response.status === 409) {
          return onSubmitError({ errorText: i18next.t("error.duplicate-account") });
        }
        if (response.status === 429) {
          return onSubmitError({ errorText: i18next.t("error.too-many-requests") });
        }
        onSubmitError({ errorText: i18next.t("error.signup-error") });
      })
      .always(function () {
        setSubmitting(false);
      })
  }

  if (!configuration["privilege.can-create-account"]) {
    return null;
  }

  return (
    <form className={`form ${configuration["form.animate-entrance"] && "animate-jelly"}`} onSubmit={signup}>
      <div className="noselect">
        <h3>
          {i18next.t("heading.signup")} &#x2022;&nbsp;
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
          {i18next.t("field.label.username")}
        </label>
        <input
          type="text"
          className="form-control"
          placeholder={getPlaceholder(i18next.t("field.placeholder.username"), configuration)}
          minLength="6"
          aria-label="Username"
          aria-required="true"
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
            {i18next.t("field.label.invite-code")}
          </label>
          <input
            type="text"
            className="form-control"
            aria-label="Invite Code"
            aria-required="true"
            placeholder={getPlaceholder(i18next.t("field.placeholder.invite-code"), configuration)}
            spellCheck="false"
            autoComplete="off"
            id="inviteCode"
            required
          />
        </div>
      }
      <div className="form-group">
        <label className="noselect" htmlFor="firstName">
          {i18next.t("field.label.first-name")}
        </label>
        <input
          type="text"
          className="form-control"
          aria-label="First Name"
          aria-required="true"
          placeholder={getPlaceholder(i18next.t("field.placeholder.first-name"), configuration)}
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
          {i18next.t("field.label.last-name")}
        </label>
        <input
          type="text"
          className="form-control"
          aria-label="Last Name"
          aria-required="true"
          placeholder={getPlaceholder(i18next.t("field.placeholder.last-name"), configuration)}
          minLength="1"
          autoCorrect="off"
          autoCapitalize="on"
          spellCheck="false"
          id="lastName"
          required
        />
      </div>
      <div className="form-group">
        <label className="noselect" htmlFor="email">
          {i18next.t("field.label.email")}
        </label>
        <input
          type="email"
          className="form-control"
          aria-label="Email"
          aria-required="true"
          placeholder={getPlaceholder(i18next.t("field.placeholder.email"), configuration)}
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
              aria-label="Phone"
              aria-required="true"
              placeholder={getPlaceholder("0000000000", configuration)}
              spellCheck="false"
              id="phone"
            />
          </span>
        </div>}
      <div className="form-group last mb-3">
        <label htmlFor="password">{i18next.t("field.label.password")}</label>
        <input
          type="password"
          className="form-control"
          aria-label="Password"
          aria-required="true"
          placeholder={getPlaceholder(i18next.t("field.placeholder.password"), configuration)}
          minLength="8"
          autoComplete="new-password"
          id="password"
          required
        />
      </div>
      <div className="page-links">
        <span className="page-link" aria-label="Login">
          <a href={"/login" + window.location.search} className="page-link">
            {i18next.t("link.login")}
          </a>
        </span>
      </div>
      <input
        type="submit"
        disabled={submitting}
        className={"button" + (hasError ? " shake" : "")}
        value={buttonText}
      />
      <div className="fineprint">
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
