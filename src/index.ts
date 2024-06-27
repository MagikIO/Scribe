import consola from 'consola';
import { createLogger, type LoggerOptions } from 'winston';
import DailyRotateFile, { type EventEmitter } from 'winston-daily-rotate-file';
import type TransportStream from 'winston-transport';
import type { MagikLogger } from './MagikLogger';
import { LogFormatters } from './utils/LogFormatters';
import { LogLevelRecord, LogUtils } from './utils/LogUtils';
import { ConsolaTransport } from './utils/Transports';

interface MagikLogOptions<Service extends string = string> extends LoggerOptions {
  service: Service;
}

/**
 * Welcome to `MagikLogs`, a home to digital scribes (loggers);
 * 
 * Each scribe is bound by a unique rune (symbol), marking their service and ensuring the accuracy of their records, even if two scribes share the same name.
 * 
 * The Hall contains the secrets of the scribes' transports, vessels through which whispers are carried.
 * These transports are created through a ritual known as `createDefaultLogger`, ensuring each service has its vessel.
 * 
 * The Hall also holds the secrets of the scribes' removal of whispers, a ritual known as `remove`, ensuring the chambers remain uncluttered.
 * 
  * @example
 * // Creating a new Hall of Scribes with scribe `Server` and `Redis`
 * const hall = new MagikLogs({ services: ['Server', 'Redis'] });
 * 
 * @example
 * // Accessing a scribe's logger
 * const logger = hall.get('Redis');
 * logger.info('This is ancient secret, knowledge too powerful to be shared with the uninitiated.');
 * 
 * @example
 * // Removing a scribe's from the hall
 * const serverIsGone = hall.remove('Server');
 * console.log(serverIsGone); // true
 */
export class MagikLogs<Services extends string = string> {
  protected services: Array<Services>;
  protected scribeHall = new Map<Services, MagikLogger>();
  protected eventEmitter?: EventEmitter
  protected useWebSocket = false;
  protected debug = false;

  /** Default options for log file */
  public static defaultLogFileOptions = {
    datePattern: 'MM-DD-YYYY',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '14d',
  }

  /** Constructs a new instance of MagikLogs */
  constructor({ services, eventEmitter, debug }: { services: Array<Services>, eventEmitter?: EventEmitter, debug?: boolean }) {
    this.debug = debug ?? false;
    this.services = services;
    if (eventEmitter) {
      this.useWebSocket = true;
      this.eventEmitter = eventEmitter;
    }

    this.initializeServices();
  }

  /** Development log transports. */
  public devLogTransports: Array<ConsolaTransport> = [
    new ConsolaTransport({ format: LogFormatters.filterLevelsThenFormatForConsola({ min: 'error', max: 'internal' }) }),
    new ConsolaTransport({
      level: 'box',
      format: LogFormatters.filterLevelsThenFormatForConsola({ min: 'box', max: 'box' }),
    }),
  ]

  public productionTransports = (service: Services) => ([
    new DailyRotateFile({
      filename: `./logs/${service}/%DATE%/error-logs.log`,
      ...MagikLogs.defaultLogFileOptions,
      level: 'error',
      format: LogFormatters.filterLevelsThenFormatAsJSON({ min: 'error' }),
    }),
    new DailyRotateFile({
      filename: `./logs/${service}/%DATE%/general-logs.log`,
      ...MagikLogs.defaultLogFileOptions,
      format: LogFormatters.filterLevelsThenFormatAsJSON({ min: 'warn', max: 'debug' }),
    }),
  ] as TransportStream[]);

  /** Initializes the services and creates default loggers for each service */
  protected initializeServices() {
    this.services.forEach((service) => {
      this.scribeHall.set(service, this.createDefaultLogger({ service }));
    });
  }

  /** Creates a default logger for a service */
  protected createDefaultLogger<Service extends Services = Services>(opts: MagikLogOptions<Service>) {
    const { service, ...options } = opts;

    return createLogger({
      levels: LogLevelRecord,
      defaultMeta: { service, ...options.defaultMeta },
      transports: (process.env.NODE_ENV === 'production')
        ? this.productionTransports(service)
        : this.devLogTransports,
    }) as MagikLogger<typeof service>;
  }

  /** Gets the logger for a service */
  public get(service: Services): MagikLogger | undefined { return this.scribeHall.get(service); }

  /** Removes the logger for a service */
  public remove(service: Services): boolean { return this.scribeHall.delete(service); }

  /** Adds a new service to the hall of scribes */
  public add(service: Services) {
    this.scribeHall.set(service, this.createDefaultLogger({ service }));
  }

  /** Gets all the services in the hall of scribes */
  public getAllServices() { return this.scribeHall.keys(); }

  /** Gets all the loggers in the hall of scribes */
  public getAllLoggers() { return this.scribeHall.values(); }

  public _prettyLogBox(title: string, message: string) {
    // Inform the user this may take a while
    consola.box({
      title: `${LogUtils.cyanToPurpleGradient(title)}`,
      badge: true,
      message,
      style: { padding: 2, borderColor: 'magenta', borderStyle: 'double', badge: 'magenta', valign: 'center' }
    });
  }
}
