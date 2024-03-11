import { ConfigurationContext } from "../context/configuration.js";
import { errorTextTimeout, getPlaceholder, useTitle } from "../utils/utils.js";

export default function GetCode() {
    const submitButtonText = i18next.t("button.get-code");

    const configuration = React.useContext(ConfigurationContext);

    const [buttonText, setButtonText] = React.useState(submitButtonText);
    const [hasError, setHasError] = React.useState(false);
    const [submitting, setSubmitting] = React.useState(false);

    React.useEffect(() => useTitle(configuration["content.app-name"], i18next.t("title.verify-your-identity")), []);

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

    function getCode(event) {
        event.preventDefault();
        const email = document.getElementById("email").value;
        setSubmitting(true);
        $.get("/user/code", {
            email,
        })
            .done(function (response) {
                const urlParams = new URLSearchParams(window.location.search);
                urlParams.set('target', response.data.target);
                window.location = `/reset-password?${urlParams.toString()}`;
            })
            .fail(function (response) {
                if (response.responseJSON.additionalInfo && response.status === 400) {
                    return onFieldError({ response });
                }
                onSubmitError({ errorText: i18next.t("error.inavlid-login") });
            })
            .always(function () {
                setSubmitting(false);
            });
    }

    if (!configuration["privilege.can-reset-password"]) {
        return null;
    }

    return (
        <form className={`form ${configuration["form.animate-entrance"] && "animate-jelly"}`} onSubmit={getCode}>
            <div className="noselect">
                <h3>
                    {i18next.t("heading.verify-your-identity")}
                </h3>
                <p className="app-tagline">{i18next.t("message.recover-instructions")}</p>
            </div>
            <div className="form-group first last">
                <label className="noselect" htmlFor="email">{i18next.t("field.label.email")}</label>
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
            <input type="submit" disabled={submitting} className={"button" + (hasError ? " shake" : "")} value={buttonText} />
        </form>
    );
}
