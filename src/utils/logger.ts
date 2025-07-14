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
  [key: string]: any;
}

interface LogModule {
  domain?: string;
  filepath?: string;
}

interface LogContext {
  user?: LogUser;
  request?: LogRequest;
  error?: LogError;
  metadata?: Record<string, any>;
}

const baseLogger = pino({
  level: process.env.LOG_LEVEL || 'info',
  timestamp: pino.stdTimeFunctions.isoTime,
  base: null,
//   transport: {
//           target: 'pino-pretty'
//   }
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
    baseLogger.warn({ error }, 'Failed to extract request context');
  }

  return context;
}

function processError(error?: any): LogError | undefined {
  if (!error) return undefined;

  try {
    return {
      message: error.message || String(error) || 'Unknown error',
      stack: error.stack || 'No stack trace available',
      ...error // Preserve custom error properties
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

function createLogger(moduleInfo?: LogModule): Logger {
  const childLogger = moduleInfo ? baseLogger.child({ module: moduleInfo }) : baseLogger;

  return {
    trace: (message: string, req?: any, metadata: Record<string, any> = {}) => {
      childLogger.trace({ ...getRequestContext(req), metadata }, message);
    },
    debug: (message: string, req?: any, metadata: Record<string, any> = {}) => {
      childLogger.debug({ ...getRequestContext(req), metadata }, message);
    },
    info: (message: string, req?: any, metadata: Record<string, any> = {}) => {
      childLogger.info({ ...getRequestContext(req), metadata }, message);
    },
    warn: (message: string, req?: any, metadata: Record<string, any> = {}) => {
      childLogger.warn({ ...getRequestContext(req), metadata }, message);
    },
    error: (message: string, req?: any, error?: any, metadata: Record<string, any> = {}) => {
      childLogger.error({ ...getRequestContext(req), error: processError(error), metadata }, message);
    },
    fatal: (message: string, req?: any, error?: any, metadata: Record<string, any> = {}) => {
      childLogger.fatal({ ...getRequestContext(req), error: processError(error), metadata }, message);
    }
  };
}

export default createLogger;
export type { LogContext, LogUser, LogRequest, LogError, LogModule };