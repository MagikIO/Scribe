import { format } from 'winston';
import ChronoFormatters from './Chrono';
import { LogUtils, LogLevel } from './LogUtils';

type LogLevelRange = { min: keyof typeof LogLevel, max?: keyof typeof LogLevel };
const { greenishGradient, bluishGradient, greenGradient, yellowGradient } = LogUtils;

/**
 * Class containing various log formatters.
 */
export class LogFormatters {
  /** Formats log messages based on the specified minimum and maximum log levels */
  static filterLevels = format((info, { min, max }: LogLevelRange) => {
    const minLevel = LogUtils.getLevel(min);
    const maxLevel = LogUtils.getLevel(max ?? 'Internal');

    if (info.level) {
      const level = LogUtils.getLevel(info.level);
      if (level >= minLevel && level <= maxLevel) return info;
    }

    return false;
  });

  static filterLevelsThenFormatForConsola = (levelConfigs: LogLevelRange) => format.combine(LogFormatters.filterLevels(levelConfigs))

  /**
   * Formats log messages based on the specified minimum and maximum log levels, and converts them to JSON format.
   * @param levelConfigs - The log level configurations.
   * @returns The combined log formatter.
   */
  static filterLevelsThenFormatAsJSON = (levelConfigs: LogLevelRange) => format.combine(
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
  static filterThenPrettyPrint = (levelConfigs: LogLevelRange) => format.combine(
    LogFormatters.filterLevels(levelConfigs),
    format.timestamp(),
    format.printf(
      ({ prefix, message, timestamp, data, dontTimestamp }) => {
        let response = '';
        if (prefix) response += `${greenishGradient(prefix as string)} -> `;
        response += (prefix) ? `${bluishGradient(message as string)}` : `${greenishGradient(message as string)}`;
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
  static filterThenPrettyPrintWithLevel = (levelConfigs: LogLevelRange) => format.combine(
    LogFormatters.filterLevels(levelConfigs),
    format.timestamp(),
    format.printf(
      info => (
        (info.prefix)
          ? (info.data)
            ? `${greenishGradient(`${info.prefix}-[${info.level.toLocaleUpperCase()}]`)}-> ${info.message} ${yellowGradient(info.data as string)} -| ${ChronoFormatters.USTime(info.timestamp as Date)} |-`
            : `${greenishGradient(`${info.prefix}-[${info.level.toLocaleUpperCase()}]`)}-> ${info.message} -| ${ChronoFormatters.USTime(info.timestamp as Date)} |-`
          : (info.data)
            ? `${greenishGradient(`[${info.level.toLocaleUpperCase()}]`)}: ${info.message} ${yellowGradient(info.data as string)} -| ${ChronoFormatters.USTime(info.timestamp as Date)} |-`
            : `${greenishGradient(`[${info.level.toLocaleUpperCase()}]`)}: ${info.message} -| ${ChronoFormatters.USTime(info.timestamp as Date)} |-`),
    ),
  );
}
