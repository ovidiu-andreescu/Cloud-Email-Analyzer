from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import os
import sys
from urllib.parse import urlparse


class SPARequestHandler(SimpleHTTPRequestHandler):
    """Serve built frontend assets and fall back to index.html for app routes."""

    def send_head(self):
        parsed_path = urlparse(self.path).path
        requested_path = self.translate_path(parsed_path)

        if os.path.isdir(requested_path) or os.path.exists(requested_path):
            return super().send_head()

        if parsed_path.startswith("/assets/") or "." in os.path.basename(parsed_path):
            return super().send_head()

        self.path = "/index.html"
        return super().send_head()


def main() -> None:
    directory = sys.argv[1] if len(sys.argv) > 1 else "dist"
    port = int(sys.argv[2]) if len(sys.argv) > 2 else 5173
    host = sys.argv[3] if len(sys.argv) > 3 else "0.0.0.0"

    handler = partial(SPARequestHandler, directory=directory)
    server = ThreadingHTTPServer((host, port), handler)
    print(f"Serving {directory} on http://{host}:{port}", flush=True)
    server.serve_forever()


if __name__ == "__main__":
    main()
