/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { FxService } from './fx.service';

describe('FxService', () => {
  let service: FxService;
  const mockRedis = {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
  } as unknown as import('ioredis').default;
  const mockPrisma = {
    fxDailyRate: {
      findUnique: jest.fn().mockResolvedValue(null),
      findFirst: jest.fn().mockResolvedValue(null),
      upsert: jest.fn().mockResolvedValue({}),
    },
  } as unknown as import('../prisma/prisma.service').PrismaService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new FxService(mockPrisma, mockRedis);
    // Force memory to fixed to avoid API calls
    (service as any).memoryRates = null;
    (service as any).memoryDate = null;
  });

  it('should return 1 for same currency', async () => {
    expect(await service.getRate('USD', 'USD')).toBe(1);
    expect(await service.getRate('INR', 'INR')).toBe(1);
  });

  it('should convert using fixed fallback when no cache/DB/API', async () => {
    // Mock fetch to fail
    const originalFetch = global.fetch;
    (global as any).fetch = jest.fn().mockRejectedValue(new Error('network'));
    // Ensure DB/Redis empty
    (mockPrisma.fxDailyRate.findFirst as jest.Mock).mockResolvedValue(null);
    // Trigger refresh which will fallback to fixed
    const rate = await service.getRate('USD', 'INR');
    expect(rate).toBe(100);
    expect(await service.getRate('INR', 'USD')).toBeCloseTo(0.01, 5);
    (global as any).fetch = originalFetch;
  });

  it('should compute cross rates via USD base', () => {
    // Force fixed rates via direct memory
    (service as any).memoryRates = {
      USD: 1,
      INR: 100,
      EUR: 0.92,
      GBP: 0.8,
      AED: 3.67,
      SAR: 3.75,
    };
    (service as any).memoryDate = new Date().toLocaleDateString('en-CA', {
      timeZone: 'Asia/Kolkata',
    });
    expect(service.getRateSync('EUR', 'INR')).toBeCloseTo(100 / 0.92, 4);
    expect(service.getRateSync('GBP', 'AED')).toBeCloseTo(3.67 / 0.8, 4);
  });

  it('convertCents should round correctly', async () => {
    (service as any).memoryRates = {
      USD: 1,
      INR: 100,
      GBP: 0.8,
      EUR: 0.92,
      AED: 3.67,
      SAR: 3.75,
    };
    (service as any).memoryDate = new Date().toLocaleDateString('en-CA', {
      timeZone: 'Asia/Kolkata',
    });
    expect(await service.convertCents(10000, 'USD', 'INR')).toBe(1000000); // $100 -> ₹10000
    expect(await service.convertCents(1000000, 'INR', 'USD')).toBe(10000);
  });

  it('should handle Redis failure gracefully', async () => {
    const failingRedis = {
      get: jest.fn().mockRejectedValue(new Error('redis down')),
      set: jest.fn().mockRejectedValue(new Error('redis down')),
    } as unknown as import('ioredis').default;
    const svc = new FxService(mockPrisma, failingRedis);
    (svc as any).memoryRates = {
      USD: 1,
      INR: 100,
      EUR: 0.92,
      GBP: 0.8,
      AED: 3.67,
      SAR: 3.75,
    };
    (svc as any).memoryDate = new Date().toLocaleDateString('en-CA', {
      timeZone: 'Asia/Kolkata',
    });
    expect(await svc.getRate('USD', 'INR')).toBe(100);
  });
});
