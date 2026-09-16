import { render, screen } from '@testing-library/react';
import { MockedProvider, MockedResponse } from '@apollo/client/testing';
import { gql } from '@apollo/client';
import { describe, it, expect } from 'vitest';

import PortfolioDetailPage from '@/app/(dashboard)/portfolio/[slug]/page';

const PORTFOLIO_DETAIL_QUERY = gql`
  query GetPortfolioDetail($slug: String!) {
    me {
      id
      username
      cashBalance
      lockedBalance
    }
    portfolioBySlug(slug: $slug) {
      id
      name
      description
      performance
      isPublic
      shareSlug
      userId
      positions {
        id
        symbol
        quantity
        currentPrice
        averagePurchasePrice
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
    query: PORTFOLIO_DETAIL_QUERY,
    variables: { slug: 'Test Portfolio' },
  },
  result: {
    data: {
      me: {
        __typename: 'User',
        id: 'user-1',
        username: 'testuser',
        cashBalance: 5000,
        lockedBalance: 500,
      },
      portfolioBySlug: {
        __typename: 'Portfolio',
        id: 'portfolio-1',
        name: 'Cartera de prueba',
        description: 'Estrategia de prueba',
        performance: 10.5,
        isPublic: false,
        shareSlug: 'Test Portfolio',
        userId: 'user-1',
        positions: [
          {
            __typename: 'Position',
            id: 'position-1',
            symbol: 'AAPL',
            quantity: 2,
            currentPrice: 175,
            averagePurchasePrice: 150,
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

describe('PortfolioDetailPage', () => {
  it('renders the portfolioBySlug response for the authenticated owner', async () => {
    render(
      <MockedProvider mocks={[mockResponse]} addTypename={false}>
        <PortfolioDetailPage />
      </MockedProvider>,
    );

    expect(await screen.findByRole('heading', { name: 'Cartera de prueba' })).toBeInTheDocument();
    expect(screen.getByText('Estrategia de prueba')).toBeInTheDocument();
    expect(screen.getByText('Transacciones')).toBeInTheDocument();
    expect(screen.getAllByText('AAPL')).toHaveLength(2);
  });
});
