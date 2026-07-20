"""
Tests for OpenBBClient - Fundamental, Macro, and Alternative Data
"""
import pytest
from unittest.mock import Mock, patch, MagicMock
import sys
import os

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

from src.infrastructure.openbb_client import (
    OpenBBClient,
    get_openbb_client,
    get_profile,
    get_fundamentals,
    get_ratios,
    get_earnings,
    get_dividends,
    get_fred_series,
    get_treasury_rates,
    get_etf_holdings,
    get_insider_transactions,
    get_institutional_ownership,
    get_short_interest,
    get_analyst_ratings,
    get_options_chains,
    get_options_greeks,
    get_options_snapshots,
    get_options_surface,
    get_unusual_options_activity,
    get_put_call_ratio,
    get_max_pain,
)


class TestOpenBBClient:
    """Test OpenBBClient functionality."""

    @pytest.fixture
    def client(self):
        """Create a fresh client instance for each test."""
        return OpenBBClient(use_cache=True)

    @pytest.fixture
    def client_no_cache(self):
        """Create a client without cache."""
        return OpenBBClient(use_cache=False)

    @pytest.fixture
    def mock_obb(self):
        """Mock the OpenBB obb object."""
        with patch('src.infrastructure.openbb_client.obb') as mock:
            yield mock

    def test_init(self, client):
        """Test client initialization."""
        assert client.use_cache is True
        assert client.CACHE_TTL == 300
        assert client._cache == {}

    def test_init_no_cache(self, client_no_cache):
        """Test client initialization without cache."""
        assert client_no_cache.use_cache is False

    def test_cache_validity(self, client):
        """Test cache TTL validation."""
        import time
        # Valid cache entry
        client._cache['test'] = ('data', time.time())
        assert client._is_cache_valid(client._cache['test']) is True

        # Expired cache entry
        client._cache['expired'] = ('data', time.time() - 400)
        assert client._is_cache_valid(client._cache['expired']) is False

        # None entry
        assert client._is_cache_valid(None) is False

    def test_get_cached(self, client):
        """Test cache retrieval."""
        import time
        client._cache['key'] = ('cached_data', time.time())
        assert client._get_cached('key') == 'cached_data'

        # Non-existent key
        assert client._get_cached('nonexistent') is None

        # Expired key
        client._cache['expired'] = ('data', time.time() - 400)
        assert client._get_cached('expired') is None

    def test_get_cached_no_cache(self, client_no_cache):
        """Test cache retrieval when cache is disabled."""
        import time
        client_no_cache._cache['key'] = ('cached_data', time.time())
        assert client_no_cache._get_cached('key') is None

    def test_set_cache(self, client):
        """Test cache setting."""
        client._set_cache('key', 'value')
        assert 'key' in client._cache
        assert client._cache['key'][0] == 'value'

    def test_set_cache_no_cache(self, client_no_cache):
        """Test cache setting when cache is disabled."""
        client_no_cache._set_cache('key', 'value')
        assert 'key' not in client_no_cache._cache

    def test_execute_query_success(self, client, mock_obb):
        """Test successful query execution."""
        mock_result = Mock()
        mock_result.to_df.return_value.to_dict.return_value = [{'col': 'val'}]
        mock_obb.equity.profile.return_value = mock_result

        result = client._execute_query(mock_obb.equity.profile, symbol='AAPL')
        assert result == [{'col': 'val'}]

    def test_execute_query_error(self, client, mock_obb):
        """Test query execution with error."""
        mock_obb.equity.profile.side_effect = Exception("API Error")

        result = client._execute_query(mock_obb.equity.profile, symbol='AAPL')
        assert result is None

    def test_get_company_profile(self, client, mock_obb):
        """Test get_company_profile."""
        mock_result = Mock()
        mock_result.to_df.return_value.to_dict.return_value = [
            {'symbol': 'AAPL', 'name': 'Apple Inc.', 'sector': 'Technology'}
        ]
        mock_obb.equity.profile.return_value = mock_result

        result = client.get_company_profile('AAPL')
        assert isinstance(result, list)
        assert len(result) > 0
        assert result[0]['symbol'] == 'AAPL'
        assert result[0]['name'] == 'Apple Inc.'

    def test_get_fundamentals(self, client, mock_obb):
        """Test get_fundamentals."""
        mock_result = Mock()
        mock_result.to_df.return_value.to_dict.return_value = [
            {'date': '2023-12-31', 'revenue': 383285000000}
        ]
        mock_obb.equity.fundamental.return_value = mock_result

        result = client.get_fundamentals('AAPL', 'annual')
        assert isinstance(result, list)

    def test_get_ratios(self, client, mock_obb):
        """Test get_ratios."""
        mock_result = Mock()
        mock_result.to_df.return_value.to_dict.return_value = [
            {'date': '2023-12-31', 'pe_ratio': 28.5, 'roe': 0.15}
        ]
        mock_obb.equity.fundamental.ratios.return_value = mock_result

        result = client.get_ratios('AAPL', 'annual')
        assert isinstance(result, list)

    def test_get_earnings(self, client, mock_obb):
        """Test get_earnings."""
        mock_result = Mock()
        mock_result.to_df.return_value.to_dict.return_value = [
            {'date': '2023-10-30', 'eps_actual': 1.46, 'eps_estimate': 1.39}
        ]
        mock_obb.equity.fundamental.earnings.return_value = mock_result

        result = client.get_earnings('AAPL', limit=4)
        assert isinstance(result, list)

    def test_get_dividends(self, client, mock_obb):
        """Test get_dividends."""
        mock_result = Mock()
        mock_result.to_df.return_value.to_dict.return_value = [
            {'date': '2023-11-09', 'amount': 0.24}
        ]
        mock_obb.equity.price.dividends.return_value = mock_result

        result = client.get_dividends('AAPL', limit=10)
        assert isinstance(result, list)

    def test_get_fred_series(self, client, mock_obb):
        """Test get_fred_series."""
        mock_result = Mock()
        mock_result.to_df.return_value.to_dict.return_value = [
            {'date': '2023-12-01', 'value': 3.7}
        ]
        mock_obb.economy.fred.return_value = mock_result

        result = client.get_fred_series('UNRATE')
        assert isinstance(result, list)

    def test_get_treasury_rates(self, client, mock_obb):
        """Test get_treasury_rates."""
        mock_result = Mock()
        mock_result.to_df.return_value.to_dict.return_value = [
            {'date': '2023-12-01', 'yield': 4.5}
        ]
        mock_obb.economy.treasury.return_value = mock_result

        result = client.get_treasury_rates('10y')
        assert isinstance(result, list)

    def test_get_etf_holdings(self, client, mock_obb):
        """Test get_etf_holdings."""
        mock_result = Mock()
        mock_result.to_df.return_value.to_dict.return_value = [
            {'symbol': 'AAPL', 'weight': 0.07}
        ]
        mock_obb.etf.holdings.return_value = mock_result

        result = client.get_etf_holdings('SPY')
        assert isinstance(result, list)

    def test_get_insider_transactions(self, client, mock_obb):
        """Test get_insider_transactions."""
        mock_result = Mock()
        mock_result.to_df.return_value.to_dict.return_value = [
            {'insider': 'Tim Cook', 'shares': 10000, 'date': '2023-11-01'}
        ]
        mock_obb.equity.ownership.insider.return_value = mock_result

        result = client.get_insider_transactions('AAPL', limit=10)
        assert isinstance(result, list)

    def test_get_institutional_ownership(self, client, mock_obb):
        """Test get_institutional_ownership."""
        mock_result = Mock()
        mock_result.to_df.return_value.to_dict.return_value = [
            {'institution': 'Vanguard', 'shares': 1000000}
        ]
        mock_obb.equity.ownership.institutional.return_value = mock_result

        result = client.get_institutional_ownership('AAPL', limit=10)
        assert isinstance(result, list)

    def test_get_short_interest(self, client, mock_obb):
        """Test get_short_interest."""
        mock_result = Mock()
        mock_result.to_df.return_value.to_dict.return_value = [
            {'date': '2023-11-15', 'short_interest': 5000000}
        ]
        mock_obb.equity.short_interest.return_value = mock_result

        result = client.get_short_interest('AAPL')
        assert isinstance(result, list)

    def test_get_analyst_ratings(self, client, mock_obb):
        """Test get_analyst_ratings."""
        mock_result = Mock()
        mock_result.to_df.return_value.to_dict.return_value = [
            {'analyst': 'Morgan Stanley', 'rating': 'Buy', 'target': 200}
        ]
        mock_obb.equity.estimates.return_value = mock_result

        result = client.get_analyst_ratings('AAPL')
        assert isinstance(result, list)


