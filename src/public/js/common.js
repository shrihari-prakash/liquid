$(function () {
  const urlString = window.location;
  const url = new URL(urlString);
  const theme = url.searchParams.get("theme");
  if (theme === "light") {
    STORE.theme = "light";
  }
  useTheme();
  renderContent();
  useFavicon();
});

const STORE = {
  config: null,
  configQueue: [],
  isConfigLoading: false,
  buttonAnimationTimeout: null,
  theme: "dark",
  autoFocusElement: null
};

function setStyleProperty(name, value) {
  document.documentElement.style.setProperty(name, value);
}

function changeToLightVariable(variable) {
  setStyleProperty(variable, `var(${variable}__light)`);
}

async function getTheme() {
  const configuration = await getConfig();
  const themeObject = configuration.theme;
  return (STORE.theme === "light") ?
    themeObject.light : themeObject.dark;
}

async function useFavicon() {
  const configuration = await getConfig();
  const favicon = configuration.images.favicon;
  if (!favicon) return;
  var link = document.querySelector("link[rel*='icon']") || document.createElement('link');
  link.type = 'image/png';
  link.rel = 'shortcut icon';
  link.href = favicon;
  document.getElementsByTagName('head')[0].appendChild(link);
}

async function usePrimaryButton() {
  const theme = await getTheme();
  if (theme.usePrimaryButton) {
    $(".action-button").addClass("btn-primary");
    setStyleProperty("--primary-button-border-radius", theme.primaryButtonBorderRadius);
    setStyleProperty("--primary-button-text-color", theme.primaryButtonTextColor);
    setStyleProperty("--primary-button-active-text-color", theme.primaryButtonActiveTextColor);
    setStyleProperty("--primary-button-color", theme.primaryButtonColor);
    setStyleProperty("--primary-button-active-color", theme.primaryButtonActiveColor);
    setStyleProperty("--primary-button-focus-box-shadow", theme.primaryButtonFocusBoxShadow);
  } else {
    if (STORE.theme === "light") {
      $(".action-button").addClass("btn-light");
    } else {
      $(".action-button").addClass("btn-dark");
    }
  }
}

async function useTheme() {
  if (STORE.theme === "light") {
    changeToLightVariable("--spinner-background-color");
    changeToLightVariable("--spinner-primary-color");
    changeToLightVariable("--spinner-secondary-color");
  }
  const theme = await getTheme();
  usePrimaryButton();
  setStyleProperty('--form-input-border-radius', theme.formInputBorderRadius);
  setStyleProperty('--form-input-padding', theme.formInputPadding);
  setStyleProperty('--surface-border-radius', theme.surfaceBorderRadius);
  setStyleProperty('--background-color', theme.backgroundColor);
  if (STORE.theme === "light") {
    changeToLightVariable("--text-color");
    changeToLightVariable("--text-lighter-color");
    changeToLightVariable("--border-color");
    changeToLightVariable("--glass-color");
  }
  if (!theme.formInputUseBorder) {
    $(".form-group").addClass("no-border");
  }
}

function getConfig() {
  return new Promise((resolve, reject) => {
    if (STORE.config) return resolve(STORE.config);
    const onDone = (data) => {
      STORE.config = data;
      resolve(STORE.config);
      $(".spinner-container").addClass("hidden");
      $("html, body").removeClass("scroll-lock");
      if (STORE.autoFocusElement && !("ontouchstart" in document.documentElement)) {
        STORE.autoFocusElement.focus();
        STORE.autoFocusElement = null;
      }
    }
    if (STORE.isConfigLoading) return STORE.configQueue.push(resolve)
    STORE.isConfigLoading = true;
    $("html, body").addClass("scroll-lock");
    return $.get("/app-config.json")
      .done((data) => {
        console.log("Configuration acquired.", data);
        onDone(data);
        console.log("Config queue size:", STORE.configQueue.length);
        STORE.configQueue.forEach((res) => res(data));
        STORE.configQueue = [];
      })
      .fail(reject)
      .always(() => STORE.isConfigLoading = false);
  });
}

function onSubmitError(params) {
  if (STORE.buttonAnimationTimeout) {
    clearTimeout(STORE.buttonAnimationTimeout);
  }
  const submit = document.getElementById("submit");
  submit.classList.add("shake");
  submit.value = params.errorText;
  STORE.buttonAnimationTimeout = setTimeout(function () {
    submit.classList.remove("shake");
    submit.value = params.buttonText;
  }, 2000);
}

function onFieldError({ response, buttonText }) {
  let errorField = response.responseJSON.additionalInfo.errors[0].param;
  errorField = errorField.charAt(0).toUpperCase() + errorField.slice(1);
  onSubmitError({ errorText: "Invalid " + errorField, buttonText });
  return;
}

function makeImage(src, alt) {
  return `<img alt="${alt}" src="${src}" />`;
}

async function renderContent() {
  const configuration = await getConfig();
  $(".app-name, .app-name-titlebar").text(configuration.content.appName);
  $(".app-tagline") && $(".app-tagline").text(configuration.content.appTagline);
  $(".title1").text(configuration.content.sidebar.intro.title1);
  $(".title2").text(configuration.content.sidebar.intro.title2);
  $(".description").text(configuration.content.sidebar.intro.description);
  if (configuration.content.sidebar.enabled === false) {
    $(".sidebar").css({
      display: "none",
      visibility: "hidden",
    });
    $(".page .contents, .page .bg").css({
      width: "100%",
    });
    return;
  }
  const sidebarSrcDark = configuration.content.sidebar.backdropImageDark;
  const sidebarSrcLight = configuration.content.sidebar.backdropImageLight;
  if (configuration.content.sidebar.contentEnabled === true) {
    $(".intro").css({
      display: "flex",
    });
  }
  const sidebarSrc = STORE.theme === "light" ? sidebarSrcLight : sidebarSrcDark;
  if (sidebarSrc) {
    $(".sidebar").css("background-image", "url(" + sidebarSrc + ")");
  }
  useImages(configuration);
}

function useImages(configuration) {
  const miniIcon = $(".app-icon-mini");
  const headerIcon = $(".app-name");
  if (STORE.theme === "light") {
    const miniIconLight = configuration.images.miniIconLight;
    const headerIconLight = configuration.images.headerIconLight;
    if (miniIconLight) miniIcon.html(makeImage(miniIconLight, "App Icon"));
    if (headerIconLight) headerIcon.html(makeImage(headerIconLight), "App Icon");
  } else if (STORE.theme === "dark") {
    const miniIconDark = configuration.images.miniIconDark;
    const headerIconDark = configuration.images.headerIconDark;
    if (miniIconDark) miniIcon.html(makeImage(miniIconDark, "App Icon"));
    if (headerIconDark) headerIcon.html(makeImage(headerIconDark, "App Icon"));
  }
}

async function useTitle(title) {
  const configuration = await getConfig();
  $(".app-name-titlebar").text(`${configuration.content.appName} - ${title}`);
}

function uuidv4() {
  return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c) =>
    (c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))).toString(16)
  );
}

function isEmail(str) {
  const regexExp =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/gi;
  return regexExp.test(str);
}