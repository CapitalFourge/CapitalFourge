from http.server import HTTPServer, BaseHTTPRequestHandler
import json
import time
import sys

class HealthHandler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
    
    def do_GET(self):
        print(f"[{time.strftime('%H:%M:%S')}] Request: {self.path}", flush=True)
        if self.path == '/health':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            response = json.dumps({'status': 'alive'})
            self.wfile.write(response.encode())
            print(f"[{time.strftime('%H:%M:%S')}] Health check OK -> {response}", flush=True)
        else:
            self.send_response(404)
            self.end_headers()
    
    def log_message(self, format, *args):
        print(f"[{time.strftime('%H:%M:%S')}] {format % args}", flush=True)

if __name__ == '__main__':
    print("Starting data collector mock on port 8000...", flush=True)
    server = HTTPServer(('0.0.0.0', 8000), HealthHandler)
    print('Data collector mock running on port 8000', flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down...", flush=True)
        server.server_close()
        sys.exit(0)