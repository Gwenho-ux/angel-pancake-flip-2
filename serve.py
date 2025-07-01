#!/usr/bin/env python3
import http.server
import socketserver
import os

# Change to the script's directory
os.chdir(os.path.dirname(os.path.abspath(__file__)))

PORT = 8082
Handler = http.server.SimpleHTTPRequestHandler

with socketserver.TCPServer(("", PORT), Handler) as httpd:
    print(f"🥞 Angel's Pancake Flip server running at http://localhost:{PORT}")
    print(f"Serving from directory: {os.getcwd()}")
    print("Press Ctrl-C to stop the server")
    httpd.serve_forever() 