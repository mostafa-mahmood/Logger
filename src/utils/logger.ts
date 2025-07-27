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
 domain?: string;
 filepath?: string;
 context?: any;
 [key: string]: any; 
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
}); 

function getRequestContext(req?: any): LogContext { 
 if (!req) {
   baseLogger.debug('Request context not provided');
   return {};
 }

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
 if (!error) {
   baseLogger.debug('Error object not provided');
   return undefined;
 }

 try { 
   const processedError: LogError = {
     message: error.message || String(error) || 'Unknown error', 
     stack: error.stack || 'No stack trace available'
   };

   // Extract domain info if it exists
   if (error.domain) processedError.domain = String(error.domain);
   if (error.filepath) processedError.filepath = String(error.filepath);
   if (error.context) processedError.context = error.context;

   // Preserve any other custom error properties
   Object.keys(error).forEach(key => {
     if (!['message', 'stack', 'domain', 'filepath', 'context'].includes(key)) {
       processedError[key] = error[key];
     }
   });

   return processedError;
 } catch (err) { 
   baseLogger.warn('Failed to process error object');
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

function createLogger(): Logger { 
 return { 
   trace: (message: string, req?: any, metadata: Record<string, any> = {}) => { 
     const context = getRequestContext(req);
     if (Object.keys(metadata).length > 0) {
       context.metadata = metadata;
     }
     baseLogger.trace(context, message); 
   }, 
   debug: (message: string, req?: any, metadata: Record<string, any> = {}) => { 
     const context = getRequestContext(req);
     if (Object.keys(metadata).length > 0) {
       context.metadata = metadata;
     }
     baseLogger.debug(context, message); 
   }, 
   info: (message: string, req?: any, metadata: Record<string, any> = {}) => { 
     const context = getRequestContext(req);
     if (Object.keys(metadata).length > 0) {
       context.metadata = metadata;
     }
     baseLogger.info(context, message); 
   }, 
   warn: (message: string, req?: any, metadata: Record<string, any> = {}) => { 
     const context = getRequestContext(req);
     if (Object.keys(metadata).length > 0) {
       context.metadata = metadata;
     }
     baseLogger.warn(context, message); 
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
     baseLogger.error(context, message); 
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
     baseLogger.fatal(context, message); 
   } 
 }; 
} 

export default createLogger; 
export type { LogContext, LogUser, LogRequest, LogError };