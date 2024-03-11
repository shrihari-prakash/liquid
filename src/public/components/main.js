import Layout from "./layout.js";

const routes = {
  ROOT: "/",
  LOGIN: "/login",
  SIGNUP: "/signup",
  GET_CODE: "/get-code",
  VERIFY_ACCOUNT: "/verify-account",
  RESET_PASSWORD: "/reset-password",
  MFA: "/2fa",
  CONSENT: "/consent",
  NOT_FOUND: "/not-found",
};

async function importRouteComponent(route) {
  return (await import(`.${route}.js`)).default;
}

async function getRenderElement() {
  switch (window.location.pathname) {
    case routes.ROOT:
    case routes.LOGIN:
      return await importRouteComponent(routes.LOGIN);
    case routes.SIGNUP:
      return await importRouteComponent(routes.SIGNUP);
    case routes.GET_CODE:
      return await importRouteComponent(routes.GET_CODE);
    case routes.VERIFY_ACCOUNT:
      return await importRouteComponent(routes.VERIFY_ACCOUNT);
    case routes.RESET_PASSWORD:
      return await importRouteComponent(routes.RESET_PASSWORD);
    case routes.MFA:
      return await importRouteComponent(routes.MFA);
    case routes.CONSENT:
      return await importRouteComponent(routes.CONSENT);
    default:
      return await importRouteComponent(routes.NOT_FOUND);
  }
}

async function main() {
  const urlParams = new URLSearchParams(window.location.search);
  let language = urlParams.get("language") || "en";
  const languageResponse = await fetch(`./languages/${language}.json`);
  const languageTranslation = await languageResponse.json();
  console.log(languageTranslation);
  i18next.init({
    lng: urlParams.get("language") || "en",
    debug: true,
    resources: {
      [language]: {
        translation: languageTranslation,
      },
    },
  });
  const domContainer = document.querySelector("#root");
  const root = ReactDOM.createRoot(domContainer);
  root.render(React.createElement(Layout, {}, React.createElement(await getRenderElement())));
}

main();
