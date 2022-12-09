$(function () {
    renderContent();
});

let config;
function getConfig() {
    return new Promise((resolve, reject) => {
        if (config) {
            resolve(config);
        }
        return $.get("/app-config.json").done(function (data) {
            config = data;
            resolve(config);
        }).fail(function () {
            reject();
        })
    })
}

async function renderContent() {
    const configuration = await getConfig();
    $(".app-name").text(configuration.content.appName)
    $(".app-tagline").text(configuration.content.appTagline)
    $(".title1").text(configuration.content.intro.title1)
    $(".title2").text(configuration.content.intro.title2)
    $(".description").text(configuration.content.intro.description)
}