$(function () {
    renderContent();
});

const STORE = {
    config: null,
    buttonAnimationTimeout: null
};

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
    STORE.buttonAnimationTimeout = setTimeout(function () {
        submit.classList.remove("shake");
        submit.value = params.buttonText;
        submit.disabled = false;
    }, 2000);
}

async function renderContent() {
    const configuration = await getConfig();
    $(".app-name").text(configuration.content.appName)
    $(".app-tagline").text(configuration.content.appTagline)
    $(".title1").text(configuration.content.intro.title1)
    $(".title2").text(configuration.content.intro.title2)
    $(".description").text(configuration.content.intro.description)
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