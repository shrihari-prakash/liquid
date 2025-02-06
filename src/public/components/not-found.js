export default function NotFound() {
  const allowedKeys = ["message.page-not-found", "error.account-does-not-exist"];
  let messageKey = allowedKeys[0];
  const params = new URLSearchParams(window.location.search);
  if (params.has("message")) {
    messageKey = params.get("message");
  }
  if (!allowedKeys.includes(messageKey)) {
    messageKey = allowedKeys[0];
  }
  const message = i18next.t(messageKey);
  return <div>{message}</div>;
}
