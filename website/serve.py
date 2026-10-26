#!/usr/bin/env python3
"""Preview the built archive on localhost; Ctrl+C stops the server."""
import argparse
import functools
import http.server
import pathlib
import webbrowser


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--port', type=int, default=0, help='Port number; default chooses an available port')
    parser.add_argument('--no-browser', action='store_true', help='Print the URL without opening a browser')
    args = parser.parse_args()
    directory = pathlib.Path(__file__).resolve().parent / 'dist'
    if not (directory / 'index.html').is_file():
        parser.error('Build the website first: python3 scripts/build_website.py (from the archive root).')
    handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=str(directory))
    with http.server.ThreadingHTTPServer(('127.0.0.1', args.port), handler) as server:
        url = f'http://127.0.0.1:{server.server_port}/'
        print(f'Physics Pioneers: {url}', flush=True)
        print('Press Ctrl+C to stop the preview server.', flush=True)
        if not args.no_browser:
            webbrowser.open(url)
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            print('\nPreview stopped.')


if __name__ == '__main__':
    main()
