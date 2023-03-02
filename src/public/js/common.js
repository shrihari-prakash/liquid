$(function () {
  const urlString = window.location;
  const url = new URL(urlString);
  const theme = url.searchParams.get("theme");
  if (theme === "light") {
    STORE.theme = "light";
  }
  useTheme();
  renderContent();
});

const STORE = {
  config: null,
  buttonAnimationTimeout: null,
  theme: "dark",
};

function setLightVariable(variable) {
  document.documentElement.style.setProperty(variable, `var(${variable}__light)`);
}

async function usePrimaryButton() {
  const configuration = await getConfig();
  const configTheme = configuration.theme;
  if (configTheme.usePrimaryButton) {
    const documentStyle = document.documentElement.style;
    documentStyle.setProperty("--primary-button-border-radius", configTheme.primaryButtonBorderRadius);
    $(".action-button").addClass("btn-primary");
    documentStyle.setProperty("--primary-button-text-color", configTheme.primaryButtonTextColor);
    documentStyle.setProperty("--primary-button-color", configTheme.primaryButtonColor);
    documentStyle.setProperty("--primary-button-active-color", configTheme.primaryButtonActiveColor);
    documentStyle.setProperty("--primary-button-focus-box-shadow", configTheme.primaryButtonFocusBoxShadow);
  } else {
    if (STORE.theme === "light") {
      $(".action-button").addClass("btn-light");
    } else {
      $(".action-button").addClass("btn-dark");
    }
  }
}

async function useTheme() {
  const configuration = await getConfig();
  const configTheme = configuration.theme;
  document.documentElement.style.setProperty('--form-input-border-radius', configTheme.formInputBorderRadius);
  document.documentElement.style.setProperty('--surface-border-radius', configTheme.surfaceBorderRadius);
  if (STORE.theme === "light") {
    setLightVariable("--background-color");
    setLightVariable("--text-color");
    setLightVariable("--text-lighter-color");
    setLightVariable("--border-color");
    setLightVariable("--glass-color");
  }
  usePrimaryButton();
}

function getConfig() {
  return new Promise((resolve, reject) => {
    if (STORE.config) {
      resolve(STORE.config);
    }
    return $.get("/app-config.json")
      .done(function (data) {
        STORE.config = data;
        resolve(STORE.config);
      })
      .fail(function () {
        reject();
      });
  });
}

function onSubmitError(params) {
  if (STORE.buttonAnimationTimeout) {
    clearTimeout(STORE.buttonAnimationTimeout);
  }
  const submit = document.getElementById("submit");
  submit.classList.add("shake");
  submit.value = params.errorText;
  submit.disabled = false;
  STORE.buttonAnimationTimeout = setTimeout(function () {
    submit.classList.remove("shake");
    submit.value = params.buttonText;
  }, 2000);
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
    $(".half .contents, .half .bg").css({
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
