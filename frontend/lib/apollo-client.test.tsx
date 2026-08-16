import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { TypePolicies } from '@apollo/client/cache';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// Mock process.env
vi.stubGlobal('process', {
  env: {
    NEXT_PUBLIC_API_BASE_URL: 'http://localhost:8080',
  },
});

// We'll test the typePolicies configuration directly
import { typePolicies } from '@/lib/apollo-client';

// Helper to safely access FieldPolicy merge property
function getMerge(field: unknown): unknown {
  return (field as Record<string, unknown>)?.merge;
}

describe('Apollo Client TypePolicies Configuration (FU-01)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue('test-token');
  });

  it('should export typePolicies configuration', () => {
    expect(typePolicies).toBeDefined();
  });

  describe('Query typePolicy', () => {
    it('should have me field with merge: false', () => {
      expect(typePolicies.Query).toBeDefined();
      expect(typePolicies.Query?.fields?.me).toBeDefined();
      expect(getMerge(typePolicies.Query?.fields?.me)).toBe(false);
    });

    it('should have portfolios field with merge function', () => {
      expect(typePolicies.Query?.fields?.portfolios).toBeDefined();
      expect(typeof getMerge(typePolicies.Query?.fields?.portfolios)).toBe('function');
    });

    it('should have assetMovers field with merge function', () => {
      expect(typePolicies.Query?.fields?.assetMovers).toBeDefined();
      expect(typeof getMerge(typePolicies.Query?.fields?.assetMovers)).toBe('function');
    });
  });

  describe('User typePolicy', () => {
    it('should have keyFields: ["id"]', () => {
      expect(typePolicies.User?.keyFields).toEqual(['id']);
    });

    it('should have cashBalance with merge: false', () => {
      expect(typePolicies.User?.fields?.cashBalance).toBeDefined();
      expect(getMerge(typePolicies.User?.fields?.cashBalance)).toBe(false);
    });

    it('should have lockedBalance with merge: false', () => {
      expect(typePolicies.User?.fields?.lockedBalance).toBeDefined();
      expect(getMerge(typePolicies.User?.fields?.lockedBalance)).toBe(false);
    });
  });

  describe('Portfolio typePolicy', () => {
    it('should have keyFields: ["id"]', () => {
      expect(typePolicies.Portfolio?.keyFields).toEqual(['id']);
    });

    it('should have positions with merge function', () => {
      expect(typePolicies.Portfolio?.fields?.positions).toBeDefined();
      expect(typeof getMerge(typePolicies.Portfolio?.fields?.positions)).toBe('function');
    });

    it('should have performance with merge: false', () => {
      expect(typePolicies.Portfolio?.fields?.performance).toBeDefined();
      expect(getMerge(typePolicies.Portfolio?.fields?.performance)).toBe(false);
    });
  });

  describe('Position typePolicy', () => {
    it('should have keyFields: ["id", "symbol"]', () => {
      expect(typePolicies.Position?.keyFields).toEqual(['id', 'symbol']);
    });

    it('should have currentPrice with merge: false', () => {
      expect(typePolicies.Position?.fields?.currentPrice).toBeDefined();
      expect(getMerge(typePolicies.Position?.fields?.currentPrice)).toBe(false);
    });
  });
});