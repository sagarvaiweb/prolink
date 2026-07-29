import ApiError from "../utils/ApiError.js" ;

const validateRequest = (schema) => {
    return (req, res, next) => {

        const { error } = schema.validate( req.body, { abortEarly: false });

        if (error) {
            throw new ApiError(
                400,
                "Validation failed",
                error.details.map(item => item.message)
            );
        }

        next();
    };
};

export default validateRequest;