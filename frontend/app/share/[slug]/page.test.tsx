import { render, screen } from '@testing-library/react';
import { MockedProvider, MockedResponse } from '@apollo/client/testing';
import { gql } from '@apollo/client';
import { describe, it, expect, vi } from 'vitest';

vi.mock('next/navigation', () => ({
  useParams: () => ({ slug: 'test-portfolio' }),
}));

import SharedPortfolioPage from '@/app/share/[slug]/page';

const GET_SHARED_PORTFOLIO = gql`
  query GetSharedPortfolio($slug: String!) {
    sharedPortfolio(slug: $slug) {
      id
      name
      description
      performance
      isPublic
      positions {
        id
        symbol
        quantity
        averagePurchasePrice
        currentPrice
      }
      transactions {
        id
        symbol
        type
        quantity
        price
        totalAmount
        timestamp
      }
    }
  }
`;

const mockResponse: MockedResponse = {
  request: {
    query: GET_SHARED_PORTFOLIO,
    variables: { slug: 'test-portfolio' },
  },
  result: {
    data: {
      sharedPortfolio: {
        __typename: 'Portfolio',
        id: 'portfolio-1',
        name: 'Cartera pública',
        description: 'Estrategia pública',
        performance: 12.5,
        isPublic: true,
        positions: [
          {
            __typename: 'Position',
            id: 'position-1',
            symbol: 'AAPL',
            quantity: 2,
            averagePurchasePrice: 150,
            currentPrice: 175,
          },
        ],
        transactions: [
          {
            __typename: 'Transaction',
            id: 'transaction-1',
            symbol: 'AAPL',
            type: 'BUY',
            quantity: 2,
            price: 150,
            totalAmount: 300,
            timestamp: '2026-09-15T10:00:00Z',
          },
        ],
      },
    },
  },
};

describe('SharedPortfolioPage', () => {
  it('renders public positions and transactions', async () => {
    render(
      <MockedProvider mocks={[mockResponse]} addTypename={false}>
        <SharedPortfolioPage />
      </MockedProvider>,
    );

    expect(await screen.findByRole('heading', { name: 'Cartera pública' })).toBeInTheDocument();
    expect(screen.getByText('Movimientos')).toBeInTheDocument();
    expect(screen.getByText('Compra')).toBeInTheDocument();
    expect(screen.getAllByText('AAPL').length).toBeGreaterThan(0);
  });
});
