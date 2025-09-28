import { useState, useCallback } from 'react';
import { z } from 'zod';

interface UseZodFormOptions<T> {
  schema: z.ZodSchema<T>;
  onSubmit: (data: T) => void | Promise<void>;
  initialValues?: Partial<T>;
}

interface FormState<T> {
  values: Partial<T>;
  errors: Record<string, string>;
  isSubmitting: boolean;
  isValid: boolean;
}

export function useZodForm<T>({ 
  schema, 
  onSubmit, 
  initialValues = {} 
}: UseZodFormOptions<T>) {
  const [values, setValues] = useState<Partial<T>>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [touched, setTouched] = useState<Set<string>>(new Set());

  const validateField = useCallback((name: string, value: any) => {
    try {
      const fieldSchema = schema.shape[name as keyof typeof schema.shape];
      if (fieldSchema) {
        fieldSchema.parse(value);
        setErrors(prev => {
          const next = { ...prev };
          delete next[name];
          return next;
        });
        return true;
      }
    } catch (error) {
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

  const handleChange = useCallback((name: string) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const value = event.target.value;
    setValues(prev => ({ ...prev, [name]: value }));
    
    if (touched.has(name)) {
      validateField(name, value);
    }
  }, [touched, validateField]);

  const handleBlur = useCallback((name: string) => () => {
    setTouched(prev => new Set(prev).add(name));
    const value = values[name as keyof typeof values];
    validateField(name, value);
  }, [values, validateField]);

  const handleSubmit = useCallback(async (event?: React.FormEvent) => {
    if (event) {
      event.preventDefault();
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const validatedData = schema.parse(values);
      await onSubmit(validatedData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach(err => {
          const path = err.path.join('.');
          if (!fieldErrors[path]) {
            fieldErrors[path] = err.message;
          }
        });
        setErrors(fieldErrors);
      } else {
        console.error('Form submission error:', error);
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [values, schema, onSubmit]);

  const getFieldProps = (name: string) => ({
    value: values[name as keyof typeof values] || '',
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
export const createFormSchema = <T extends z.ZodRawShape>(shape: T) => {
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