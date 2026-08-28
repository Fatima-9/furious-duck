const { validateEmail } = require("./authValidation");

function validateNewsletterPayload(body) {
  validateEmail(body.email);

  return {
    email: body.email.trim().toLowerCase(),
  };
}

module.exports = {
  validateNewsletterPayload,
};
