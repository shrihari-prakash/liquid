import GetCode from "./get-code.js";
import Layout from "./layout.js";
import Login from "./login.js";
import NotFound from "./not-found.js";
import ResetPassword from "./reset-password.js";
import SignUp from "./signup.js";
import VerifyAccount from "./verify-account.js";

function getRenderElement() {
    let component;
    switch (window.location.pathname) {
        case "/":
        case "/login":
            return Login;
        case "/signup":
            return SignUp;
        case "/get-code":
            return GetCode;
        case "/verify-account":
            return VerifyAccount;
        case "/reset-password":
            return ResetPassword;
        default:
            return NotFound;
    }
}



const domContainer = document.querySelector("#root");
const root = ReactDOM.createRoot(domContainer);
root.render(React.createElement(Layout, {}, React.createElement(getRenderElement())));