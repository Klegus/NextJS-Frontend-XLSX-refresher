// Address of the visitor as reported by the trusted reverse proxy.
// CLIENT_IP_HEADERS lists the headers to try, in order (default: Cloudflare's
// CF-Connecting-IP, then X-Real-IP from nginx/Caddy). Only headers the proxy
// overwrites may be listed here - the origin must not be reachable directly,
// otherwise a client could send the header itself.
export function getClientIp(request: Request): string {
  const names = (process.env.CLIENT_IP_HEADERS || 'cf-connecting-ip,x-real-ip')
    .split(',').map(h => h.trim().toLowerCase()).filter(Boolean);
  for (const name of names) {
    const value = request.headers.get(name)?.split(',')[0].trim();
    if (value && value.length <= 64) return value;
  }
  return '';
}
