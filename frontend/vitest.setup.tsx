import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
}));

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  },
}));

// Mock lucide-react icons - use importOriginal to get all actual exports
vi.mock('lucide-react', async (importOriginal) => {
  const actual = await importOriginal<any>();
  const icons: Record<string, any> = {};
  
  // Create mock components for all icons
  for (const key of Object.keys(actual)) {
    if (key !== 'default' && typeof actual[key] === 'function') {
      icons[key] = () => <svg data-testid={key} />;
    }
  }
  
  // Ensure X is included (used in Dialog)
  if (!icons.X) {
    icons.X = () => <svg data-testid="X" />;
  }
  
  return {
    ...actual,
    ...icons,
  };
});

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    section: ({ children, ...props }: any) => <section {...props}>{children}</section>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock @radix-ui/react-dialog
vi.mock('@radix-ui/react-dialog', () => ({
  Root: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  Trigger: ({ children, ...props }: any) => <>{children}</>,
  Portal: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  Close: ({ ...props }: any) => <button {...props} />,
  Overlay: ({ ...props }: any) => <div {...props} />,
  Content: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  Header: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  Footer: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  Title: ({ children, ...props }: any) => <h2 {...props}>{children}</h2>,
  Description: ({ children, ...props }: any) => <p {...props}>{children}</p>,
}));

vi.mock('@radix-ui/react-dropdown-menu', () => ({
  DropdownMenu: ({ children }: any) => <>{children}</>,
  DropdownMenuTrigger: ({ children }: any) => <>{children}</>,
  DropdownMenuContent: ({ children }: any) => <div>{children}</div>,
  DropdownMenuItem: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  DropdownMenuSeparator: () => <hr />,
  DropdownMenuLabel: ({ children }: any) => <span>{children}</span>,
}));

vi.mock('@radix-ui/react-select', () => ({
  Select: ({ children }: any) => <>{children}</>,
  SelectTrigger: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  SelectContent: ({ children }: any) => <div>{children}</div>,
  SelectItem: ({ children, value, ...props }: any) => <button value={value} {...props}>{children}</button>,
  SelectValue: ({ placeholder }: any) => <span>{placeholder}</span>,
}));

vi.mock('@radix-ui/react-tabs', () => ({
  Tabs: ({ children, defaultValue, onValueChange }: any) => <div>{children}</div>,
  TabsList: ({ children }: any) => <div>{children}</div>,
  TabsTrigger: ({ children, value, ...props }: any) => <button value={value} {...props}>{children}</button>,
  TabsContent: ({ children, value, ...props }: any) => <div {...props}>{children}</div>,
}));

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn((key: string) => {
    if (key === 'access_token') return 'mock-token';
    return null;
  }),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// Mock window.location
Object.defineProperty(window, 'location', {
  value: {
    origin: 'http://localhost:3000',
    href: 'http://localhost:3000',
    reload: vi.fn(),
  },
  writable: true,
});

// Mock navigator.clipboard
Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: vi.fn().mockResolvedValue(undefined),
  },
  writable: true,
});

// Global test utilities
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Suppress console.error in tests unless needed
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (
      args[0]?.includes?.('Warning: ReactDOM.render is no longer supported') ||
      args[0]?.includes?.('act(...)') ||
      args[0]?.includes?.('Warning: An update to')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});