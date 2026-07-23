const adminEmployeeService = require("../services/adminEmployeeService");
const {
  validateCreateEmployeePayload,
  validateUpdateEmployeePayload,
} = require("../validations/adminEmployeeValidation");

async function listEmployees(req, res) {
  const result = await adminEmployeeService.listEmployees({
    page: req.query.page,
    limit: req.query.limit,
    filters: req.query,
  });

  return res.json({
    status: "success",
    data: result,
  });
}

async function listBoutiques(req, res) {
  const boutiques = await adminEmployeeService.listActiveBoutiques();

  return res.json({
    status: "success",
    data: { boutiques },
  });
}

async function createEmployee(req, res) {
  const payload = validateCreateEmployeePayload(req.body);
  const employee = await adminEmployeeService.createEmployee(payload);

  return res.status(201).json({
    status: "success",
    data: { employee },
  });
}

async function updateEmployee(req, res) {
  const updates = validateUpdateEmployeePayload(req.body);
  const employee = await adminEmployeeService.updateEmployee(
    Number(req.params.id),
    updates
  );

  return res.json({
    status: "success",
    data: { employee },
  });
}

async function deleteEmployee(req, res) {
  const employee = await adminEmployeeService.deleteEmployee(Number(req.params.id));

  return res.json({
    status: "success",
    data: { employee },
  });
}

module.exports = {
  listBoutiques,
  listEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
};
