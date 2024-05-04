import Entity from '@anandamideio/entity';
import consola from 'consola';
import CustomTransport from 'winston-transport';
import WebSocket from 'ws';
import gradient from 'gradient-string';
import { createLogger, format, Logger, transports, type LoggerOptions } from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import TransportStream from 'winston-transport';

const greenGradient = gradient([
  { color: '#00FF00', pos: 0 }, { color: '#00e500', pos: 0.5 }, { color: '#00cc00', pos: 1 },
]);

const yellowGradient = gradient([
  { color: '#FFFF66', pos: 0 }, { color: '#FFFF00', pos: 0.25 }, { color: '#e5e500', pos: 0.5 }, { color: '#cccc00', pos: 1 },
]);

type LogLevels = typeof MagikLogTransportLevels['levels'];

class ChronoFormatters {
  static USDate = (date: Date, includeSeconds = false) => {
    const config: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    };

    if (includeSeconds) config.second = 'numeric';
    return new Date(date).toLocaleDateString('en-US', config);
  };

  static USTime = (date: Date, includeSeconds = false) => {
    const config: Intl.DateTimeFormatOptions = {
      hour: 'numeric',
      minute: '2-digit',
    };

    if (includeSeconds) config.second = 'numeric';
    return new Date(date).toLocaleTimeString('en-US', config);
  };

  static USDateFormatter = format((info) => {
    info.timestamp = this.USDate(info.timestamp as Date);
    return info;
  });
}

/**
 * Class containing various log formatters.
 */
class LogFormatters {
  /**
   * Formats log messages based on the specified minimum and maximum log levels.
   * @param info - The log message information.
   * @param min - The minimum log level.
   * @param max - The maximum log level (optional).
   * @returns The formatted log message if it meets the level criteria, otherwise false.
   */
  static filterLevels = format((info, { min, max }: { min: keyof LogLevels, max?: keyof LogLevels }) => {
    const levels = MagikLogTransportLevels.levels;
    const minLevel = levels[min];
    const maxLevel = levels[max ?? 'internal'];

    if (info.level) {
      const level = levels[info.level as keyof LogLevels];
      if (level >= minLevel && level <= maxLevel) return info;
    }

    return false;
  });

  static filterLevelsThenFormatForConsola = (levelConfigs: { min: keyof LogLevels, max?: keyof LogLevels }) => format.combine(
    LogFormatters.filterLevels(levelConfigs),
  )

  /**
   * Formats log messages based on the specified minimum and maximum log levels, and converts them to JSON format.
   * @param levelConfigs - The log level configurations.
   * @returns The combined log formatter.
   */
  static filterLevelsThenFormatAsJSON = (levelConfigs: { min: keyof LogLevels, max?: keyof LogLevels }) => format.combine(
    LogFormatters.filterLevels(levelConfigs),
    format.timestamp(),
    ChronoFormatters.USDateFormatter(),
    format.errors({ stack: true }),
    format.json(),
  );

  /**
   * Formats log messages based on the specified minimum and maximum log levels, and pretty prints them.
   * @param levelConfigs - The log level configurations.
   * @returns The combined log formatter.
   */
  static filterThenPrettyPrint = (levelConfigs: { min: keyof LogLevels, max?: keyof LogLevels }) => format.combine(
    LogFormatters.filterLevels(levelConfigs),
    format.timestamp(),
    format.printf(
      ({ prefix, message, timestamp, data, dontTimestamp }) => {
        let response = '';
        if (prefix) response += `${gradient.mind(prefix as string)} -> `;
        response += (prefix) ? `${gradient.cristal(message as string)}` : `${gradient.mind(message as string)}`;
        if (!data) return response.trim();

        if (typeof data !== 'object' && Array.isArray(data) === false) response += ` ${yellowGradient(data as string)}`;
        if (!dontTimestamp) response += ` -| ${greenGradient(ChronoFormatters.USTime(timestamp as Date, true))} |-`;
        if (data && typeof (data) === 'object') {
          response += `\n${JSON.stringify(
            data,
            undefined,
            2,
          )}`;
        }

        return response.trim();
      },
    ),
  );

