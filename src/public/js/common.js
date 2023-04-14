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

function getConfiguration() {
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
        console.log("Configuration retrieved.", data);
        console.log(Object.keys(data).length + " options loaded.");
        onDone(data);
        console.log(STORE.configQueue.length + " callbacks in queue.");
        STORE.configQueue.forEach((res) => res(data));
        STORE.configQueue = [];
      })
      .fail(reject)
      .always(() => STORE.isConfigLoading = false);
  });
}

async function getOption(name) {
  const configuration = await getConfiguration();
  return configuration[name];
}

async function getThemeProp(variable) {
  const prefix = (STORE.theme === "light") ?
    "theme.light." : "theme.dark.";
  return getOption(`${prefix}${variable}`);
}

async function useFavicon() {
  const favicon = await getOption("assets.favicon-uri");
  if (!favicon) return;
  var link = document.querySelector("link[rel*='icon']") || document.createElement('link');
  link.type = 'image/png';
  link.rel = 'shortcut icon';
  link.href = favicon;
  document.getElementsByTagName('head')[0].appendChild(link);
}

async function usePrimaryButton() {
  if (getThemeProp("use-primary-button")) {
    $(".action-button").addClass("btn-primary");
    const props = ["border-radius", "text-color", "active-text-color", "color", "active-color", "focus-box-shadow"];
    props.forEach(async prop => setStyleProperty(`--primary-button-${prop}`, await getThemeProp(`primary-button.${prop}`)));
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
  usePrimaryButton();
  setStyleProperty('--background-color', await getThemeProp("background-color"));
  setStyleProperty('--form-input-border-radius', await getThemeProp("form.input-border-radius"));
  setStyleProperty('--form-input-padding', await getThemeProp("form.input-padding"));
  if (STORE.theme === "light") {
    changeToLightVariable("--text-color");
    changeToLightVariable("--text-lighter-color");
    changeToLightVariable("--border-color");
    changeToLightVariable("--glass-color");
  }
  if (!await getThemeProp("form.input-use-border")) {
    $(".form-group").addClass("no-border");
  }
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
  $(".app-name, .app-name-titlebar").text(await getOption("content.app-name"));
  $(".app-tagline") && $(".app-tagline").text(await getOption("content.app-tagline"));
  $(".title1").text(await getOption("content.sidebar.intro.title1"));
  $(".title2").text(await getOption("content.sidebar.intro.title2"));
  $(".description").text(await getOption("content.sidebar.intro.description"));
  if (await getOption("content.sidebar.enabled") === false) {
    $(".sidebar").css({
      display: "none",
      visibility: "hidden",
    });
    $(".page .contents, .page .bg").css({
      width: "100%",
    });
    return;
  }
  const sidebarSrcDark = await getOption("assets.sidebar.backdrop-image-dark");
  const sidebarSrcLight = await getOption("assets.sidebar.backdrop-image-light");
  if (await getOption("content.sidebar.content-enabled") === true) {
    $(".intro").css({
      display: "flex",
    });
  }
  const sidebarSrc = STORE.theme === "light" ? sidebarSrcLight : sidebarSrcDark;
  if (sidebarSrc) {
    $(".sidebar").css("background-image", "url(" + sidebarSrc + ")");
  }
  useImages();
}

async function useImages() {
  const miniIcon = $(".app-icon-mini");
  const headerIcon = $(".app-name");
  if (STORE.theme === "light") {
    const miniIconLight = await getOption("assets.mini-icon-light");
    const headerIconLight = await getOption("assets.header-icon-light");
    if (miniIconLight) miniIcon.html(makeImage(miniIconLight, "App Icon"));
    if (headerIconLight) headerIcon.html(makeImage(headerIconLight), "App Icon");
  } else if (STORE.theme === "dark") {
    const miniIconDark = await getOption("assets.mini-icon-dark");
    const headerIconDark = await getOption("assets.header-icon-dark");
    if (miniIconDark) miniIcon.html(makeImage(miniIconDark, "App Icon"));
    if (headerIconDark) headerIcon.html(makeImage(headerIconDark, "App Icon"));
  }
}

async function useTitle(title) {
  $(".app-name-titlebar").text(`${await getOption("content.app-name")} - ${title}`);
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
