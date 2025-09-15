import { render, screen } from '@testing-library/react';
import App from './App';

// Mock the API client to avoid network calls in tests
jest.mock('./services/api', () => ({
  apiClient: {
    getCurrentUser: jest.fn().mockResolvedValue({
      success: true,
      data: { user: null }
    }),
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
  }
}));

describe('App', () => {
  it('renders without crashing', () => {
    render(<App />);
    expect(screen.getAllByText('DivvyUp')[0]).toBeInTheDocument();
  });

  it('renders welcome page by default when not authenticated', () => {
    render(<App />);
    const welcomeElement = screen.getByText(/Welcome to DivvyUp/i);
    expect(welcomeElement).toBeInTheDocument();
  });

  it('has navigation links', () => {
    render(<App />);
    const signUpLinks = screen.getAllByText(/Sign up/i);
    expect(signUpLinks.length).toBeGreaterThan(0);
  });
});
