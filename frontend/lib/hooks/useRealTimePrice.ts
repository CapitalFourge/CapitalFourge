"use client";

import { useEffect, useState } from 'react';
import SockJS from 'sockjs-client';
import { Stomp } from 'stompjs/lib/stomp.js';

export function useRealTimePrice(symbols: string[]) {
    const [prices, setPrices] = useState<Record<string, number>>({});

    useEffect(() => {
        if (symbols.length === 0) return;

        const socket = new SockJS('http://localhost:8080/ws-prices');
        const client = Stomp.over(socket);

        // Desactivar logs de consola de Stomp para que no molesten
        client.debug = () => { };

        client.connect({}, () => {
            // Subscribe to price updates for all symbols
            symbols.forEach(symbol => {
                client.subscribe(`/topic/prices/${symbol}`, (message) => {
                    try {
                        const data = JSON.parse(message.body);
                        setPrices(prev => ({
                            ...prev,
                            [data.symbol]: data.price
                        }));
                    } catch (e) {
                        console.error("Error parsing price update:", e);
                    }
                });
            });
        });

        return () => {
            if (client.connected) client.disconnect(() => { });
        };
    }, [symbols]);

    return prices;
}
