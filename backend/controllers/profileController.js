const profileService = require("../services/profileService");
const {
  validateUpdateProfilePayload,
  validateChangePasswordPayload,
} = require("../validations/profileValidation");

async function getMyProfile(req, res) {
  const user = await profileService.getProfile(req.user.id_user);

  return res.json({
    status: "success",
    data: { user },
  });
}

async function updateMyProfile(req, res) {
  const updates = validateUpdateProfilePayload(req.body);
  const user = await profileService.updateProfile(req.user.id_user, updates);

  return res.json({
    status: "success",
    data: { user },
  });
}

async function changeMyPassword(req, res) {
  const payload = validateChangePasswordPayload(req.body);
  await profileService.changePassword(req.user.id_user, payload);

  return res.json({
    status: "success",
    message: "password has been updated",
  });
}

module.exports = {
  getMyProfile,
  updateMyProfile,
  changeMyPassword,
};
