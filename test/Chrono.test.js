import { describe, it, expect } from 'vitest';
import ChronoFormatters from '../src/utils/Chrono';

describe('ChronoFormatters', () => {
  describe('USDate Method', () => {
    it('formats date without seconds', () => {
      const date = new Date('2023-01-01T12:00:00Z');
      const formattedDate = ChronoFormatters.USDate(date);
      expect(formattedDate).toMatch(/\d{2}\/\d{2}\/\d{4}, \d{2}:\d{2} AM/);
    });

    it('formats date with seconds', () => {
      const date = new Date('2023-01-01T12:00:00Z');
      const formattedDate = ChronoFormatters.USDate(date, true);
      expect(formattedDate).toMatch(/\d{2}\/\d{2}\/\d{4}, \d{2}:\d{2}:\d{2} AM/);
    });
  });

  describe('USTime Method', () => {
    it('formats time without seconds', () => {
      const date = new Date('2023-01-01T12:00:00Z');
      const formattedTime = ChronoFormatters.USTime(date);
      expect(formattedTime).toMatch(/\d{1,2}:\d{2} AM/);
    });

    it('formats time with seconds', () => {
      const date = new Date('2023-01-01T12:00:00Z');
      const formattedTime = ChronoFormatters.USTime(date, true);
      expect(formattedTime).toMatch(/\d{1,2}:\d{2}:\d{2} AM/);
    });
  });
});
