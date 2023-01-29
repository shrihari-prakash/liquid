$(function () {
    useTheme();
    renderContent();
});

const STORE = {
    config: null,
    buttonAnimationTimeout: null,
    theme: "dark"
};

async function useTheme() {
    const urlString = window.location;
    const url = new URL(urlString);
    const theme = url.searchParams.get("theme");
    if (theme === "light") {
        STORE.theme = "light";
        document.documentElement.style.setProperty("--background-color", "var(--background-color__light)");
        document.documentElement.style.setProperty("--text-color", "var(--text-color__light");
        document.documentElement.style.setProperty("--text-lighter-color", "var(--text-lighter-color__light)");
        document.documentElement.style.setProperty("--border-color", "var(--border-color__light)");
        document.documentElement.style.setProperty("--glass-color", "var(--glass-color__light)");
    }
    const configuration = await getConfig();
    if (configuration.theme.usePrimaryButton) {
        $(".action-button").addClass("btn-primary");
        document.documentElement.style.setProperty("--primary-button-text-color", configuration.theme.primaryButtonTextColor);
        document.documentElement.style.setProperty("--primary-button-color", configuration.theme.primaryButtonColor);
        document.documentElement.style.setProperty("--primary-button-active-color", configuration.theme.primaryButtonActiveColor);
        document.documentElement.style.setProperty("--primary-button-focus-box-shadow", configuration.theme.primaryButtonFocusBoxShadow);
    } else {
        if (theme === "light") {
            $(".action-button").addClass("btn-light");
        } else {
            $(".action-button").addClass("btn-dark");
        }
    }
}

function getConfig() {
    return new Promise((resolve, reject) => {
        if (STORE.config) {
            resolve(STORE.config);
        }
        return $.get("/app-config.json").done(function (data) {
            STORE.config = data;
            resolve(STORE.config);
        }).fail(function () {
            reject();
        })
    })
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

async function renderContent() {
    const configuration = await getConfig();
    $(".app-name").text(configuration.content.appName);
    $(".app-tagline") && $(".app-tagline").text(configuration.content.appTagline);
    $(".title1").text(configuration.content.sidebar.intro.title1);
    $(".title2").text(configuration.content.sidebar.intro.title2);
    $(".description").text(configuration.content.sidebar.intro.description);
    if (configuration.content.sidebar.enabled === false) {
        $(".sidebar").css({
            display: "none",
            visibility: "hidden"
        });
        $(".half .contents, .half .bg").css({
            width: "100%"
        });
        return;
    }
    const sidebarSrcDark = configuration.content.sidebar.backdropImageDark;
    const sidebarSrcLight = configuration.content.sidebar.backdropImageLight;
    if (configuration.content.sidebar.contentEnabled === true) {
        $(".intro").css({
            display: "flex"
        });
    }
    const sidebarSrc = STORE.theme === "light" ? sidebarSrcLight : sidebarSrcDark;
    if (sidebarSrc) {
        $(".sidebar").css('background-image', 'url(' + sidebarSrc + ')');
    }
}

function uuidv4() {
    return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
}

function isEmail(str) {
    const regexExp = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/gi;
    return regexExp.test(str);
}