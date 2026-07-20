"""
Tests for FinnhubClient - News, Sentiment, Market News
"""
import pytest
from unittest.mock import Mock, patch, MagicMock
import sys
import os
import time

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))


def _reload_finnhub_with_key(key='test_key'):
    """Reload finnhub_client module with specific API key."""
    with patch.dict(os.environ, {'FINNHUB_API_KEY': key}):
        import importlib
        import src.infrastructure.finnhub_client as finnhub_module
        importlib.reload(finnhub_module)
        return finnhub_module


class TestFinnhubClient:
    """Test Finnhub client functionality."""

    @pytest.fixture(autouse=True)
    def setup(self):
        """Set up fresh module for each test."""
        self.finnhub = _reload_finnhub_with_key('test_key')
        # Clear caches
        self.finnhub._news_cache.clear()
        self.finnhub._sentiment_cache.clear()
        self.finnhub._market_news_cache.clear()
        yield
        # Cleanup
        self.finnhub._news_cache.clear()
        self.finnhub._sentiment_cache.clear()
        self.finnhub._market_news_cache.clear()

    def test_get_finnhub_client(self):
        """Test client creation."""
        with patch('src.infrastructure.finnhub_client.finnhub.Client') as mock:
            client = self.finnhub.get_finnhub_client()
            mock.assert_called_once_with(api_key='test_key')
            assert client is not None

    def test_get_finnhub_client_no_key(self):
        """Test client creation without API key."""
        finnhub_no_key = _reload_finnhub_with_key('')
        with pytest.raises(ValueError, match="FINNHUB_API_KEY not set"):
            finnhub_no_key.get_finnhub_client()

    def test_get_news(self):
        """Test get_company_news."""
        with patch('src.infrastructure.finnhub_client.finnhub.Client') as mock_finnhub:
            mock_client = Mock()
            mock_finnhub.return_value = mock_client
            mock_client.company_news.return_value = [
                {
                    'headline': 'Apple reports record earnings',
                    'summary': 'Apple beats estimates',
                    'url': 'https://example.com/news1',
                    'source': 'Reuters',
                    'datetime': 1700000000,
                    'image': 'https://example.com/img1.jpg',
                    'category': 'earnings',
                    'related': 'AAPL'
                }
            ]

            result = self.finnhub.get_news('AAPL', limit=5)
            
            assert isinstance(result, list)
            assert len(result) == 1
            assert result[0]['headline'] == 'Apple reports record earnings'
            assert 'sentiment_score' in result[0]
            assert 'sentiment_label' in result[0]
            mock_client.company_news.assert_called_once_with('AAPL', _from="", to="")

    def test_get_news_empty(self):
        """Test get_news returns empty list when no news."""
        with patch('src.infrastructure.finnhub_client.finnhub.Client') as mock_finnhub:
            mock_client = Mock()
            mock_finnhub.return_value = mock_client
            mock_client.company_news.return_value = []

            result = self.finnhub.get_news('AAPL')
            assert result == []

    def test_get_news_error(self):
        """Test get_news handles errors gracefully."""
        with patch('src.infrastructure.finnhub_client.finnhub.Client') as mock_finnhub:
            mock_client = Mock()
            mock_finnhub.return_value = mock_client
            mock_client.company_news.side_effect = Exception("API Error")

            result = self.finnhub.get_news('AAPL')
            assert result == []

    def test_get_sentiment(self):
        """Test get_sentiment aggregates correctly."""
        with patch('src.infrastructure.finnhub_client.finnhub.Client') as mock_finnhub:
            mock_client = Mock()
            mock_finnhub.return_value = mock_client
            
            # Mock news with known sentiment
            mock_client.company_news.return_value = [
                {'headline': 'Apple stock surges on strong earnings', 'summary': 'Great growth', 'url': '', 'source': '', 'datetime': 1700000000, 'image': '', 'category': '', 'related': ''},
                {'headline': 'Apple drops on weak guidance', 'summary': 'Revenue miss', 'url': '', 'source': '', 'datetime': 1700000000, 'image': '', 'category': '', 'related': ''},
            ]

            result = self.finnhub.get_sentiment('AAPL')
            
            assert 'sentiment_score' in result
            assert 'sentiment_label' in result
            assert 'bullish_pct' in result
            assert 'bearish_pct' in result
            assert 'article_count' in result
            assert result['symbol'] == 'AAPL'

    def test_get_sentiment_no_news(self):
        """Test get_sentiment with no news."""
        with patch('src.infrastructure.finnhub_client.finnhub.Client') as mock_finnhub:
            mock_client = Mock()
            mock_finnhub.return_value = mock_client
            mock_client.company_news.return_value = []

            result = self.finnhub.get_sentiment('AAPL')
            assert result['sentiment_score'] == 0.0
            assert result['sentiment_label'] == 'neutral'
            assert result['article_count'] == 0

    def test_get_market_news(self):
        """Test get_market_news."""
        with patch('src.infrastructure.finnhub_client.finnhub.Client') as mock_finnhub:
            mock_client = Mock()
            mock_finnhub.return_value = mock_client
            mock_client.general_news.return_value = [
                {'headline': 'Market up', 'summary': 'Stocks rise', 'url': '', 'source': '', 'datetime': 1700000000, 'image': '', 'category': 'general'}
            ]

            result = self.finnhub.get_market_news(category='general', limit=10)
            assert isinstance(result, list)
            assert len(result) == 1
            assert 'sentiment_score' in result[0]


