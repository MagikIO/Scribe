import consola from 'consola';
import type { Server } from 'node:http';
import { transports } from 'winston';
import { LogUtils, type LogLevel } from './LogUtils';

export class ConsolaTransport extends transports.Console {
  log(info: { level: keyof typeof LogLevel; message: string; }, callback: () => void) {
    setImmediate(() => this.emit('logged', info));

    const { level, message, ...meta } = info;
    const formattedMessage = LogUtils.greenishGradient(message);

    if (level === 'error') {
      consola.error(formattedMessage);
      if ('includesTrace' in meta && meta.includesTrace) console.trace(meta);
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
        // Inform the user this may take a while
        consola.box({
          title: `${LogUtils.cyanToPurpleGradient(meta.name)}`,
          badge: true,
          message,
          style: { padding: 2, borderColor: 'magenta', borderStyle: 'double', badge: 'magenta', valign: 'center' }
        });
      } else {
        consola.box(formattedMessage);
      }
    } else if (level === 'internal') {
      consola.log(formattedMessage);
    }

    callback();
  }
}

export interface WebSocketTransportConfig {
  httpServer?: Server,
  debug?: boolean,
}
