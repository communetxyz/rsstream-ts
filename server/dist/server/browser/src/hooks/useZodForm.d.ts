import { z } from 'zod';
interface UseZodFormOptions<T> {
    schema: z.ZodSchema<T>;
    onSubmit: (data: T) => void | Promise<void>;
    initialValues?: Partial<T>;
}
export declare function useZodForm<T>({ schema, onSubmit, initialValues }: UseZodFormOptions<T>): {
    values: Partial<T>;
    errors: Record<string, string>;
    isSubmitting: boolean;
    isValid: boolean;
    handleSubmit: (event?: React.FormEvent) => Promise<void>;
    handleChange: (name: string) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    handleBlur: (name: string) => () => void;
    getFieldProps: (name: string) => {
        value: string | NonNullable<Partial<T>[keyof T]>;
        onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
        onBlur: () => void;
        error: boolean;
        helperText: string;
    };
    reset: () => void;
    setValues: import("react").Dispatch<import("react").SetStateAction<Partial<T>>>;
    setErrors: import("react").Dispatch<import("react").SetStateAction<Record<string, string>>>;
};
export declare const createFormSchema: <T extends z.ZodRawShape>(shape: T) => z.ZodObject<{ -readonly [P in keyof T]: T[P]; }, z.core.$strip>;
export declare const commonSchemas: {
    email: z.ZodString;
    password: z.ZodString;
    username: z.ZodString;
    inviteCode: z.ZodString;
    url: z.ZodString;
};
export {};
//# sourceMappingURL=useZodForm.d.ts.map