declare module "stompjs/lib/stomp.js" {
  export const Stomp: {
    over(socket: unknown): {
      connected: boolean;
      connect(
        headers: Record<string, string>,
        onConnect: () => void,
        onError?: (error: unknown) => void
      ): void;
      subscribe(destination: string, callback: (message: { body: string }) => void): { unsubscribe(): void };
      disconnect(callback?: () => void): void;
      debug?: (message: string) => void;
    };
  };
}
