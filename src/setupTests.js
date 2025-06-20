import '@testing-library/jest-dom';

// Mock fetch globally
global.fetch = jest.fn();

// Mock react-plaid-link
jest.mock('react-plaid-link', () => ({
  usePlaidLink: jest.fn(),
}));