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
     const context = getRequestContext(req);
     if (Object.keys(metadata).length > 0) {
       context.metadata = metadata;
     }
     childLogger.trace(context, message); 
   }, 
   debug: (message: string, req?: any, metadata: Record<string, any> = {}) => { 
     const context = getRequestContext(req);
     if (Object.keys(metadata).length > 0) {
       context.metadata = metadata;
     }
     childLogger.debug(context, message); 
   }, 
   info: (message: string, req?: any, metadata: Record<string, any> = {}) => { 
     const context = getRequestContext(req);
     if (Object.keys(metadata).length > 0) {
       context.metadata = metadata;
     }
     childLogger.info(context, message); 
   }, 
   warn: (message: string, req?: any, metadata: Record<string, any> = {}) => { 
     const context = getRequestContext(req);
     if (Object.keys(metadata).length > 0) {
       context.metadata = metadata;
     }
     childLogger.warn(context, message); 
   }, 
   error: (message: string, req?: any, error?: any, metadata: Record<string, any> = {}) => { 
     const context = getRequestContext(req);
     const processedError = processError(error);
     if (processedError) {
       context.error = processedError;
     }
     if (Object.keys(metadata).length > 0) {
       context.metadata = metadata;
     }
     childLogger.error(context, message); 
   }, 
   fatal: (message: string, req?: any, error?: any, metadata: Record<string, any> = {}) => { 
     const context = getRequestContext(req);
     const processedError = processError(error);
     if (processedError) {
       context.error = processedError;
     }
     if (Object.keys(metadata).length > 0) {
       context.metadata = metadata;
     }
     childLogger.fatal(context, message); 
   } 
 }; 
} 

export default createLogger; 
export type { LogContext, LogUser, LogRequest, LogError, LogModule };