  /**
   * Formats log messages based on the specified minimum and maximum log levels, includes the log level in the output, and pretty prints them.
   * @param levelConfigs - The log level configurations.
   * @returns The combined log formatter.
   */
  static filterThenPrettyPrintWithLevel = (levelConfigs: { min: keyof LogLevels, max?: keyof LogLevels }) => format.combine(
    LogFormatters.filterLevels(levelConfigs),
    format.timestamp(),
    format.printf(
      info => (
        (info.prefix)
          ? (info.data)
            ? `${gradient.mind(`${info.prefix}-[${info.level.toLocaleUpperCase()}]`)}-> ${info.message} ${yellowGradient(info.data as string)} -| ${ChronoFormatters.USTime(info.timestamp as Date)} |-`
            : `${gradient.mind(`${info.prefix}-[${info.level.toLocaleUpperCase()}]`)}-> ${info.message} -| ${ChronoFormatters.USTime(info.timestamp as Date)} |-`
          : (info.data)
            ? `${gradient.mind(`[${info.level.toLocaleUpperCase()}]`)}: ${info.message} ${yellowGradient(info.data as string)} -| ${ChronoFormatters.USTime(info.timestamp as Date)} |-`
            : `${gradient.mind(`[${info.level.toLocaleUpperCase()}]`)}: ${info.message} -| ${ChronoFormatters.USTime(info.timestamp as Date)} |-`),
    ),
  );
}

const { filterLevelsThenFormatForConsola, filterLevelsThenFormatAsJSON } = LogFormatters;

class ConsolaTransport extends transports.Console {
  log(info: { level: keyof typeof MagikLogTransportLevels['levels']; message: string; }, callback: () => void) {
    setImmediate(() => this.emit('logged', info));

    const { level, message, ...meta } = info;
    const formattedMessage = gradient.mind(message);

    if (level === 'error') {
      consola.error(formattedMessage);
      consola.trace(meta);
    } else if (level === 'warn') {
      consola.warn(formattedMessage);
    } else if (level === 'info') {
      consola.info(formattedMessage);
    } else if (level === 'verbose') {
      consola.info(formattedMessage);
    } else if (level === 'debug') {
      consola.debug(formattedMessage);
    } else if (level === 'success') {
      consola.success(formattedMessage);
    } else if (level === 'box') {
      if ('name' in meta && typeof meta.name === 'string') {
        MagikLogs.prototype._prettyLogBox(meta.name, message);
      } else {
        consola.box(formattedMessage);
      }
    } else if (level === 'internal') {
      consola.log(formattedMessage);
    }

    callback();
  }
}

class WebSocketTransport extends CustomTransport {
  wss: WebSocket.Server;

  constructor(options: any & { ws: WebSocket | WebSocket.Server }) {
    super(options);
    if (options.ws instanceof WebSocket) {
      this.wss = new WebSocket.Server({ server: options.ws });
    } else {
      this.wss = options.ws;
    }
    this.wss.on('connection', (ws) => {
      this.wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send('Client connected');
        }
      });
    });
  }

  log(info: { level: keyof typeof MagikLogTransportLevels['levels']; message: string; }, callback: () => void) {
    setImmediate(() => this.emit('logged', info));

    // Send the log message to all connected WebSocket clients
    this.wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(info.message);
      }
    });

    callback();
  }
}

export class MagikLogTransportLevels {
  public static levels = {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3,
    success: 4,
    verbose: 5,
    internal: 6,
    box: 7,
  }

  public static getLevel(level: MagikScribeLevels) {
    return this.levels[level]
  }

  public static getLevelName(level: number) {
    return (Object.keys(this.levels) as MagikScribeLevels[]).find(key => this.levels[key] === level)
  }

  public static setLevels(levels: Record<MagikScribeLevels, number>) {
    this.levels = levels
  }
}
type MagikScribeLevels = keyof typeof MagikLogTransportLevels.levels

type UniqueLogKeys = Exclude<MagikScribeLevels, keyof Logger>;
type UniqueLogMethods = Record<UniqueLogKeys, (message: string, meta?: unknown) => void>;

export class MagikLogger<ServiceName extends string = string> extends Logger implements UniqueLogMethods {
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
export class MagikLogs<Services extends Array<string> = Array<string>> {
  private services: Services = [] as unknown as Services;
  private scribeHall: Entity<MagikLogger, Services[number]> = new Entity();
  protected wsInstance?: WebSocket | WebSocket.Server;

  /** The transport levels for logging */
  private transportLevels = MagikLogTransportLevels.levels;

  /** Default options for log file */
  public static defaultLogFileOptions = {
    datePattern: 'MM-DD-YYYY', zippedArchive: true, maxSize: '20m', maxFiles: '14d',
  }

