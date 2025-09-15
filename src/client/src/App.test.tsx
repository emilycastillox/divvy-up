import { render, screen } from '@testing-library/react';
import App from './App';

describe('App', () => {
  it('renders without crashing', () => {
    render(<App />);
    expect(screen.getByText('DivvyUp')).toBeInTheDocument();
  });

  it('displays the welcome message', () => {
    render(<App />);
    expect(screen.getByText('Expense Splitting Made Easy')).toBeInTheDocument();
  });

  it('shows setup message', () => {
    render(<App />);
    expect(screen.getByText(/Welcome to DivvyUp!/)).toBeInTheDocument();
  });
});
