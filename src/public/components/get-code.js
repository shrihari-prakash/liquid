import { ConfigurationContext } from "../context/configuration.js";
import { getPlaceholder, useTitle } from "../utils/utils.js";

export default function GetCode() {
    const submitButtonText = "Get Code";

    const configuration = React.useContext(ConfigurationContext);

    const [buttonText, setButtonText] = React.useState(submitButtonText);
    const [hasError, setHasError] = React.useState(false);
    const [submitting, setSubmitting] = React.useState(false);

    React.useEffect(() => useTitle(configuration["content.app-name"], "Verify Your Identity"), []);

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

    function getCode(event) {
        event.preventDefault();
        const email = document.getElementById("email").value;
        setSubmitting(true);
        $.get("/user/code", {
            email,
        })
            .done(function () {
                window.location = `/reset-password${window.location.search}`;
            })
            .fail(function (response) {
                if (response.responseJSON.additionalInfo && response.status === 400) {
                    return onFieldError({ response });
                }
                onSubmitError({ errorText: "Invalid Login" });
            })
            .always(function () {
                setSubmitting(false);
            });
    }

    if (!configuration["privilege.can-reset-password"]) {
        return null;
    }

    return (
        <form className="form" onSubmit={getCode}>
            <div className="noselect">
                <h3>
                    Verify your identity
                </h3>
                <p className="app-tagline">A verification code was sent to your email address.</p>
            </div>
            <div className="form-group first last">
                <label className="noselect" htmlFor="email">Email</label>
                <input
                    type="email"
                    className="form-control"
                    aria-label="Email"
                    aria-required="true"
                    placeholder={getPlaceholder("your@email.com", configuration)}
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
                    <a href={"/login" + window.location.search} className="page-link ">
                        Login
                    </a>
                </span>
            </div>
            <input type="submit" disabled={submitting} className={"button" + (hasError ? " shake" : "")} value={buttonText} />
        </form>
    );
}