class TestOpenBBClientOptions:
    """Test OpenBBClient options/alternative data methods."""

    @pytest.fixture
    def client(self):
        return OpenBBClient(use_cache=False)

    @pytest.fixture
    def mock_obb(self):
        with patch('src.infrastructure.openbb_client.obb') as mock:
            yield mock

    def test_get_options_chains(self, client, mock_obb):
        """Test get_options_chains."""
        mock_result = Mock()
        mock_result.to_df.return_value.to_dict.return_value = [
            {'symbol': 'AAPL240119C00150000', 'strike': 150, 'option_type': 'call',
             'expiration': '2024-01-19', 'delta': 0.55, 'gamma': 0.02,
             'theta': -0.05, 'vega': 0.15, 'implied_volatility': 0.25,
             'bid': 2.50, 'ask': 2.55, 'volume': 100, 'open_interest': 500}
        ]
        mock_obb.derivatives.options.chains.return_value = mock_result

        result = client.get_options_chains('AAPL')
        assert isinstance(result, list)
        assert len(result) > 0
        assert result[0]['strike'] == 150

    def test_get_options_greeks(self, client, mock_obb):
        """Test get_options_greeks."""
        mock_result = Mock()
        mock_result.to_df.return_value.to_dict.return_value = [
            {'symbol': 'AAPL240119C00150000', 'strike': 150, 'option_type': 'call',
             'expiration': '2024-01-19', 'delta': 0.55, 'gamma': 0.02,
             'theta': -0.05, 'vega': 0.15, 'implied_volatility': 0.25,
             'bid': 2.50, 'ask': 2.55}
        ]
        mock_obb.derivatives.options.chains.return_value = mock_result

        result = client.get_options_greeks('AAPL', expiration='2024-01-19')
        assert isinstance(result, list)
        assert 'delta' in result[0]
        assert 'mid' in result[0]

    def test_get_options_snapshots(self, client, mock_obb):
        """Test get_options_snapshots."""
        mock_result = Mock()
        mock_result.to_df.return_value.to_dict.return_value = [
            {'underlying_symbol': 'AAPL', 'contract_symbol': 'AAPL240119C00150000',
             'strike': 150, 'option_type': 'call', 'volume': 100, 'open_interest': 500}
        ]
        mock_obb.derivatives.options.snapshots.return_value = mock_result

        result = client.get_options_snapshots()
        assert isinstance(result, list)

    def test_get_options_surface(self, client, mock_obb):
            """Test get_options_surface."""
            mock_result = Mock()
            mock_result.to_df.return_value.to_dict.return_value = [
                {'strike': 150, 'dte': 30, 'implied_volatility': 0.25}
            ]
            mock_obb.derivatives.options.surface.return_value = mock_result
        
            chains_data = [{'strike': 150, 'expiration': '2024-01-19', 'option_type': 'call',
                            'implied_volatility': 0.25, 'dte': 30}]
            result = client.get_options_surface(chains_data)
            assert result is not None
            assert isinstance(result, (dict, list))

    def test_get_unusual_options_activity(self, client, mock_obb):
        """Test get_unusual_options_activity."""
        mock_result = Mock()
        mock_result.to_df.return_value.to_dict.return_value = [
            {'symbol': 'AAPL', 'volume': 5000, 'open_interest': 1000,
             'type': 'sweep', 'premium': 500000}
        ]
        mock_obb.derivatives.options.unusual.return_value = mock_result

        result = client.get_unusual_options_activity('AAPL')
        assert isinstance(result, list)

    def test_get_put_call_ratio(self, client, mock_obb):
        """Test get_put_call_ratio."""
        mock_result = Mock()
        mock_result.to_df.return_value.to_dict.return_value = [
            {'symbol': 'AAPL240119C00150000', 'option_type': 'call', 'volume': 100, 'open_interest': 500},
            {'symbol': 'AAPL240119P00150000', 'option_type': 'put', 'volume': 80, 'open_interest': 400},
        ]
        mock_obb.derivatives.options.chains.return_value = mock_result

        result = client.get_put_call_ratio('AAPL')
        assert 'ratio' in result
        assert 'volume_ratio' in result
        assert 'oi_ratio' in result
        assert result['puts'] == 1
        assert result['calls'] == 1

    def test_get_max_pain(self, client, mock_obb):
        """Test get_max_pain."""
        mock_result = Mock()
        mock_result.to_df.return_value.to_dict.return_value = [
            {'symbol': 'AAPL240119C00145000', 'strike': 145, 'option_type': 'call', 'open_interest': 1000},
            {'symbol': 'AAPL240119P00145000', 'strike': 145, 'option_type': 'put', 'open_interest': 1200},
            {'symbol': 'AAPL240119C00150000', 'strike': 150, 'option_type': 'call', 'open_interest': 800},
            {'symbol': 'AAPL240119P00150000', 'strike': 150, 'option_type': 'put', 'open_interest': 900},
        ]
        mock_obb.derivatives.options.chains.return_value = mock_result

        result = client.get_max_pain('AAPL')
        assert 'max_pain' in result
        assert 'strikes' in result
        assert result['max_pain'] in [145, 150]


