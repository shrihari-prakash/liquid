import { ConfigurationContext } from "../context/configuration.js";
import { getPlaceholder, useTitle } from "../utils/utils.js";

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
        }, 2000);
    };

    function resetPassword(event) {
        event.preventDefault();
        const code = document.getElementById("code").value;
        const password = document.getElementById("password").value;
        setSubmitting(true);
        $.post("/user/reset-password", {
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
            <div class="form-group first">
                <label for="code">Verification Code</label>
                <input
                    type="text"
                    class="form-control"
                    aria-label="Verification Code"
                    aria-required="true"
                    placeholder={getPlaceholder("Verification code", configuration)}
                    minLength="8"
                    autoComplete="off"
                    id="code"
                    required
                />
            </div>
            <div class="form-group mb-3 last">
                <label for="password">New Password</label>
                <input
                    type="password"
                    class="form-control"
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
