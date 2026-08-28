const { subscribeToNewsletter } = require("../services/newsletterService");
const { validateNewsletterPayload } = require("../validations/newsletterValidation");

async function subscribe(req, res) {
  const payload = validateNewsletterPayload(req.body);
  const result = await subscribeToNewsletter(payload);

  return res.status(202).json({
    status: "success",
    data: result,
  });
}

module.exports = {
  subscribe,
};