  private initializeTransports() {
    if (this.wsInstance) {
      this.devTransports.push(new WebSocketTransport({
        ws: this.wsInstance,
        format: filterLevelsThenFormatForConsola({ min: 'error', max: 'box' }),
      }));
    }
  }

  /** Development log transports. */
  public static devLogTransports: Array<ConsolaTransport | WebSocketTransport> = [
    new ConsolaTransport({
      format: filterLevelsThenFormatForConsola({ min: 'error', max: 'internal' }),
    }),
    new ConsolaTransport({
      level: 'box', format: filterLevelsThenFormatForConsola({ min: 'box', max: 'box' }),
    }),
  ]

  public get devTransports() {
    return MagikLogs.devLogTransports;
  }

  public set devTransports(devTransports: (ConsolaTransport | WebSocketTransport)[]) {
    MagikLogs.devLogTransports = devTransports;
  }

  static get ConsolaTransport() {
    return ConsolaTransport;
  }

  public get ConsolaTransportClass() {
    return ConsolaTransport;
  }

  /**
   * Constructs a new instance of MagikLogs.
   * @param {{ services: Array<string> }} options - The options for the MagikLogs instance.
   * @param {Services} options.services - The array of service names.
   * @param {WebSocket|WebSocket.Server} options.ws - The WebSocket instance to use for logging.
   */
  constructor({ services, ws }: { services: Services, ws?: WebSocket | WebSocket.Server }) {
    this.services = services;
    this.wsInstance = ws;
    this.initializeServices();
    this.initializeTransports()
  }

  /**
   * Initializes the services and creates default loggers for each service.
   * @private
   */
  private initializeServices() {
    this.services.forEach((service) => {
      this.scribeHall.add(service, this.createDefaultLogger({ service }));
    });
  }

  /**
   * Creates a default logger for a service.
   * @template Service - The type of the service.
   * @param {MagikLogOptions<Service>} opts - The options for the logger.
   * @returns {MagikLogger} The created logger.
   * @private
   */
  private createDefaultLogger<Service extends Services[number] = Services[number]>(opts: MagikLogOptions<Service>): MagikLogger<Service> {
    const { service, ...options } = opts;
    const productionTransports = [
      new DailyRotateFile({
        filename: `./logs/${service}/%DATE%/error-logs.log`,
        ...MagikLogs.defaultLogFileOptions,
        level: 'error',
        format: filterLevelsThenFormatAsJSON({ min: 'error' }),
      }),
      new DailyRotateFile({
        filename: `./logs/${service}/%DATE%/general-logs.log`,
        ...MagikLogs.defaultLogFileOptions,
        format: filterLevelsThenFormatAsJSON({ min: 'warn', max: 'debug' }),
      }),
    ] as TransportStream[];

    return createLogger({
      levels: this.transportLevels,
      defaultMeta: { service, ...options.defaultMeta },
      transports: (process.env.NODE_ENV === 'production') ? productionTransports : MagikLogs.devLogTransports,
    }) as MagikLogger<typeof service>;
  }

  /**
   * Gets the logger for a service.
   * @param {Services[number]} service - The name of the service.
   * @returns {MagikLogger | undefined} The logger for the service, or undefined if not found.
   */
  public get(service: Services[number]): MagikLogger | undefined {
    return this.scribeHall.get(service);
  }

  /**
   * Removes the logger for a service.
   * @param {Services[number]} service - The name of the service.
   * @returns {boolean} True if the logger was removed, false otherwise.
   */
  public remove(service: Services[number]): boolean {
    return this.scribeHall.remove(service);
  }

  /**
   * Adds a new service to the hall of scribes.
   * @param {Services[number]} service - The name of the service.
   */
  public add(service: Services[number]) {
    this.scribeHall.add(service, this.createDefaultLogger({ service }));
  }

  /**
   * Gets all the services in the hall of scribes.
   * @returns {Array<Services[number]>} The array of services.
   */
  public getAllServices() {
    return this.scribeHall.getAllIdentifiers();
  }

  /**
   * Gets all the loggers in the hall of scribes.
   * @returns {Record<Services[number], MagikLogger>} The record of loggers.
   */
  public getAllLoggers() {
    return this.scribeHall.getAllEntities();
  }

  public _prettyLogBox(title: string, message: string) {
    const cyanToPurple = gradient(['cyan', 'purple']);
    // Inform the user this may take a while
    consola.box({
      title: `${cyanToPurple(title)}`,
      badge: true,
      message,
      style: { padding: 2, borderColor: 'magenta', borderStyle: 'double', badge: 'magenta', valign: 'center' }
    });
  }
}
