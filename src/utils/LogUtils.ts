import gradient from 'gradient-string';

export enum LogLevel {
  error = 0,
  warn,
  info,
  debug,
  success,
  verbose,
  internal,
  box,
}

export const LogLevelRecord = {
  error: LogLevel.error,
  warn: LogLevel.warn,
  info: LogLevel.info,
  debug: LogLevel.debug,
  success: LogLevel.success,
  verbose: LogLevel.verbose,
  internal: LogLevel.internal,
  box: LogLevel.box,
}

export class LogUtils {
  public static getLevelName(level: LogLevel): string {
    return LogLevel[level];
  }

  public static getLevel(level: keyof typeof LogLevel | string): LogLevel {
    if (typeof level !== 'string') throw new Error(`LogLevel expected a string, but got ${typeof level}`);
    level = level.toLowerCase();
    // If it's a string lets check if it's a valid log level
    const levelNames = Object.keys(LogLevel).filter(key => isNaN(Number(key)));
    if (!levelNames.includes(level)) throw new Error(`Invalid log level: ${level}`);
    return LogLevel[level as keyof typeof LogLevel];
  }

  public static greenGradient = gradient([
    { color: '#00FF00', pos: 0 },
    { color: '#00e500', pos: 0.5 },
    { color: '#00cc00', pos: 1 },
  ])

  public static yellowGradient = gradient([
    { color: '#FFFF66', pos: 0 },
    { color: '#FFFF00', pos: 0.25 },
    { color: '#e5e500', pos: 0.5 },
    { color: '#cccc00', pos: 1 },
  ])

  public static cyanToPurpleGradient = gradient(['cyan', 'purple']);

  public static bluishGradient = gradient.cristal;
  public static greenishGradient = gradient.mind;
}
