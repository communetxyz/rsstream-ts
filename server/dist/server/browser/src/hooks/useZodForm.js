import { useState, useCallback } from 'react';
import { z } from 'zod';
export function useZodForm({ schema, onSubmit, initialValues = {} }) {
    const [values, setValues] = useState(initialValues);
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [touched, setTouched] = useState(new Set());
    const validateField = useCallback((name, value) => {
        try {
            const fieldSchema = schema.shape[name];
            if (fieldSchema) {
                fieldSchema.parse(value);
                setErrors(prev => {
                    const next = { ...prev };
                    delete next[name];
                    return next;
                });
                return true;
            }
        }
        catch (error) {
            if (error instanceof z.ZodError) {
                setErrors(prev => ({
                    ...prev,
                    [name]: error.errors[0]?.message || 'Invalid value'
                }));
                return false;
            }
        }
        return true;
    }, [schema]);
    const handleChange = useCallback((name) => (event) => {
        const value = event.target.value;
        setValues(prev => ({ ...prev, [name]: value }));
        if (touched.has(name)) {
            validateField(name, value);
        }
    }, [touched, validateField]);
    const handleBlur = useCallback((name) => () => {
        setTouched(prev => new Set(prev).add(name));
        const value = values[name];
        validateField(name, value);
    }, [values, validateField]);
    const handleSubmit = useCallback(async (event) => {
        if (event) {
            event.preventDefault();
        }
        setIsSubmitting(true);
        setErrors({});
        try {
            const validatedData = schema.parse(values);
            await onSubmit(validatedData);
        }
        catch (error) {
            if (error instanceof z.ZodError) {
                const fieldErrors = {};
                error.errors.forEach(err => {
                    const path = err.path.join('.');
                    if (!fieldErrors[path]) {
                        fieldErrors[path] = err.message;
                    }
                });
                setErrors(fieldErrors);
            }
            else {
                console.error('Form submission error:', error);
            }
        }
        finally {
            setIsSubmitting(false);
        }
    }, [values, schema, onSubmit]);
    const getFieldProps = (name) => ({
        value: values[name] || '',
        onChange: handleChange(name),
        onBlur: handleBlur(name),
        error: !!errors[name],
        helperText: errors[name],
    });
    const isValid = Object.keys(errors).length === 0;
    const reset = useCallback(() => {
        setValues(initialValues);
        setErrors({});
        setTouched(new Set());
        setIsSubmitting(false);
    }, [initialValues]);
    return {
        values,
        errors,
        isSubmitting,
        isValid,
        handleSubmit,
        handleChange,
        handleBlur,
        getFieldProps,
        reset,
        setValues,
        setErrors,
    };
}
// Helper function to create form schemas with common validations
export const createFormSchema = (shape) => {
    return z.object(shape);
};
// Common field schemas for reuse
export const commonSchemas = {
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    username: z.string()
        .min(3, 'Username must be at least 3 characters')
        .regex(/^\w+$/, 'Username can only contain letters, numbers, and underscores'),
    inviteCode: z.string().min(1, 'Invite code is required'),
    url: z.string().url('Invalid URL'),
};
//# sourceMappingURL=useZodForm.js.map