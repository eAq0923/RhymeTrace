# 开发用静态服务器：带 no-store 头，避免改完 JS/HTML 后浏览器拿缓存。
# 用法：python tmp/serve.py  （在项目根目录下运行，端口 8123）
import sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PORT = 8123


class NoCacheHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()


if __name__ == "__main__":
    if len(sys.argv) > 1:
        PORT = int(sys.argv[1])
    print(f"serving {ROOT} at http://127.0.0.1:{PORT} (no-store)")
    ThreadingHTTPServer(("127.0.0.1", PORT), NoCacheHandler).serve_forever()
