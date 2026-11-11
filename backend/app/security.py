from asyncio import timeout

from starlette.datastructures import Headers, MutableHeaders
from starlette.responses import JSONResponse

MAX_BODY_BYTES = 128 * 1024
BODY_TIMEOUT_SECONDS = 10
DEMO_CSP = (
    "default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
    "font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'; "
    "base-uri 'none'; frame-ancestors 'none'; form-action 'self'"
)


class RequestProtection:
    def __init__(self, app, demo: bool, api_segments: set[str]):
        self.app = app
        self.demo = demo
        self.api_segments = api_segments

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        first_segment = scope["path"].split("/", 2)[1]
        is_api = first_segment in self.api_segments

        async def send_protected(message):
            if message["type"] == "http.response.start":
                headers = MutableHeaders(scope=message)
                headers["X-Content-Type-Options"] = "nosniff"
                headers["X-Frame-Options"] = "DENY"
                headers["Referrer-Policy"] = "no-referrer"
                if self.demo:
                    headers["Content-Security-Policy"] = DEMO_CSP
                if is_api:
                    headers["Cache-Control"] = "no-store"
            await send(message)

        if not is_api or scope["method"] in {"GET", "HEAD", "OPTIONS"}:
            await self.app(scope, receive, send_protected)
            return

        # Cross-origin browser scripts require a CORS preflight to send this header.
        headers = Headers(scope=scope)
        origin = headers.get("origin")
        expected_origin = f"{scope['scheme']}://{headers.get('host')}"
        if origin is not None and origin != expected_origin:
            await JSONResponse({"detail": "Request origin is not allowed."}, status_code=403)(
                scope, receive, send_protected
            )
            return
        if headers.get("X-Maxout-Request") != "1":
            await JSONResponse({"detail": "Missing request header."}, status_code=403)(
                scope, receive, send_protected
            )
            return

        body = bytearray()
        too_large = False
        try:
            async with timeout(BODY_TIMEOUT_SECONDS):
                while True:
                    message = await receive()
                    if message["type"] == "http.disconnect":
                        return
                    chunk = message.get("body", b"")
                    if len(body) + len(chunk) > MAX_BODY_BYTES:
                        too_large = True
                        break
                    body.extend(chunk)
                    if not message.get("more_body"):
                        break
        except TimeoutError:
            await JSONResponse({"detail": "Request body timed out."}, status_code=408)(
                scope, receive, send_protected
            )
            return

        if too_large:
            await JSONResponse({"detail": "Request body is too large."}, status_code=413)(
                scope, receive, send_protected
            )
            return

        async def replay_body():
            nonlocal body
            if body is None:
                return await receive()
            message = {"type": "http.request", "body": bytes(body), "more_body": False}
            body = None
            return message

        await self.app(scope, replay_body, send_protected)
