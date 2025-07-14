import pino from 'pino';

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
  domain?: string;
  filename?: string;
}

interface LogContext {
  user?: LogUser;
  request?: LogRequest;
  error?: LogError;
  module?: LogModule;
  metadata?: Record<string, any>;
}

const baseLogger = pino({
  level: process.env.LOG_LEVEL || 'info',
  timestamp: pino.stdTimeFunctions.isoTime,
});


function getRequestContext(req?: any): LogContext {
  
  if (!req) return {};
  
  const context: LogContext = {};
  
  try {
    
    if (req.user?.id || req.ip) {
      context.user = {};
      if (req.user?.id) context.user.id = String(req.user.id);
      if (req.ip) context.user.ip = String(req.ip);
    }
    
    
    if (req.id || req.method || req.originalUrl || req.url) {
      context.request = {};
      if (req.id) context.request.id = String(req.id);
      if (req.method) context.request.method = String(req.method);
      if (req.originalUrl) context.request.route = String(req.originalUrl);
      else if (req.url) context.request.route = String(req.url);
    }
  } catch (error) {
    console.warn('Failed to extract request context:', error);
  }
  
  return context;
}

function processError(error?: any): LogError | undefined {
  if (!error) return undefined;
  
  try {
    return {
      message: error.message || String(error) || 'Unknown error',
      stack: error.stack || 'No stack trace available'
    };
  } catch (err) {
    return {
      message: 'Error processing failed',
      stack: 'Unable to extract stack trace'
    };
  }
}

interface Logger {
  trace: (message: string, req?: any, metadata?: Record<string, any>) => void;
  debug: (message: string, req?: any, metadata?: Record<string, any>) => void;
  info: (message: string, req?: any, metadata?: Record<string, any>) => void;
  warn: (message: string, req?: any, metadata?: Record<string, any>) => void;
  error: (message: string, req?: any, error?: any, metadata?: Record<string, any>) => void;
  fatal: (message: string, req?: any, error?: any, metadata?: Record<string, any>) => void;
}

const logger: Logger = {

  trace: (message: string, req?: any, metadata: Record<string, any> = {}) => {
    const context: LogContext = { 
      ...getRequestContext(req), 
      metadata 
    };
    baseLogger.trace(context, message);
  },
  
  debug: (message: string, req?: any, metadata: Record<string, any> = {}) => {
    const context: LogContext = { 
      ...getRequestContext(req), 
      metadata 
    };
    baseLogger.debug(context, message);
  },
  
  info: (message: string, req?: any, metadata: Record<string, any> = {}) => {
    const context: LogContext = { 
      ...getRequestContext(req), 
      metadata 
    };
    baseLogger.info(context, message);
  },
  
  warn: (message: string, req?: any, metadata: Record<string, any> = {}) => {
    const context: LogContext = { 
      ...getRequestContext(req), 
      metadata 
    };
    baseLogger.warn(context, message);
  },
  
  error: (message: string, req?: any, error?: any, metadata: Record<string, any> = {}) => {
    const context: LogContext = { 
      ...getRequestContext(req), 
      error: processError(error),
      metadata 
    };
    baseLogger.error(context, message);
  },
  
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