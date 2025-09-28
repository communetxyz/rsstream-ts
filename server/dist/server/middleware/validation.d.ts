import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
/**
 * Express middleware for validating request body against a Zod schema
 */
export declare const validateBody: <T>(schema: z.ZodSchema<T>) => (req: Request, res: Response, next: NextFunction) => void;
/**
 * Express middleware for validating request query parameters against a Zod schema
 */
export declare const validateQuery: <T>(schema: z.ZodSchema<T>) => (req: Request, res: Response, next: NextFunction) => void;
/**
 * Express middleware for validating request params against a Zod schema
 */
export declare const validateParams: <T>(schema: z.ZodSchema<T>) => (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=validation.d.ts.map