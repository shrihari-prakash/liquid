import { ConfigurationContext } from "../context/configuration.js";
import { getPlaceholder, useTitle } from "../utils/utils.js";

export default function VerifyAccount() {
    const submitButtonText = "Verify";

    const configuration = React.useContext(ConfigurationContext);

    const [buttonText, setButtonText] = React.useState(submitButtonText);
    const [hasError, setHasError] = React.useState(false);
    const [submitting, setSubmitting] = React.useState(false);

    React.useEffect(() => useTitle(configuration["content.app-name"], "Verify Your Account"), []);

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

    function verifyAccount(event) {
        event.preventDefault();
        const code = document.getElementById("code").value;
        setSubmitting(true);
        $.get("/user/verify-email", {
            code,
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
        <form className="form" onSubmit={verifyAccount}>
            <div className="noselect">
                <h3>
                    Verify your account
                </h3>
                <p className="app-tagline">A verification code was sent to your email address.</p>
            </div>
            <div className="form-group first last">
                <label className="noselect" htmlFor="username">Verification Code</label>
                <input
                    type="text"
                    className="form-control"
                    placeholder={getPlaceholder("Your Verification Code", configuration)}
                    minLength="4"
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck="false"
                    id="code"
                    required
                />
            </div>
            <div className="page-links"></div>
            <input type="submit" disabled={submitting} className={"button" + (hasError ? " shake" : "")} value={buttonText} />
        </form>
    );
}
