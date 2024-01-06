import { ConfigurationContext } from "../context/configuration.js";
import { ThemeContext } from "../context/theme.js";
import { useFont, useFavicon, changeToLightVariable, setStyleProperty, getTheme } from "../utils/utils.js";

const narrowScreenMedia = window.matchMedia("(max-width: 1199.99px)");

export default function Layout({ children }) {
  const [configuration, setConfiguration] = React.useState();
  const [fontLoading, setFontLoading] = React.useState(true);
  const [miniIconLoaded, setMiniIconLoaded] = React.useState(false);
  const [showSidebar, setShowSidebar] = React.useState(!narrowScreenMedia.matches);

  const theme = getTheme();

  function getThemeVariable(variable) {
    return configuration[`theme.${theme}.${variable}`];
  }

  React.useEffect(() => {
    function onNarrowMediaChange(e) {
      setShowSidebar(!e.matches);
    }
    narrowScreenMedia.addEventListener('change', onNarrowMediaChange)
    return function cleanup() {
      narrowScreenMedia.removeEventListener('change', onNarrowMediaChange)
    }
  }, []);

  React.useEffect(() => {
    const metadataPromise = fetch("./configuration/options.json");
    const frontendConfigPromise = fetch("/app-config.json");
    const backendConfigPromise = fetch("/system/settings-insecure");
    const startTime = +new Date();
    Promise.all([metadataPromise, frontendConfigPromise, backendConfigPromise]).then(async (results) => {
      const [metadataResponse, frontendConfigResponse, backendConfigResponse] = results;
      const metadata = await metadataResponse.json();
      const frontendConfig = await frontendConfigResponse.json();
      const backendConfig = (await backendConfigResponse.json()).data.settings;
      console.log(Object.keys(metadata).length + " options loaded.");
      console.log(Object.keys(frontendConfig).length + " options configured.", frontendConfig);
      console.log(Object.keys(backendConfig).length + " settings loaded.", backendConfig);
      for (const option in backendConfig) {
        if (!(option in frontendConfig)) {
          console.log(option + " set from backend settings.");
          frontendConfig[option] = backendConfig[option];
        }
      }
      metadata.forEach((option) => {
        if (!(option.name in frontendConfig)) {
          frontendConfig[option.name] = option.default;
        }
      });
      console.log("Full configuration:", frontendConfig);
      setConfiguration(frontendConfig);
      console.log("Static page loaded in " + (+new Date() - startTime) + "ms");
    });
  }, []);

  React.useEffect(() => {
    if (!configuration) {
      return () => { };
    }

    const usePrimaryButton = () => {
      const props = [
        "border-radius",
        "text-color",
        "active-text-color",
        "color",
        "active-color",
        "focus-box-shadow",
        "height",
        "error-color",
        "error-text-color",
      ];
      props.forEach((prop) => {
        setStyleProperty(`--primary-button-${prop}`, getThemeVariable(`primary-button.${prop}`));
      });
    };

    const useTheme = () => {
      usePrimaryButton();
      setStyleProperty("--background-color", getThemeVariable("background-color"));
      setStyleProperty("--form-input-border-radius", getThemeVariable("form.input-border-radius"));
      setStyleProperty("--form-input-padding", getThemeVariable("form.input-padding"));
      setStyleProperty("--form-input-vertical-padding", getThemeVariable("form.input-vertical-padding"));
      setStyleProperty("--form-input-horizontal-padding", getThemeVariable("form.input-horizontal-padding"));
      setStyleProperty("--app-font-base-size", configuration["theme.app-font-base-size"]);
      if (theme === "light") {
        changeToLightVariable("--text-color");
        changeToLightVariable("--text-lighter-color");
        changeToLightVariable("--form-input-border-color");
        changeToLightVariable("--glass-color");
      }
      if (!getThemeVariable("form.input-use-border")) {
        setStyleProperty("--form-input-border-color", "transparant");
      } else {
        setStyleProperty("--form-input-border-color", getThemeVariable("form.input-border-color"));
      }
    };

    const finishFontLoad = () => setFontLoading(false);

    useTheme();
    useFont(configuration["theme.app-font-face"], configuration["theme.app-font-url"], finishFontLoad);
    useFavicon(configuration["assets.favicon-uri"]);
  }, [configuration]);

  React.useEffect(() => {
    if (configuration && !fontLoading) {
      if (configuration["form.animate-entrance"]) {
        setTimeout(() => {
          document.querySelector('.form').style.willChange = "auto";
        }, 2000)
      }
    }
  }, [configuration, fontLoading]);

  if (!configuration || fontLoading)
    return (
      <div className="spinner-container">
        <div className="spinner"></div>
      </div>
    );

  const sidebarImage = configuration[`assets.sidebar.backdrop-image-${theme}`];

  return (
    <ConfigurationContext.Provider value={configuration}>
      <ThemeContext.Provider value={theme}>
        <div className="layout">
          {configuration[`assets.mini-icon-${theme}`] && (
            <div className="app-icon-mini">
              <div className="icon">
                <div style={{ display: miniIconLoaded ? "none" : "block" }} className="spinner"></div>
                <img
                  style={{ display: miniIconLoaded ? "block" : "none" }}
                  onLoad={() => setMiniIconLoaded(true)}
                  src={configuration[`assets.mini-icon-${theme}`]}
                  alt={configuration[`content.app-name`]}
                />
              </div>
            </div>
          )}
          <div className="page">
            <div className="content-wrapper">
              <div className="content">{children}</div>
            </div>
            {configuration["content.sidebar.enabled"] && showSidebar && (
              <div className="sidebar" style={{ backgroundImage: `url(${sidebarImage})` }}>
                {configuration["system.demo-mode"] &&
                  <div class="ribbon">
                    Demo Mode
                  </div>
                }
                {configuration["content.sidebar.content-enabled"] && (
                  <div className="intro">
                    <div className="title1">{configuration["content.sidebar.intro.title1"]}</div>
                    <div className="title2">{configuration["content.sidebar.intro.title2"]}</div>
                    <div className="description">{configuration["content.sidebar.intro.description"]}</div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </ThemeContext.Provider>
    </ConfigurationContext.Provider>
  );
}
