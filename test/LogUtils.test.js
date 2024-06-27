import { describe, it, expect } from 'vitest';
import { LogUtils, LogLevel } from '../src/utils/LogUtils';

describe('LogUtils', () => {
  describe('getLevelName', () => {
    it('should return the level name for a given LogLevel', () => {
      expect(LogUtils.getLevelName(LogLevel.error)).toBe('error');
      expect(LogUtils.getLevelName(LogLevel.warn)).toBe('warn');
      expect(LogUtils.getLevelName(LogLevel.info)).toBe('info');
      expect(LogUtils.getLevelName(LogLevel.debug)).toBe('debug');
      expect(LogUtils.getLevelName(LogLevel.success)).toBe('success');
      expect(LogUtils.getLevelName(LogLevel.verbose)).toBe('verbose');
      expect(LogUtils.getLevelName(LogLevel.internal)).toBe('internal');
      expect(LogUtils.getLevelName(LogLevel.box)).toBe('box');
    });
  });

  describe('getLevel', () => {
    it('should return the LogLevel for a valid level name', () => {
      expect(LogUtils.getLevel('error')).toBe(LogLevel.error);
      expect(LogUtils.getLevel('warn')).toBe(LogLevel.warn);
      expect(LogUtils.getLevel('info')).toBe(LogLevel.info);
      expect(LogUtils.getLevel('debug')).toBe(LogLevel.debug);
      expect(LogUtils.getLevel('success')).toBe(LogLevel.success);
      expect(LogUtils.getLevel('verbose')).toBe(LogLevel.verbose);
      expect(LogUtils.getLevel('internal')).toBe(LogLevel.internal);
      expect(LogUtils.getLevel('box')).toBe(LogLevel.box);
    });

    it('should throw an error for an invalid level name', () => {
      expect(() => LogUtils.getLevel('invalid')).toThrowError('Invalid log level: invalid');
    });

    it('should throw an error if level is not a string', () => {
      expect(() => LogUtils.getLevel(123)).toThrowError('LogLevel expected a string, but got number');
    });
  });
});
