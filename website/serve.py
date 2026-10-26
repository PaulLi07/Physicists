#!/usr/bin/env python3
"""Build and preview the current Physics Pioneers site on localhost."""
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
    parser.add_argument('--design-review', action='store_true', help=argparse.SUPPRESS)
    args = parser.parse_args()
    base = pathlib.Path(__file__).resolve().parent
    root = base.parent
    build_lock = threading.Lock()
    source_stamp = None

    def source_files():
        files = [p for p in (base / 'src').rglob('*') if p.is_file()]
        files += list((root / 'data/breakthrough').glob('*.json'))
        for lang in ('zh', 'en'):
            files += [root / lang / 'data/physicists.json', root / 'docs' / f'physics-breakthrough-index.{lang}.md']
            files += [p for p in (root / lang / 'portraits').rglob('*') if p.is_file()]
        files += [root / 'scripts/build_website.py', root / 'scripts/build_breakthrough.cjs',
                  root / 'scripts/lib/navigation-estimates.cjs']
        return sorted(set(files))

    def rebuild():
        nonlocal source_stamp
        with build_lock:
            stamp = [(str(p), p.stat().st_mtime_ns, p.stat().st_size) for p in source_files()]
            if stamp != source_stamp or not (base / 'dist/index.html').is_file():
                subprocess.run(['python3', str(root / 'scripts/build_website.py')], check=True)
                source_stamp = stamp

    rebuild()

    class PreviewHandler(http.server.SimpleHTTPRequestHandler):
        def redirect_legacy(self):
            parsed = urllib.parse.urlsplit(self.path)
            # Compatibility for bookmarks from the former prototype; there is
            # one current site, and the old interface is no longer served.
            if parsed.path in ('/design-review', '/design-review/', '/design-review/index.html'):
                self.send_response(302)
                self.send_header('Location', '/' + ('?' + parsed.query if parsed.query else ''))
                self.end_headers()
                return True
            return False

        def do_HEAD(self):
            if not self.redirect_legacy():
                super().do_HEAD()

        def do_GET(self):
            if self.redirect_legacy():
                return
            parsed = urllib.parse.urlsplit(self.path)
            if parsed.path in ('/', '/index.html'):
                try:
                    rebuild()
                except (OSError, subprocess.CalledProcessError):
                    self.send_error(500, 'Site build failed; see the preview terminal.')
                    return
            super().do_GET()

        def end_headers(self):
            self.send_header('Cache-Control', 'no-store')
            super().end_headers()

    handler = functools.partial(PreviewHandler, directory=base / 'dist')
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