class TestConvenienceFunctions:
    """Test module-level convenience functions."""

    def test_get_openbb_client_singleton(self):
        """Test singleton pattern."""
        client1 = get_openbb_client()
        client2 = get_openbb_client()
        assert client1 is client2

    @patch('src.infrastructure.openbb_client.get_openbb_client')
    def test_convenience_functions(self, mock_get_client):
        """Test all convenience functions delegate to client."""
        mock_client = Mock()
        mock_get_client.return_value = mock_client

        # Test each function
        get_profile('AAPL')
        mock_client.get_company_profile.assert_called_with('AAPL')

        get_fundamentals('AAPL', 'quarter')
        mock_client.get_fundamentals.assert_called_with('AAPL', 'quarter')

        get_ratios('AAPL')
        mock_client.get_ratios.assert_called_with('AAPL', 'annual')

        get_earnings('AAPL', 4)
        mock_client.get_earnings.assert_called_with('AAPL', 4)

        get_dividends('AAPL', 10)
        mock_client.get_dividends.assert_called_with('AAPL', 10)

        get_fred_series('GDP', '2023-01-01', '2023-12-31')
        mock_client.get_fred_series.assert_called_with('GDP', '2023-01-01', '2023-12-31')

        get_treasury_rates('2y')
        mock_client.get_treasury_rates.assert_called_with('2y')

        get_etf_holdings('SPY')
        mock_client.get_etf_holdings.assert_called_with('SPY')

        get_insider_transactions('AAPL', 5)
        mock_client.get_insider_transactions.assert_called_with('AAPL', 5)

        get_institutional_ownership('AAPL', 5)
        mock_client.get_institutional_ownership.assert_called_with('AAPL', 5)

        get_short_interest('AAPL')
        mock_client.get_short_interest.assert_called_with('AAPL')

        get_analyst_ratings('AAPL')
        mock_client.get_analyst_ratings.assert_called_with('AAPL')

        # Options functions
        get_options_chains('AAPL', 'yfinance', '2024-01-19', 'call')
        mock_client.get_options_chains.assert_called_with('AAPL', 'yfinance', '2024-01-19', 'call')

        get_options_greeks('AAPL', '2024-01-19', 150.0, 'call')
        mock_client.get_options_greeks.assert_called_with('AAPL', '2024-01-19', 150.0, 'call')

        get_options_snapshots('2024-01-19', False)
        mock_client.get_options_snapshots.assert_called_with('2024-01-19', False)

        get_options_surface([], 'implied_volatility', 150.0, 'otm', 10, 60)
        mock_client.get_options_surface.assert_called_with([], 'implied_volatility', 150.0, 'otm', 10, 60)

        get_unusual_options_activity('AAPL', 'intrinio')
        mock_client.get_unusual_options_activity.assert_called_with('AAPL', 'intrinio')

        get_put_call_ratio('AAPL', '2024-01-19')
        mock_client.get_put_call_ratio.assert_called_with('AAPL', '2024-01-19')

        get_max_pain('AAPL', '2024-01-19')
        mock_client.get_max_pain.assert_called_with('AAPL', '2024-01-19')


