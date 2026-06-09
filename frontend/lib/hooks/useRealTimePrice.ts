"use client";

import { useEffect, useState } from 'react';

function getWsUrl(): string {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1' || host === '') {
        return 'ws://localhost:8000/ws-prices';
    }
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    return `${protocol}://${host}:8000/ws-prices`;
}

export function useRealTimePrice(symbols: string[]) {
    const [prices, setPrices] = useState<Record<string, number>>({});

    useEffect(() => {
        if (symbols.length === 0) return;

        const WS_URL = getWsUrl();
        console.log('[WS] Connecting to', WS_URL, 'for symbols:', symbols);

        const ws = new WebSocket(WS_URL);

        ws.onopen = () => {
            console.log('[WS] Connected, subscribing to', symbols.length, 'symbols');
            ws.send(JSON.stringify({ action: 'subscribe', symbols }));
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                console.log('[WS] Message:', data);
                if (data.type === 'price') {
                    setPrices(prev => ({
                        ...prev,
                        [data.symbol]: data.price
                    }));
                }
            } catch (e) {
                console.error('[WS] Error parsing message:', e, 'raw:', event.data);
            }
        };

        ws.onerror = (event) => {
            console.error('[WS] Error event:', event);
            console.error('[WS] Error type:', event.type);
            console.error('[WS] Error message:', event.message);
            console.error('[WS] Error target:', event.target);
            console.error('[WS] ReadyState:', ws.readyState);
        };

        ws.onclose = (event) => {
            console.log('[WS] Closed:', event.code, event.reason);
        };

        return () => {
            if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
                ws.close();
            }
        };
    }, [symbols]);

    return prices;
}
