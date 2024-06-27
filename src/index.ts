import consola from 'consola';
import { type LoggerOptions } from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import type TransportStream from 'winston-transport';
import { createMagikLogger, type MagikLogger } from './MagikLogger';
import { LogFormatters } from './utils/LogFormatters';
import { LogLevelRecord, LogUtils } from './utils/LogUtils';
import { ConsolaTransport } from './utils/Transports';

interface MagikLogOptions<Service extends string = string> extends LoggerOptions { service: Service; }

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
  protected services: ReadonlyArray<Services>;
  protected scribeHall = new Map<Services, MagikLogger>();

  protected debug = false;

  private DEFAULT_logFileOptions = {
    datePattern: 'MM-DD-YYYY' as const,
    zippedArchive: true,
    maxSize: '20m' as const,
    maxFiles: '14d' as const,
  };
  /** Constructs a new instance of MagikLogs */
  constructor({ services, debug }: { services: Array<Services | MagikLogOptions<Services>> | ReadonlyArray<Services | MagikLogOptions<Services>>, debug?: boolean }) {
    this.debug = debug ?? false;
    if (!services || services.length === 0) throw new Error('MagikLogs requires at least one service to be initialized.');

    const servicesToInit: Array<Services> = [];

    if (this.debug) this._prettyLogBox('MagikLogs', `Initializing MagikLogs with services: ${services.join(', ')}`);
    services.forEach((s) => {
      if (typeof s === 'string') {
        servicesToInit.push(s);
        this.add(s);
      } else {
        servicesToInit.push(s.service);
        this.scribeHall.set(s.service, this.createDefaultLogger(s));
      }
    })

    this.services = servicesToInit as ReadonlyArray<Services>;
  }

  /** Development log transports. */
  public devLogTransports: Array<ConsolaTransport> = [
    new ConsolaTransport({ format: LogFormatters.filterLevelsThenFormatForConsola({ min: 'error', max: 'internal' }) }),
    new ConsolaTransport({ level: 'box', format: LogFormatters.filterLevelsThenFormatForConsola({ min: 'box', max: 'box' }) }),
  ]

  public productionTransports = (service: Services) => {
    const options = this.DEFAULT_logFileOptions;

    return ([
      new DailyRotateFile({
        filename: `./logs/${service}/%DATE%/error-logs.log`,
        ...options,
        level: 'error',
        format: LogFormatters.filterLevelsThenFormatAsJSON({ min: 'error' }),
      }),
      new DailyRotateFile({
        filename: `./logs/${service}/%DATE%/general-logs.log`,
        ...options,
        format: LogFormatters.filterLevelsThenFormatAsJSON({ min: 'warn', max: 'debug' }),
      }),
    ] as TransportStream[]);
  }


  /** Creates a default logger for a service */
  protected createDefaultLogger<Service extends Services = Services>(opts: MagikLogOptions<Service>) {
    const { service, ...options } = opts;

    return createMagikLogger({
      service,
      levels: LogLevelRecord,
      defaultMeta: (options.defaultMeta) ? { ...options.defaultMeta, service } : { service },
      transports: (process.env.NODE_ENV === 'production')
        ? this.productionTransports(service)
        : [...this.devLogTransports, ...this.productionTransports(service)],
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
