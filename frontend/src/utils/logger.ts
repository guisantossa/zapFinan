// Enhanced logging utility for authentication debugging

interface LogMessage {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  module: string;
  message: string;
  data?: any;
}

class Logger {
  private logs: LogMessage[] = [];
  private isDevelopment = import.meta.env.DEV;

  private log(level: LogMessage['level'], module: string, message: string, data?: any) {
    const logMessage: LogMessage = {
      timestamp: new Date().toISOString(),
      level,
      module,
      message,
      data
    };

    this.logs.push(logMessage);

    // Keep only last 100 logs to prevent memory leaks
    if (this.logs.length > 100) {
      this.logs = this.logs.slice(-100);
    }

    // Console logging (development or explicit debug mode)
    if (this.isDevelopment || localStorage.getItem('debug-auth') === 'true') {
      const styles = {
        info: 'color: #3B82F6',
        warn: 'color: #F59E0B',
        error: 'color: #EF4444',
        debug: 'color: #8B5CF6'
      };

      console.log(
        `%c[${level.toUpperCase()}] ${module}: ${message}`,
        styles[level],
        data || ''
      );
    }
  }

  info(module: string, message: string, data?: any) {
    this.log('info', module, message, data);
  }

  warn(module: string, message: string, data?: any) {
    this.log('warn', module, message, data);
  }

  error(module: string, message: string, data?: any) {
    this.log('error', module, message, data);
  }

  debug(module: string, message: string, data?: any) {
    this.log('debug', module, message, data);
  }

  // Get all logs (useful for debugging)
  getLogs(): LogMessage[] {
    return [...this.logs];
  }

  // Get logs for specific module
  getLogsForModule(module: string): LogMessage[] {
    return this.logs.filter(log => log.module === module);
  }

  // Export logs as text for support
  exportLogs(): string {
    return this.logs
      .map(log => `[${log.timestamp}] ${log.level.toUpperCase()} ${log.module}: ${log.message}${log.data ? ` - ${JSON.stringify(log.data)}` : ''}`)
      .join('\n');
  }

  // Clear logs
  clearLogs() {
    this.logs = [];
  }

  // Enable debug mode (shows logs even in production)
  enableDebugMode() {
    localStorage.setItem('debug-auth', 'true');
    console.log('%cDebug mode enabled for authentication', 'color: #10B981; font-weight: bold');
  }

  // Disable debug mode
  disableDebugMode() {
    localStorage.removeItem('debug-auth');
    console.log('%cDebug mode disabled for authentication', 'color: #6B7280; font-weight: bold');
  }
}

export const logger = new Logger();

// Expose logger to window for debugging purposes
if (typeof window !== 'undefined') {
  (window as any).authLogger = logger;
}