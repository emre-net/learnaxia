// Automated Production API Health & Security Verification Suite
const BASE_URL = 'https://learnaxia.com/api';

async function testEndpoint(name, url, method, expectedStatus, body = null) {
    try {
        const options = {
            method,
            headers: { 'Content-Type': 'application/json' },
        };
        if (body) options.body = JSON.stringify(body);

        const res = await fetch(url, options);
        const pass = typeof expectedStatus === 'function' ? expectedStatus(res.status) : res.status === expectedStatus;
        console.log(`[${pass ? 'PASS' : 'FAIL'}] ${name}: ${method} ${url} -> Status ${res.status}`);
        return pass;
    } catch (err) {
        console.error(`[FAIL] ${name}: ${method} ${url} -> Network Error: ${err.message}`);
        return false;
    }
}

async function run() {
    console.log(`\n=== Running Production API Security & Health Tests against ${BASE_URL} ===\n`);
    let passed = 0;
    let total = 0;

    const tests = [
        {
            name: 'Public Health Check / Homepage',
            url: 'https://learnaxia.com',
            method: 'GET',
            expected: 200,
        },
        {
            name: 'Protected API: /api/modules (Requires Auth)',
            url: `${BASE_URL}/modules`,
            method: 'POST',
            expected: 401,
            body: { title: 'Test Unauth', type: 'FLASHCARD' }
        },
        {
            name: 'Protected API: /api/analytics (Requires Auth)',
            url: `${BASE_URL}/analytics`,
            method: 'GET',
            expected: 401,
        },
        {
            name: 'Protected API: /api/user/profile (Requires Auth)',
            url: `${BASE_URL}/user/profile`,
            method: 'GET',
            expected: 401,
        },
        {
            name: 'Protected API: /api/ai/generate (Requires Auth)',
            url: `${BASE_URL}/ai/generate`,
            method: 'POST',
            expected: (s) => s === 401 || s === 403,
            body: { topic: 'math', types: ['FLASHCARD'], count: 3 }
        },
        {
            name: 'Mobile Auth Rate Limit & Validation: /api/mobile/login',
            url: `${BASE_URL}/mobile/login`,
            method: 'POST',
            expected: (s) => s === 400 || s === 401,
            body: { email: 'invalid-email', password: 'short' }
        },
    ];

    for (const t of tests) {
        total++;
        const ok = await testEndpoint(t.name, t.url, t.method, t.expected, t.body);
        if (ok) passed++;
    }

    console.log(`\n=== Test Results: ${passed}/${total} passed ===\n`);
    if (passed !== total) process.exit(1);
}

run();
