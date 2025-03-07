const Joi = require('joi');

// Validator for service request creation and updates
exports.validateServiceRequest = (data, isUpdate = false) => {
  const schema = Joi.object({
    title: isUpdate ? Joi.string().trim() : Joi.string().trim().required(),
    description: isUpdate ? Joi.string().trim() : Joi.string().trim().required(),
    requestType: Joi.string().valid('maintenance', 'repair', 'installation', 'inspection', 'other'),
    priority: Joi.string().valid('low', 'medium', 'high', 'urgent'),
    status: Joi.string().valid('new', 'assigned', 'in_progress', 'on_hold', 'completed', 'cancelled'),
    customer: isUpdate ? Joi.string().optional() : Joi.string().required(),
    project: Joi.string().allow('', null),
    assignedTechnician: Joi.string().allow('', null),
    scheduledDate: Joi.date().iso().allow(null),
    completionDate: Joi.date().iso().allow(null),
    notes: Joi.array().items(
      Joi.object({
        text: Joi.string().required(),
        createdBy: Joi.string(),
        createdAt: Joi.date()
      })
    )
  });

  return schema.validate(data);
};