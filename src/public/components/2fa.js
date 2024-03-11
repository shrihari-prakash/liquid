import { ConfigurationContext } from "../context/configuration.js";
import { afterLogin, errorTextTimeout, getPlaceholder, useTitle } from "../utils/utils.js";

export default function TwoFactorAuthentication() {
    const submitButtonText = i18next.t("button.submit");

    const configuration = React.useContext(ConfigurationContext);

    const [buttonText, setButtonText] = React.useState(submitButtonText);
    const [hasError, setHasError] = React.useState(false);
    const [submitting, setSubmitting] = React.useState(false);

    React.useEffect(() => useTitle(configuration["content.app-name"], i18next.t("title.2fa")), []);

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

    function submit2fa(event) {
        event.preventDefault();
        const code = document.getElementById("code").value;
        const urlParams = new URLSearchParams(window.location.search);
        const target = urlParams.get("target");
        const sessionHash = urlParams.get("session_hash");
        setSubmitting(true);
        $.post("/user/do-2fa", {
            target,
            code,
            sessionHash
        })
            .done(function () {
                afterLogin(configuration)
            })
            .fail(function () {
                onSubmitError({ errorText: i18next.t("error.invalid-code") });
            })
            .always(function () {
                setSubmitting(false);
            });
    }

    return (
        <form className={`form ${configuration["form.animate-entrance"] && "animate-jelly"}`} onSubmit={submit2fa}>
            <div className="noselect">
                <h3>
                    {i18next.t("heading.2fa")}
                </h3>
                <p className="app-tagline">{i18next.t("message.enter-login-code")}</p>
            </div>
            <div className="form-group first">
                <label htmlFor="code">{i18next.t("field.label.verification-code")}</label>
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
                    id="code"
                    required
                />
            </div>
            <div className="page-links"></div>
            <input type="submit" disabled={submitting} className={"button" + (hasError ? " shake" : "")} value={buttonText} />
        </form >
    );
}