class TestCacheBehavior:
    """Test cache behavior in detail."""

    @pytest.fixture
    def client(self):
        return OpenBBClient(use_cache=True)

    @pytest.fixture
    def mock_obb(self):
        with patch('src.infrastructure.openbb_client.obb') as mock:
            yield mock

    def test_cache_hit(self, client, mock_obb):
        """Test cache hit returns cached data without calling API."""
        mock_result = Mock()
        mock_result.to_df.return_value.to_dict.return_value = [{'symbol': 'AAPL', 'cached': True}]
        mock_obb.equity.profile.return_value = mock_result

        # First call - populates cache
        result1 = client.get_company_profile('AAPL')
        assert result1[0]['cached'] is True

        # Modify mock to return different data
        mock_result.to_df.return_value.to_dict.return_value = [{'symbol': 'AAPL', 'cached': False}]

        # Second call - should return cached data
        result2 = client.get_company_profile('AAPL')
        assert result2[0]['cached'] is True  # Still returns cached

    def test_cache_disabled(self, mock_obb):
        """Test cache disabled behavior."""
        client = OpenBBClient(use_cache=False)
        mock_result = Mock()
        mock_result.to_df.return_value.to_dict.return_value = [{'symbol': 'AAPL'}]
        mock_obb.equity.profile.return_value = mock_result

        result1 = client.get_company_profile('AAPL')
        result2 = client.get_company_profile('AAPL')

        # Should call API both times
        assert mock_obb.equity.profile.call_count == 2

    def test_cache_ttl_expiry(self, client, mock_obb):
        """Test cache expires after TTL."""
        import time
        mock_result = Mock()
        mock_result.to_df.return_value.to_dict.return_value = [{'symbol': 'AAPL'}]
        mock_obb.equity.profile.return_value = mock_result

        # Populate cache
        client.get_company_profile('AAPL')

        # Manually expire cache
        client._cache['profile:AAPL'] = ([{'symbol': 'AAPL'}], time.time() - 400)

        # Next call should fetch fresh data
        result = client.get_company_profile('AAPL')
        assert mock_obb.equity.profile.call_count == 2


if __name__ == '__main__':
    pytest.main([__file__, '-v'])