import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

/**
 * Express middleware for validating request body against a Zod schema
 */
export const validateBody = <T>(schema: z.ZodSchema<T>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = schema.parse(req.body);
      req.body = result; // Replace with validated and transformed data
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const messages = error.issues.map(e => {
          const path = e.path.length > 0 ? `${e.path.join('.')}: ` : '';
          return `${path}${e.message}`;
        }).join(', ');
        
        res.status(400).json({
          error: 'Validation failed',
          details: messages,
          errors: error.issues
        });
      } else {
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
export const validateQuery = <T>(schema: z.ZodSchema<T>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = schema.parse(req.query);
      req.query = result as any; // Replace with validated and transformed data
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const messages = error.issues.map(e => {
          const path = e.path.length > 0 ? `${e.path.join('.')}: ` : '';
          return `${path}${e.message}`;
        }).join(', ');
        
        res.status(400).json({
          error: 'Validation failed',
          details: messages,
          errors: error.issues
        });
      } else {
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
export const validateParams = <T>(schema: z.ZodSchema<T>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = schema.parse(req.params);
      req.params = result as any; // Replace with validated and transformed data
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const messages = error.issues.map(e => {
          const path = e.path.length > 0 ? `${e.path.join('.')}: ` : '';
          return `${path}${e.message}`;
        }).join(', ');
        
        res.status(400).json({
          error: 'Validation failed',
          details: messages,
          errors: error.issues
        });
      } else {
        res.status(400).json({
          error: 'Invalid parameters'
        });
      }
    }
  };
};