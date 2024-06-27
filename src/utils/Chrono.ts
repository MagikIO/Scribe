import { format } from 'winston';

export default class ChronoFormatters {
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
    const config: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit' };
    if (includeSeconds) config.second = 'numeric';
    return new Date(date).toLocaleTimeString('en-US', config);
  };

  static USDateFormatter = format(info => ({
    ...info,
    timestamp: ChronoFormatters.USDate(info.timestamp as Date),
  }));
}
