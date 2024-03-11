import { ConfigurationContext } from "../context/configuration.js";
import { ThemeContext } from "../context/theme.js";
import { prepareAuthorizationParams, getPlaceholder, useTitle } from "../utils/utils.js";

export default function ConsentScreen() {
  const configuration = React.useContext(ConfigurationContext);
  const theme = React.useContext(ThemeContext);

  const [miniIconLoaded, setMiniIconLoaded] = React.useState(false);
  const [clientInfo, setClientInfo] = React.useState(false);
  const [permissionsInfo, setPermissionsInfo] = React.useState(false);
  const [requiredScopes, setRequiredScopes] = React.useState([]);

  const submitButtonText = i18next.t("button.consent");
  const appName = configuration["content.app-name"];
  const authParams = prepareAuthorizationParams(configuration);

  React.useEffect(() => {
    (async () => {
      const clientInformation = await $.get(`/client/${authParams.client_id}`);
      const permissionsInformation = await $.get("/user/scopes");
      setClientInfo(clientInformation.data.client);
      setRequiredScopes(authParams.scope.split(","));
      setPermissionsInfo(permissionsInformation.data.scopes);
      console.log(clientInformation.data, permissionsInformation.data);
    })();
  }, []);

  const onConsent = () => {
    const params = new URLSearchParams(authParams);
    window.location = `/oauth/authorize?${params.toString()}`;
  };

  const onDeny = () => {
    const redirectUri = new URL(authParams.redirect_uri);
    redirectUri.searchParams.append('error', 'access_denied');
    redirectUri.searchParams.append('error_description', 'Access was denied by the user');
    redirectUri.searchParams.append('state', authParams.state);
    window.location = redirectUri;
  };

  React.useEffect(() => useTitle(configuration["content.app-name"], i18next.t("title.consent")), []);

  return clientInfo && permissionsInfo ? (
    <div className={`form ${configuration["form.animate-entrance"] && "animate-jelly"}`}>
      <div className="noselect">
        <h3 className="long-header">
          {i18next.t("heading.consent")}<span className="header-separator">&nbsp;&#x2022;&nbsp;</span>
          {configuration[`assets.header-icon-${theme}`] ? (
            <div className="app-icon-header">
              <div style={{ display: miniIconLoaded ? "none" : "block" }} className="spinner" />
              <img
                style={{ display: miniIconLoaded ? "block" : "none" }}
                onLoad={() => setMiniIconLoaded(true)}
                alt={appName}
                src={configuration[`assets.header-icon-${theme}`]}
              />
            </div>
          ) : (
            <strong className="app-name">{appName}</strong>
          )}
        </h3>
        <div className="consent-form">
          <p>
            {i18next.t("message.consent", { app_name: clientInfo.displayName })}
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
            {i18next.t("message.consent-warning")}
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
        <input type="button" onClick={onDeny} className="button outline" value={i18next.t("button.refuse")} />
      </div>
    </div>
  ) : (
    <div className="form-loader">
      <div className="spinner"></div>
      Loading Consent...
    </div>
  );
}

