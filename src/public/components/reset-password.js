import { ConfigurationContext } from "../context/configuration.js";
import { errorTextTimeout, getPlaceholder, useTitle } from "../utils/utils.js";

export default function ResetPassword() {
    const submitButtonText = "Change Password";

    const configuration = React.useContext(ConfigurationContext);

    const [buttonText, setButtonText] = React.useState(submitButtonText);
    const [hasError, setHasError] = React.useState(false);
    const [submitting, setSubmitting] = React.useState(false);

    React.useEffect(() => useTitle(configuration["content.app-name"], "Reset your password"), []);

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

    function resetPassword(event) {
        event.preventDefault();
        const code = document.getElementById("code").value;
        const password = document.getElementById("password").value;
        const urlParams = new URLSearchParams(window.location.search);
        const target = urlParams.get("target");
        setSubmitting(true);
        $.post("/user/reset-password", {
            target,
            code,
            password,
        })
            .done(function () {
                window.location = `/login${window.location.search}`;
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
        <form className="form" onSubmit={resetPassword}>
            <div className="noselect">
                <h3>
                    Reset your password
                </h3>
                <p className="app-tagline">A verification code was sent to your email address.</p>
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
            <div className="form-group mb-3 last">
                <label htmlFor="password">New Password</label>
                <input
                    type="password"
                    className="form-control"
                    aria-label="Password"
                    aria-required="true"
                    placeholder={getPlaceholder("********", configuration)}
                    minLength="8"
                    autoComplete="new-password"
                    id="password"
                    required
                />
            </div>
            <div className="page-links"></div>
            <input type="submit" disabled={submitting} className={"button" + (hasError ? " shake" : "")} value={buttonText} />
        </form>
    );
}
