const ApiError = require("../utils/apiError");

const TURNSTILE_VERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

async function verifyTurnstileToken(token, remoteIp) {
  if (process.env.NODE_ENV === "test") {
    return true;
  }

  if (!process.env.TURNSTILE_SECRET_KEY) {
    throw new ApiError(500, "TURNSTILE_SECRET_KEY is not configured");
  }

  if (!token) {
    throw new ApiError(400, "Verification captcha requise.");
  }

  const formData = new URLSearchParams();
  formData.append("secret", process.env.TURNSTILE_SECRET_KEY);
  formData.append("response", token);

  if (remoteIp) {
    formData.append("remoteip", remoteIp);
  }

  const response = await fetch(TURNSTILE_VERIFY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: formData,
  });

  if (!response.ok) {
    throw new ApiError(502, "Impossible de verifier le captcha.");
  }

  const result = await response.json();

  if (!result.success) {
    throw new ApiError(400, "Captcha invalide ou expire.");
  }

  return true;
}

module.exports = {
  verifyTurnstileToken,
};
