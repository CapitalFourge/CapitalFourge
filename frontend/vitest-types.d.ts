import '@testing-library/jest-dom';
import { vi, beforeAll, afterAll } from 'vitest';

// Type augmentation for @testing-library/jest-dom matchers
declare module 'vitest' {
  interface Assertion<T = unknown> {
    toBeInTheDocument(): T;
    toHaveTextContent(text: string | RegExp): T;
  }
}