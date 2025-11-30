// Sistema de logging centralizado
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class Logger {
  private prefix: string;
  private enabled: boolean = true;

  constructor(prefix: string = 'APP') {
    this.prefix = prefix;
  }

  private formatMessage(level: LogLevel, message: string, ..._args: any[]): string {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${this.prefix}] [${level.toUpperCase()}]`;
    return `${prefix} ${message}`;
  }

  debug(message: string, ...args: any[]) {
    if (this.enabled) {
      console.log(this.formatMessage('debug', message), ...args);
    }
  }

  info(message: string, ...args: any[]) {
    if (this.enabled) {
      console.log(this.formatMessage('info', message), ...args);
    }
  }

  warn(message: string, ...args: any[]) {
    if (this.enabled) {
      console.warn(this.formatMessage('warn', message), ...args);
    }
  }

  error(message: string, ...args: any[]) {
    if (this.enabled) {
      console.error(this.formatMessage('error', message), ...args);
    }
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }
}

// Exportar loggers específicos
export const appLogger = new Logger('APP');
export const timerLogger = new Logger('TIMER');
export const configLogger = new Logger('CONFIG');
export const settingsLogger = new Logger('SETTINGS');
export const overlayLogger = new Logger('OVERLAY');

// Função helper para criar loggers customizados
export function createLogger(prefix: string): Logger {
  return new Logger(prefix);
}


