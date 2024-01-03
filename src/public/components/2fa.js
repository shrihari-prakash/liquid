import { ConfigurationContext } from "../context/configuration.js";
import { afterLogin, errorTextTimeout, getPlaceholder, useTitle } from "../utils/utils.js";

export default function TwoFactorAuthentication() {
    const submitButtonText = "Submit";

    const configuration = React.useContext(ConfigurationContext);

    const [buttonText, setButtonText] = React.useState(submitButtonText);
    const [hasError, setHasError] = React.useState(false);
    const [submitting, setSubmitting] = React.useState(false);

    React.useEffect(() => useTitle(configuration["content.app-name"], "Two-Step Verification"), []);

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
                onSubmitError({ errorText: "Invalid Code" });
            })
            .always(function () {
                setSubmitting(false);
            });
    }

    if (!configuration["privilege.can-reset-password"]) {
        return null;
    }

    return (
        <form className="form" onSubmit={submit2fa}>
            <div className="noselect">
                <h3>
                    Two-Step Verification
                </h3>
                <p className="app-tagline">To login, enter the verification code sent to your email address.</p>
            </div>
            <div className="form-group first">
                <label htmlFor="code">Verification Code</label>
                <input
                    type="text"
                    className="form-control"
                    aria-label="Verification Code"
                    aria-required="true"
                    placeholder={getPlaceholder("Verification Code", configuration)}
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
