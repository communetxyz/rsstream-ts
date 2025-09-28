import { z } from 'zod';
/**
 * Express middleware for validating request body against a Zod schema
 */
export const validateBody = (schema) => {
    return (req, res, next) => {
        try {
            const result = schema.parse(req.body);
            req.body = result; // Replace with validated and transformed data
            next();
        }
        catch (error) {
            if (error instanceof z.ZodError) {
                const messages = error.errors.map(e => {
                    const path = e.path.length > 0 ? `${e.path.join('.')}: ` : '';
                    return `${path}${e.message}`;
                }).join(', ');
                res.status(400).json({
                    error: 'Validation failed',
                    details: messages,
                    errors: error.errors
                });
            }
            else {
                res.status(400).json({
                    error: 'Invalid request data'
                });
            }
        }
    };
};
/**
 * Express middleware for validating request query parameters against a Zod schema
 */
export const validateQuery = (schema) => {
    return (req, res, next) => {
        try {
            const result = schema.parse(req.query);
            req.query = result; // Replace with validated and transformed data
            next();
        }
        catch (error) {
            if (error instanceof z.ZodError) {
                const messages = error.errors.map(e => {
                    const path = e.path.length > 0 ? `${e.path.join('.')}: ` : '';
                    return `${path}${e.message}`;
                }).join(', ');
                res.status(400).json({
                    error: 'Validation failed',
                    details: messages,
                    errors: error.errors
                });
            }
            else {
                res.status(400).json({
                    error: 'Invalid query parameters'
                });
            }
        }
    };
};
/**
 * Express middleware for validating request params against a Zod schema
 */
export const validateParams = (schema) => {
    return (req, res, next) => {
        try {
            const result = schema.parse(req.params);
            req.params = result; // Replace with validated and transformed data
            next();
        }
        catch (error) {
            if (error instanceof z.ZodError) {
                const messages = error.errors.map(e => {
                    const path = e.path.length > 0 ? `${e.path.join('.')}: ` : '';
                    return `${path}${e.message}`;
                }).join(', ');
                res.status(400).json({
                    error: 'Validation failed',
                    details: messages,
                    errors: error.errors
                });
            }
            else {
                res.status(400).json({
                    error: 'Invalid parameters'
                });
            }
        }
    };
};
//# sourceMappingURL=validation.js.map