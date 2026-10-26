#!/usr/bin/env python3
"""Preview the built archive on localhost; Ctrl+C stops the server."""
import argparse
import functools
import http.server
import pathlib
import subprocess
import threading
import urllib.parse
import webbrowser


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--port', type=int, default=0, help='Port number; default chooses an available port')
    parser.add_argument('--no-browser', action='store_true', help='Print the URL without opening a browser')
    parser.add_argument('--design-review', action='store_true', help='Open the independent timeline/list design prototype')
    args = parser.parse_args()
    base = pathlib.Path(__file__).resolve().parent
    build_lock = threading.Lock()
    source_stamp = None

    def rebuild_review():
        nonlocal source_stamp
        with build_lock:
            inputs = sorted((base.parent / 'data/breakthrough').glob('events-*.json'))
            inputs += [base / 'dist/data/archive.js', base / 'design-review/breakthrough.js',
                       base.parent / 'scripts/build_breakthrough.cjs']
            stamp = [(str(p), p.stat().st_mtime_ns, p.stat().st_size) for p in inputs]
            if stamp != source_stamp:
                subprocess.run(['node', str(base.parent / 'scripts/build_breakthrough.cjs')], check=True)
                source_stamp = stamp

    if args.design_review:
        rebuild_review()
    directory = base if args.design_review else base / 'dist'
    entrypoint = base / 'design-review/index.html' if args.design_review else directory / 'index.html'
    if not entrypoint.is_file():
        parser.error('Build the website first: python3 scripts/build_website.py (from the archive root).')
    class PreviewHandler(http.server.SimpleHTTPRequestHandler):
        def do_GET(self):
            route = urllib.parse.urlsplit(self.path).path
            if args.design_review and route in ('/design-review/', '/design-review/index.html'):
                try:
                    rebuild_review()
                except (OSError, subprocess.CalledProcessError):
                    self.send_error(500, 'Breakthrough data validation failed; see the preview terminal.')
                    return
            if args.design_review:
                self._review_no_cache = True
            super().do_GET()

        def end_headers(self):
            if getattr(self, '_review_no_cache', False):
                self.send_header('Cache-Control', 'no-store')
            super().end_headers()

    handler = functools.partial(PreviewHandler, directory=str(directory))
    with http.server.ThreadingHTTPServer(('127.0.0.1', args.port), handler) as server:
        url = f'http://127.0.0.1:{server.server_port}/' + ('design-review/' if args.design_review else '')
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
