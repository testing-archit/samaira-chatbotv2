export const logger = {
  info: (message: string, data?: any) => log('INFO', message, data),
  warn: (message: string, data?: any) => log('WARN', message, data),
  error: (message: string, data?: any) => log('ERROR', message, data),
};

function redact(data: any): any {
  if (typeof data !== 'object' || data === null) return data;
  if (Array.isArray(data)) return data.map(redact);
  
  const redacted = { ...data };
  for (const key in redacted) {
    if (typeof redacted[key] === 'string') {
      // Basic PII redaction for demonstration: emails and typical phone numbers
      if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(redacted[key])) {
        redacted[key] = '[REDACTED EMAIL]';
      } else if (/^\+?\d{10,14}$/.test(redacted[key])) {
        redacted[key] = '[REDACTED PHONE]';
      }
    } else if (typeof redacted[key] === 'object') {
      redacted[key] = redact(redacted[key]);
    }
  }
  return redacted;
}

function log(level: string, message: string, data?: any) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    data: data ? redact(data) : undefined,
  };
  // Use console.log for stdout as a structured JSON log
  console.log(JSON.stringify(entry));
}
