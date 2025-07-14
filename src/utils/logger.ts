import pino from 'pino';

// ========================================
// TYPE DEFINITIONS - Schema for structured logging
// ========================================

interface LogUser {
  id?: string;
  ip?: string;
}

interface LogRequest {
  id?: string;
  method?: string;
  route?: string;
}

interface LogError {
  message: string;
  stack?: string;
}

interface LogModule {
  domain?: string;    // Service/domain name (e.g., 'user-service', 'payment-api')
  filename?: string;  // File where log was called from
}

interface LogContext {
  user?: LogUser;
  request?: LogRequest;
  error?: LogError;
  module?: LogModule;
  metadata?: Record<string, any>;  // Custom fields - programmer can add anything here
}

// ========================================
// PINO LOGGER SETUP - Base logger configuration
// ========================================

const baseLogger = pino({
  level: process.env.LOG_LEVEL || 'info',  // Default to 'info', override with env var
  timestamp: pino.stdTimeFunctions.isoTime, // ISO timestamp format
});

// ========================================
// CONTEXT EXTRACTION - Safely extract data from request object
// ========================================

function getRequestContext(req?: any): LogContext {
  // If no request object passed, return empty context
  if (!req) return {};
  
  const context: LogContext = {};
  
  try {
    // USER CONTEXT - Extract user information if available
    if (req.user?.id || req.ip) {
      context.user = {};
      if (req.user?.id) context.user.id = String(req.user.id);
      if (req.ip) context.user.ip = String(req.ip);
    }
    
    // REQUEST CONTEXT - Extract request information if available
    if (req.id || req.method || req.originalUrl || req.url) {
      context.request = {};
      if (req.id) context.request.id = String(req.id);
      if (req.method) context.request.method = String(req.method);
      if (req.originalUrl) context.request.route = String(req.originalUrl);
      else if (req.url) context.request.route = String(req.url); // Fallback
    }
  } catch (error) {
    // GRACEFUL ERROR HANDLING - If context extraction fails, don't crash the app
    console.warn('Failed to extract request context:', error);
  }
  
  return context;
}

// ========================================
// ERROR HANDLING - Safely process error objects
// ========================================

function processError(error?: any): LogError | undefined {
  if (!error) return undefined;
  
  try {
    return {
      message: error.message || String(error) || 'Unknown error',
      stack: error.stack || 'No stack trace available'
    };
  } catch (err) {
    // If error processing fails, return basic error info
    return {
      message: 'Error processing failed',
      stack: 'Unable to extract stack trace'
    };
  }
}

// ========================================
// LOGGER INTERFACE - Type-safe logging methods
// ========================================

interface Logger {
  trace: (message: string, req?: any, metadata?: Record<string, any>) => void;
  debug: (message: string, req?: any, metadata?: Record<string, any>) => void;
  info: (message: string, req?: any, metadata?: Record<string, any>) => void;
  warn: (message: string, req?: any, metadata?: Record<string, any>) => void;
  error: (message: string, req?: any, error?: any, metadata?: Record<string, any>) => void;
  fatal: (message: string, req?: any, error?: any, metadata?: Record<string, any>) => void;
}

// ========================================
// LOGGER IMPLEMENTATION - Main logging functionality
// ========================================

const logger: Logger = {
  // TRACE - Most detailed debugging info (function entry/exit, variable values)
  trace: (message: string, req?: any, metadata: Record<string, any> = {}) => {
    const context: LogContext = { 
      ...getRequestContext(req), 
      metadata 
    };
    baseLogger.trace(context, message);
  },
  
  // DEBUG - Detailed debugging info (application flow, detailed operations)
  debug: (message: string, req?: any, metadata: Record<string, any> = {}) => {
    const context: LogContext = { 
      ...getRequestContext(req), 
      metadata 
    };
    baseLogger.debug(context, message);
  },
  
  // INFO - General information (business events, user actions)
  info: (message: string, req?: any, metadata: Record<string, any> = {}) => {
    const context: LogContext = { 
      ...getRequestContext(req), 
      metadata 
    };
    baseLogger.info(context, message);
  },
  
  // WARN - Warning conditions (deprecated usage, recoverable errors)
  warn: (message: string, req?: any, metadata: Record<string, any> = {}) => {
    const context: LogContext = { 
      ...getRequestContext(req), 
      metadata 
    };
    baseLogger.warn(context, message);
  },
  
  // ERROR - Error conditions (handled errors, validation failures)
  error: (message: string, req?: any, error?: any, metadata: Record<string, any> = {}) => {
    const context: LogContext = { 
      ...getRequestContext(req), 
      error: processError(error),
      metadata 
    };
    baseLogger.error(context, message);
  },
  
  // FATAL - Critical errors (application crashes, unrecoverable errors)
  fatal: (message: string, req?: any, error?: any, metadata: Record<string, any> = {}) => {
    const context: LogContext = { 
      ...getRequestContext(req), 
      error: processError(error),
      metadata 
    };
    baseLogger.fatal(context, message);
  }
};

export default logger;
export type { LogContext, LogUser, LogRequest, LogError, LogModule };