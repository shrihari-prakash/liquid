import { ConfigurationContext } from "../context/configuration.js";
import { ThemeContext } from "../context/theme.js";
import { useFont, useFavicon, changeToLightVariable, setStyleProperty } from "../utils/utils.js";

export default function Layout({ children }) {
  const [configuration, setConfiguration] = React.useState();
  const [fontLoading, setFontLoading] = React.useState(true);

  const urlString = window.location;
  const url = new URL(urlString);
  const theme = url.searchParams.get("theme") || "dark";

  function getThemeVariable(variable) {
    return configuration[`theme.${theme}.${variable}`];
  }

  React.useEffect(() => {
    $.get("/app-config.json").done((data) => {
      console.log("Configuration retrieved.", data);
      console.log(Object.keys(data).length + " options loaded.");
      setConfiguration(data);
    });
  }, []);

  React.useEffect(() => {
    if (!configuration && theme === "light") {
      changeToLightVariable("--spinner-background-color");
      changeToLightVariable("--spinner-primary-color");
      changeToLightVariable("--spinner-secondary-color");
      return;
    }

    const usePrimaryButton = () => {
      const props = ["border-radius", "text-color", "active-text-color", "color", "active-color", "focus-box-shadow"];
      props.forEach((prop) => {
        setStyleProperty(`--primary-button-${prop}`, getThemeVariable(`primary-button.${prop}`));
      });
    };

    const useTheme = () => {
      usePrimaryButton();
      setStyleProperty("--background-color", getThemeVariable("background-color"));
      setStyleProperty("--form-input-border-radius", getThemeVariable("form.input-border-radius"));
      setStyleProperty("--form-input-padding", getThemeVariable("form.input-padding"));
      if (theme === "light") {
        changeToLightVariable("--text-color");
        changeToLightVariable("--text-lighter-color");
        changeToLightVariable("--border-color");
        changeToLightVariable("--glass-color");
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
              <img src={configuration[`assets.mini-icon-${theme}`]} alt={configuration[`content.app-name`]} />
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
