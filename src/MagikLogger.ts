import { Logger, type LoggerOptions } from 'winston';
import { LogLevel, LogLevelRecord } from './utils/LogUtils';
import { LEVEL } from 'triple-beam';

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

function isLevelEnabledFunctionName(level: string) {
  return 'is' + level.charAt(0).toUpperCase() + level.slice(1) + 'Enabled';
}

export function createMagikLogger<ServiceName extends string = string>(opts: LoggerOptions & { service: ServiceName }) {
  opts.levels = opts.levels ?? LogLevelRecord;

  /**
   * DerivedLogger to attach the logs level methods.
   * @type {DerivedLogger}
   * @extends {MagikLogger<ServiceName>}
   */
  class DerivedLogger extends MagikLogger<ServiceName> {
    /**
    * Create a new class derived logger for which the levels can be attached to
    * the prototype of. This is a V8 optimization that is well know to increase
    * performance of prototype functions.
    * @param {!Object} options - Options for the created logger.
    */
    constructor(options: LoggerOptions & { service: ServiceName }) {
      super(options);
    }
  }

  const logger = new DerivedLogger(opts);

  /** Create the log level methods for the derived logger */
  Object.keys(opts.levels).forEach(function (level) {
    if (level === 'log') {
      console.warn('Level "log" not defined: conflicts with the method "log". Use a different level name.');
      return;
    }

    //
    // Define prototype methods for each log level e.g.:
    // logger.log('info', msg) implies these methods are defined:
    // - logger.info(msg)
    // - logger.isInfoEnabled()
    //
    // Remark: to support logger.child this **MUST** be a function
    // so it'll always be called on the instance instead of a fixed
    // place in the prototype chain.
    //
    // @ts-ignore
    DerivedLogger.prototype[level] = function (...args: Array<unknown>) {
      // Prefer any instance scope, but default to "root" logger
      const self = this || logger;

      // Optimize the hot-path which is the single object.
      if (args.length === 1) {
        const [msg] = args;
        // @ts-ignore
        const info = msg && msg.message && msg || { message: msg };
        info.level = info[LEVEL] = level;
        // self._addDefaultMeta(info);
        self.write(info);
        return (this || logger);
      }

      // When provided nothing assume the empty string
      if (args.length === 0) {
        self.log(level, '');
        return self;
      }

      // Otherwise build argument list which could potentially conform to
      // either:
      // . v3 API: log(obj)
      // 2. v1/v2 API: log(level, msg, ... [string interpolate], [{metadata}], [callback])
      // @ts-ignore
      return self.log(level, ...args);
    };
    // @ts-ignore
    DerivedLogger.prototype[isLevelEnabledFunctionName(level)] = function () {
      return (this || logger).isLevelEnabled(level);
    };
  });

  return logger as MagikLogger<ServiceName>;

}
