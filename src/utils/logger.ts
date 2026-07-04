import winston from 'winston';
import * as dotenv from 'dotenv';

dotenv.config();

const { combine, timestamp, printf, colorize } = winston.format;

const myFormat = printf(({ level, message, timestamp, context }) => {
  return `${timestamp} [${context || 'App'}] ${level}: ${message}`;
});

export const baseLogger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    colorize(),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    myFormat
  ),
  transports: [
    new winston.transports.Console()
  ]
});

export class Logger {
  private context: string;

  constructor(context: string) {
    this.context = context;
  }

  info(message: string, ...meta: any[]) {
    baseLogger.info(message, { context: this.context, ...meta });
  }

  error(message: string, error?: any) {
    baseLogger.error(`${message} ${error?.stack || error || ''}`, { context: this.context });
  }

  warn(message: string, ...meta: any[]) {
    baseLogger.warn(message, { context: this.context, ...meta });
  }

  debug(message: string, ...meta: any[]) {
    baseLogger.debug(message, { context: this.context, ...meta });
  }
}
