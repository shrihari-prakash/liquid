import { ConfigurationContext } from "../context/configuration.js";
import { prepareAuthorizationParams, getPlaceholder, useTitle } from "../utils/utils.js";

export default function ConsentScreen() {
  const submitButtonText = "Consent";

  const configuration = React.useContext(ConfigurationContext);

  const [clientInfo, setClientInfo] = React.useState(false);
  const [permissionsInfo, setPermissionsInfo] = React.useState(false);
  const [requiredScopes, setRequiredScopes] = React.useState([]);

  React.useEffect(() => {
    (async () => {
      const authParams = prepareAuthorizationParams(configuration);
      const clientInformation = await $.get("/user/client-info?id=" + authParams.client_id);
      const permissionsInformation = await $.get("/user/scopes");
      setClientInfo(clientInformation.data.client);
      setRequiredScopes(authParams.scope.split(","));
      setPermissionsInfo(permissionsInformation.data.scopes);
      console.log(clientInformation.data, permissionsInformation.data);
    })();
  }, []);

  const onConsent = () => {
    const authParams = prepareAuthorizationParams(configuration);
    const params = new URLSearchParams(authParams);
    window.location = `/oauth/authorize?${params.toString()}`;
  };

  const onDeny = () => {
    const authParams = prepareAuthorizationParams(configuration);
    window.location = authParams.redirect_uri;
  };

  React.useEffect(() => useTitle(configuration["content.app-name"], "Provide Your Consent"), []);

  return clientInfo && permissionsInfo ? (
    <div className="form">
      <div className="noselect">
        <h3>Provide Your Consent</h3>
        <div className="consent-form">
          <p>
            {clientInfo.displayName} wants access your account. If you consent to this, {clientInfo.displayName} will be
            able to:
          </p>
          <ul className="scope-container">
            {requiredScopes.map((scope) => (
              <li className="scope-item" key={scope}>
                <div className="circle">
                  <div className="checkmark"></div>
                </div>
                <div className="scope-item-desc">{permissionsInfo[scope].description}</div>
              </li>
            ))}
          </ul>
          <p className="fineprint">
            Before you consent, make sure you trust this application as you might be sharing sensitive information.
          </p>
        </div>
      </div>
      <div className="page-links"></div>
      <div className="multi-action">
        <input
          disabled={!clientInfo || !permissionsInfo}
          type="button"
          onClick={onConsent}
          className="button"
          value={submitButtonText}
        />
        <input type="button" onClick={onDeny} className="button outline" value="Deny" />
      </div>
    </div>
  ) : (
    <div className="consent-loader">
      <div className="spinner"></div>
      Loading Consent...
    </div>
  );
}

