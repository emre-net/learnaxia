const http = require('http');
const https = require('https');

const TARGET_HOST = 'learnaxia.com';
const PORT = 3000;

const server = http.createServer((req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    const options = {
        hostname: TARGET_HOST,
        port: 443,
        path: req.url,
        method: req.method,
        headers: {
            ...req.headers,
            host: TARGET_HOST,
        },
    };

    delete options.headers['accept-encoding']; // Avoid gzip decompression issues in simple proxy

    const proxyReq = https.request(options, (proxyRes) => {
        res.writeHead(proxyRes.statusCode, proxyRes.headers);
        proxyRes.pipe(res);
    });

    proxyReq.on('error', (err) => {
        console.error('[Proxy Error]:', err.message);
        res.writeHead(502, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Proxy Gateway Error', message: err.message }));
    });

    req.pipe(proxyReq);
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`[Learnaxia API Proxy] Listening on http://0.0.0.0:${PORT} -> https://${TARGET_HOST}`);
});
