import winston from 'winston';
import 'dotenv/config';

const colors: Record<string, string> = {
  error: '\x1b[31m',
  warn: '\x1b[33m',
  info: '\x1b[36m',
  debug: '\x1b[90m',
};

const reset = '\x1b[0m';

export class Logger {
  private logger: winston.Logger;
  private module: string;

  constructor(module: string) {
    this.module = module;

    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.errors({ stack: true }),
      ),
      transports: [
        new winston.transports.Console({
          format: winston.format.printf(({ timestamp, level, message, ...meta }) => {
            const color = colors[level] || '';
            const prefix = `${timestamp} ${color}[${level.toUpperCase()}]${reset} [${this.module}]:`;
            const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
            return `${prefix} ${message}${metaStr}`;
          }),
        }),
        new winston.transports.File({
          filename: 'logs/error.log',
          level: 'error',
          maxsize: 5242880,
          maxFiles: 5,
        }),
        new winston.transports.File({
          filename: 'logs/combined.log',
          maxsize: 5242880,
          maxFiles: 5,
        }),
      ],
    });
  }

  info(message: string, ...meta: unknown[]) {
    this.logger.info(message, ...meta);
  }

  warn(message: string, ...meta: unknown[]) {
    this.logger.warn(message, ...meta);
  }

  error(message: string, ...meta: unknown[]) {
    this.logger.error(message, ...meta);
  }

  debug(message: string, ...meta: unknown[]) {
    this.logger.debug(message, ...meta);
  }
}
