// router.js
import http from "http";
import httpProxy from "http-proxy";
import fetch from "node-fetch";

const proxy = httpProxy.createProxyServer({});
const SANDBOX_API = "https://sociox.in/api/v1/sandboxes";
const SANDBOX_API_KEY = "sk_umrBqEOcEfO8xkuaT2CbXIbSb14BADGwKZHdDJH1eBc"

// Simple cache so we don’t hammer the API
let sandboxCache = [];
async function refreshSandboxes() {
  try {
    const res = await fetch(SANDBOX_API, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${SANDBOX_API_KEY}`
    }
  });
    const data = await res.json();
    sandboxCache = data.sandboxes || [];
  } catch (err) {
    console.error("Failed to refresh sandboxes:", err);
  }
}
// refresh every 10s
setInterval(refreshSandboxes, 10000);
refreshSandboxes();

http.createServer((req, res) => {
  const host = req.headers.host; // e.g. nx-0ae212cf.appopen.app
  const subdomain = host.split(".")[0];

  const sandbox = sandboxCache.find(s => s.id === subdomain);
  if (!sandbox) {
    res.writeHead(404, { "Content-Type": "text/plain" });
    return res.end("Sandbox not found");
  }

  const target = `http://localhost:${sandbox.port}`;
  proxy.web(req, res, { target }, (err) => {
    console.error("Proxy error:", err);
    res.writeHead(502);
    res.end("Bad Gateway");
  });
}).listen(9000, () => {
  console.log("Sandbox router running at http://localhost:9000");
});