class TestSentimentCalculation:
    """Test sentiment scoring logic."""

    @pytest.fixture(autouse=True)
    def setup(self):
        self.finnhub = _reload_finnhub_with_key('test_key')

    def test_bullish_keywords(self):
        """Test bullish keywords increase score."""
        text = "Stock surges on strong earnings rally growth profit beat"
        score = self.finnhub._calculate_sentiment(text)
        assert score > 0

    def test_bearish_keywords(self):
        """Test bearish keywords decrease score."""
        text = "Stock crashes drops declines misses weak loss"
        score = self.finnhub._calculate_sentiment(text)
        assert score < 0

    def test_neutral_text(self):
        """Test neutral text returns zero."""
        text = "Company announces meeting tomorrow"
        score = self.finnhub._calculate_sentiment(text)
        assert score == 0.0

    def test_empty_text(self):
        """Test empty text returns zero."""
        assert self.finnhub._calculate_sentiment("") == 0.0
        assert self.finnhub._calculate_sentiment(None) == 0.0

    def test_sentiment_label(self):
        """Test sentiment label conversion."""
        assert self.finnhub._sentiment_label(0.5) == 'bullish'
        assert self.finnhub._sentiment_label(0.3) == 'bullish'
        assert self.finnhub._sentiment_label(0.1) == 'neutral'
        assert self.finnhub._sentiment_label(-0.1) == 'neutral'
        assert self.finnhub._sentiment_label(-0.3) == 'bearish'
        assert self.finnhub._sentiment_label(-0.5) == 'bearish'

    def test_case_insensitive(self):
        """Test sentiment is case insensitive."""
        score1 = self.finnhub._calculate_sentiment("SURGE RALLY GAIN")
        score2 = self.finnhub._calculate_sentiment("surge rally gain")
        assert score1 == score2

    def test_mixed_sentiment(self):
        """Test mixed bullish/bearish words."""
        text = "Stock surges but then drops on profit taking"
        score = self.finnhub._calculate_sentiment(text)
        # Should be near zero but slightly positive or negative
        assert -1.0 <= score <= 1.0


class TestFinnhubCaching:
    """Test Finnhub client caching behavior."""

    @pytest.fixture(autouse=True)
    def setup(self):
        """Set up fresh module for each test."""
        self.finnhub = _reload_finnhub_with_key('test_key')
        yield
        # Cleanup caches
        self.finnhub._news_cache.clear()
        self.finnhub._sentiment_cache.clear()
        self.finnhub._market_news_cache.clear()

    def test_news_cache(self):
        """Test news is cached."""
        with patch('src.infrastructure.finnhub_client.finnhub.Client') as mock_finnhub:
            mock_client = Mock()
            mock_finnhub.return_value = mock_client
            mock_client.company_news.return_value = [
                {'headline': 'Test news', 'summary': '', 'url': '', 'source': '', 'datetime': 1700000000, 'image': '', 'category': '', 'related': ''}
            ]

            # First call
            result1 = self.finnhub.get_news('AAPL', limit=10)
            # Second call - should use cache
            result2 = self.finnhub.get_news('AAPL', limit=10)

            assert result1 == result2
            # API should only be called once
            assert mock_client.company_news.call_count == 1

    def test_sentiment_cache(self):
        """Test sentiment is cached."""
        with patch('src.infrastructure.finnhub_client.finnhub.Client') as mock_finnhub:
            mock_client = Mock()
            mock_finnhub.return_value = mock_client
            mock_client.company_news.return_value = [
                {'headline': 'Bullish news', 'summary': '', 'url': '', 'source': '', 'datetime': 1700000000, 'image': '', 'category': '', 'related': ''}
            ]

            result1 = self.finnhub.get_sentiment('AAPL')
            result2 = self.finnhub.get_sentiment('AAPL')

            assert result1 == result2
            assert mock_client.company_news.call_count == 1

    def test_market_news_cache(self):
        """Test market news is cached."""
        with patch('src.infrastructure.finnhub_client.finnhub.Client') as mock_finnhub:
            mock_client = Mock()
            mock_finnhub.return_value = mock_client
            mock_client.general_news.return_value = [
                {'headline': 'Market news', 'summary': '', 'url': '', 'source': '', 'datetime': 1700000000, 'image': '', 'category': 'general'}
            ]

            result1 = self.finnhub.get_market_news('general', limit=5)
            result2 = self.finnhub.get_market_news('general', limit=5)

            assert result1 == result2
            assert mock_client.general_news.call_count == 1

    def test_cache_different_params(self):
        """Test different params create different cache entries."""
        with patch('src.infrastructure.finnhub_client.finnhub.Client') as mock_finnhub:
            mock_client = Mock()
            mock_finnhub.return_value = mock_client
            mock_client.company_news.return_value = [
                {'headline': 'Test', 'summary': '', 'url': '', 'source': '', 'datetime': 1700000000, 'image': '', 'category': '', 'related': ''}
            ]

            # Different limits should create different cache keys
            self.finnhub.get_news('AAPL', limit=5)
            self.finnhub.get_news('AAPL', limit=10)

            assert mock_client.company_news.call_count == 2


if __name__ == '__main__':
    pytest.main([__file__, '-v'])