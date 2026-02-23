/**
 * Sends a POST request.
 * By default sends form-encoded body (matching $.post behavior).
 * Pass { json: true } in options to send JSON body instead.
 *
 * @param {string} url
 * @param {object} data
 * @param {{ json?: boolean }} [options]
 * @returns {Promise<{ ok: boolean, status: number, data: object|null, error: object|null }>}
 */
export async function post(url, data = {}, options = {}) {
  const fetchOptions = {
    method: "POST",
  };

  if (options.json) {
    fetchOptions.headers = { "Content-Type": "application/json" };
    fetchOptions.body = JSON.stringify(data);
  } else {
    fetchOptions.headers = { "Content-Type": "application/x-www-form-urlencoded" };
    fetchOptions.body = new URLSearchParams(data).toString();
  }

  const response = await fetch(url, fetchOptions);
  let body = null;
  try {
    body = await response.json();
  } catch {
    // Response may not have a JSON body
  }

  if (response.ok) {
    return { ok: true, status: response.status, data: body, error: null };
  }
  return { ok: false, status: response.status, data: null, error: body };
}

/**
 * Sends a GET request with optional query parameters (matching $.get behavior).
 *
 * @param {string} url
 * @param {object} [params]
 * @returns {Promise<{ ok: boolean, status: number, data: object|null, error: object|null }>}
 */
export async function get(url, params) {
  let fullUrl = url;
  if (params && Object.keys(params).length > 0) {
    const query = new URLSearchParams(params).toString();
    fullUrl = `${url}?${query}`;
  }

  const response = await fetch(fullUrl);
  let body = null;
  try {
    body = await response.json();
  } catch {
    // Response may not have a JSON body
  }

  if (response.ok) {
    return { ok: true, status: response.status, data: body, error: null };
  }
  return { ok: false, status: response.status, data: null, error: body };
}

