const ApiError = require("../utils/apiError");

async function fetchJson(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new ApiError(401, "invalid oauth token");
  }

  return response.json();
}

function requireEmail(email) {
  if (!email) {
    throw new ApiError(400, "oauth account email is required");
  }

  return email.trim().toLowerCase();
}

function splitName(profile) {
  const nameParts = String(profile.name || "").trim().split(/\s+/).filter(Boolean);

  return {
    nom:
      profile.family_name ||
      profile.last_name ||
      nameParts.slice(1).join(" ") ||
      "Utilisateur",
    prenom: profile.given_name || profile.first_name || nameParts[0] || "OAuth",
  };
}

async function verifyGoogleToken(token) {
  const params = new URLSearchParams({ id_token: token });
  const profile = await fetchJson(
    `https://oauth2.googleapis.com/tokeninfo?${params.toString()}`
  );

  if (
    process.env.GOOGLE_CLIENT_ID &&
    profile.aud !== process.env.GOOGLE_CLIENT_ID
  ) {
    throw new ApiError(401, "invalid oauth audience");
  }

  if (profile.email_verified !== true && profile.email_verified !== "true") {
    throw new ApiError(401, "oauth email is not verified");
  }

  const name = splitName(profile);

  return {
    subject: profile.sub,
    email: requireEmail(profile.email),
    nom: name.nom,
    prenom: name.prenom,
  };
}

async function verifyFacebookToken(token) {
  const params = new URLSearchParams({
    fields: "id,email,first_name,last_name,name",
    access_token: token,
  });
  const profile = await fetchJson(`https://graph.facebook.com/me?${params.toString()}`);
  const name = splitName(profile);

  return {
    subject: profile.id,
    email: requireEmail(profile.email),
    nom: name.nom,
    prenom: name.prenom,
  };
}

async function verifyOAuthToken(provider, token) {
  if (provider === "google") {
    return verifyGoogleToken(token);
  }

  if (provider === "facebook") {
    return verifyFacebookToken(token);
  }

  throw new ApiError(400, "provider must be google or facebook");
}

module.exports = {
  verifyOAuthToken,
  verifyGoogleToken,
  verifyFacebookToken,
};
