import { ConfigurationContext } from "../context/configuration.js";
import { ThemeContext } from "../context/theme.js";
import { useFont, useFavicon, changeToLightVariable, setStyleProperty, getTheme } from "../utils/utils.js";

export default function Layout({ children }) {
  const [configuration, setConfiguration] = React.useState();
  const [fontLoading, setFontLoading] = React.useState(true);
  const [miniIconLoaded, setMiniIconLoaded] = React.useState(false);

  const theme = getTheme();

  function getThemeVariable(variable) {
    return configuration[`theme.${theme}.${variable}`];
  }

  React.useEffect(() => {
    const allOptions = fetch("./configuration/options.json");
    const appConfig = fetch("/app-config.json");
    Promise.all([allOptions, appConfig]).then(async (results) => {
      const [optionsResponse, confResponse] = results;
      const options = await optionsResponse.json();
      const conf = await confResponse.json();
      console.log(Object.keys(options).length + " options loaded.", options);
      console.log(Object.keys(conf).length + " options configured.", conf);
      options.forEach((option) => {
        if (typeof conf[option.name] === "undefined") {
          conf[option.name] = option.default;
        }
      });
      console.log("Full configuration:", conf);
      setConfiguration(conf);
    });
  }, []);

  React.useEffect(() => {
    if (!configuration) {
      return;
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
            {configuration["content.sidebar.enabled"] && (
              <div className="sidebar" style={{ backgroundImage: `url(${sidebarImage})` }}>
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
