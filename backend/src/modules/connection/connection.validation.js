import Joi from "joi";

const objectId = Joi.string().hex().length(24).required().messages({
    "string.hex": "ID must be a valid ObjectId",
    "string.length": "ID must be a valid ObjectId",
  });

export const sendConnectionRequestSchema = Joi.object({
  recipientId: objectId,
});

export const connectionIdParamsSchema = Joi.object({
  connectionId: objectId,
});
