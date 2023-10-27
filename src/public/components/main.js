import Layout from "./layout.js";

async function getRenderElement() {
  switch (window.location.pathname) {
    case "/":
    case "/login":
      return (await import("./login.js")).default;
    case "/signup":
      return (await import("./signup.js")).default;
    case "/get-code":
      return (await import("./get-code.js")).default;
    case "/verify-account":
      return (await import("./verify-account.js")).default;
    case "/reset-password":
      return (await import("./reset-password.js")).default;
    case "/consent":
      return (await import("./consent.js")).default;
    default:
      return (await import("./not-found.js")).default;
  }
}

async function main() {
  const domContainer = document.querySelector("#root");
  const root = ReactDOM.createRoot(domContainer);
  root.render(React.createElement(Layout, {}, React.createElement(await getRenderElement())));
}

main();
