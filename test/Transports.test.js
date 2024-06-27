import { describe, it, expect, vi, beforeEach } from 'vitest';
import consola from 'consola';
import { ConsolaTransport } from '../src/utils/Transports';

vi.mock('consola', () => ({
  ...vi.importActual('consola'),
  default: ({
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
    success: vi.fn(),
    log: vi.fn(),
  }),
  error: vi.fn(),
  warn: vi.fn(),
  info: vi.fn(),
  debug: vi.fn(),
  success: vi.fn(),
  box: vi.fn(),
  log: vi.fn(),
}));

vi.mock('../src/utils/LogUtils', () => ({
  LogUtils: {
    ...vi.importActual('../src/utils/LogUtils').LogUtils,
    greenishGradient: vi.fn(msg => `greenish-${msg}`),
    cyanToPurpleGradient: vi.fn(name => `gradient-${name}`),
  },
}));

describe('ConsolaTransport', () => {
  let transport

  beforeEach(() => {
    transport = new ConsolaTransport();
    vi.clearAllMocks();
  });

  it('logs error level with trace', () => {
    const mockCallback = vi.fn();
    transport.log({ level: 'error', message: 'Test Error', includesTrace: true }, mockCallback);
    expect(consola.error).toHaveBeenCalledWith('greenish-Test Error');
    expect(console.trace).toHaveBeenCalled();
    expect(mockCallback).toHaveBeenCalled();
  });

  // Additional tests for other log levels go here...
});
