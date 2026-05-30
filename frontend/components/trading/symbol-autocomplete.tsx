"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, gql } from "@apollo/client";
import { Input } from "@/components/ui/input";
import { Search, Loader2 } from "lucide-react";

const SEARCH_SYMBOLS_QUERY = gql`
    query SearchSymbols($query: String!, $limit: Int!) {
        searchSymbols(query: $query, limit: $limit) {
            symbol
            name
            category
        }
    }
`;

interface Symbol {
    symbol: string;
    name?: string;
    category?: string;
}

interface SymbolAutocompleteProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
    inputClassName?: string;
}

export function SymbolAutocomplete({
    value,
    onChange,
    placeholder = "Buscar activo...",
    disabled = false,
    className = "",
    inputClassName = ""
}: SymbolAutocompleteProps) {
    const [query, setQuery] = useState(value);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const { data, loading } = useQuery(SEARCH_SYMBOLS_QUERY, {
        variables: { query, limit: 5 },
        skip: query.length < 2,
        fetchPolicy: "network-only"
    });

    const suggestions = data?.searchSymbols || [];

    // Debounce query updates
    useEffect(() => {
        const timer = setTimeout(() => {
            setQuery(value);
        }, 300);
        return () => clearTimeout(timer);
    }, [value]);

    // Close suggestions when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value.toUpperCase();
        onChange(newValue);
        setShowSuggestions(true);
        setSelectedIndex(-1);
    };

    const handleSelectSuggestion = (symbol: string) => {
        onChange(symbol);
        setShowSuggestions(false);
        inputRef.current?.blur();
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (!showSuggestions || suggestions.length === 0) return;

        switch (e.key) {
            case "ArrowDown":
                e.preventDefault();
                setSelectedIndex(prev => prev < suggestions.length - 1 ? prev + 1 : prev);
                break;
            case "ArrowUp":
                e.preventDefault();
                setSelectedIndex(prev => prev > 0 ? prev - 1 : 0);
                break;
            case "Enter":
                e.preventDefault();
                if (selectedIndex >= 0) {
                    handleSelectSuggestion(suggestions[selectedIndex].symbol);
                }
                break;
            case "Escape":
                setShowSuggestions(false);
                break;
        }
    };

    return (
        <div ref={containerRef} className={`relative ${className}`}>
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                    ref={inputRef}
                    type="text"
                    placeholder={placeholder}
                    value={value}
                    onChange={handleInputChange}
                    onFocus={() => setShowSuggestions(true)}
                    onKeyDown={handleKeyDown}
                    disabled={disabled}
                    className={`bg-black/40 border-white/10 text-white pl-10 ${inputClassName}`}
                />
                {loading && (
                    <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 animate-spin" />
                )}
            </div>

            {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-black/95 border border-white/10 rounded-lg shadow-xl overflow-hidden">
                    {suggestions.map((suggestion: Symbol, index: number) => (
                        <button
                            key={suggestion.symbol}
                            onClick={() => handleSelectSuggestion(suggestion.symbol)}
                            className={`w-full px-4 py-3 text-left hover:bg-white/10 transition-colors ${index === selectedIndex ? "bg-white/10" : ""
                                }`}
                        >
                            <div className="flex items-center justify-between">
                                <span className="font-bold text-white">{suggestion.symbol}</span>
                                {suggestion.name && (
                                    <span className="text-sm text-slate-400">{suggestion.name}</span>
                                )}
                            </div>
                        </button>
                    ))}
                </div>
            )}

            {showSuggestions && query.length >= 2 && !loading && suggestions.length === 0 && (
                <div className="absolute z-50 w-full mt-1 bg-black/95 border border-white/10 rounded-lg shadow-xl p-4 text-center text-slate-400">
                    No se encontraron resultados para &quot;{query}&quot;
                </div>
            )}
        </div>
    );
}
