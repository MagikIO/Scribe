import { Logger, type LoggerOptions } from 'winston';
import type { LogLevel } from './utils/LogUtils';

type UniqueLogKeys = Exclude<keyof typeof LogLevel, keyof Logger>;
type UniqueLogMethods = Record<UniqueLogKeys, (message: string, meta?: unknown) => void>;

export class MagikLogger<
  ServiceName extends string = string
> extends Logger implements UniqueLogMethods {
  serviceName: ServiceName;

  constructor(options: LoggerOptions & { service: ServiceName }) {
    super(options);
    this.serviceName = options.service;
  }

  success(message: string, meta?: unknown) {
    return this.log({ level: 'success', message, meta });
  }

  box(message: any, meta?: unknown) {
    return this.log({ level: 'box', message, meta });
  }

  internal(message: string, meta?: unknown) {
    return this.log({ level: 'internal', message, meta });
  }
}
