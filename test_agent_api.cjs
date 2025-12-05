// Test script for Agent API
const http = require('http');

const BASE_URL = 'http://localhost:3002';
let JWT_TOKEN = null;

// Helper function to make HTTP requests
function makeRequest(method, path, body = null, headers = {}) {
    return new Promise((resolve, reject) => {
        const url = new URL(BASE_URL + path);

        const options = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname + url.search,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                ...headers
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    resolve({ status: res.statusCode, data: parsed });
                } catch (e) {
                    resolve({ status: res.statusCode, data: data });
                }
            });
        });

        req.on('error', reject);

        if (body) {
            req.write(JSON.stringify(body));
        }

        req.end();
    });
}

async function runTests() {
    console.log('===========================================');
    console.log('  AGENT API TEST SUITE');
    console.log('===========================================\n');

    // Test 1: Get API Key (first login as regular user)
    console.log('TEST 1: Login and Get API Key');
    console.log('-------------------------------------------');

    try {
        const loginRes = await makeRequest('POST', '/api/login', {
            username: 'gabito',
            password: 'gabito33'
        });

        if (loginRes.status === 200) {
            console.log('✓ Login successful');
            JWT_TOKEN = loginRes.data.token;
            const tenantId = loginRes.data.user.tenantId;
            console.log(`  Tenant ID: ${tenantId}`);

            // Get API key
            const apiKeyRes = await makeRequest('GET', '/api/tenant/apikey', null, {
                'Authorization': `Bearer ${JWT_TOKEN}`
            });

            if (apiKeyRes.status === 200) {
                console.log('✓ API Key retrieved successfully');
                console.log(`  API Key: ${apiKeyRes.data.key}`);

                // Test 2: Agent Authentication
                console.log('\nTEST 2: Agent Authentication');
                console.log('-------------------------------------------');

                const agentAuthRes = await makeRequest('POST', '/api/agent/auth', {
                    tenantId: tenantId,
                    apiKey: apiKeyRes.data.key
                });

                if (agentAuthRes.status === 200) {
                    console.log('✓ Agent authentication successful');
                    console.log(`  Agent Token: ${agentAuthRes.data.token.substring(0, 30)}...`);
                    const AGENT_TOKEN = agentAuthRes.data.token;

                    // Test 3: Get Tags
                    console.log('\nTEST 3: Get Tags via Agent API');
                    console.log('-------------------------------------------');

                    const tagsRes = await makeRequest('GET', '/api/agent/tags', null, {
                        'Authorization': `Bearer ${AGENT_TOKEN}`
                    });

                    if (tagsRes.status === 200) {
                        console.log(`✓ Tags retrieved successfully (${tagsRes.data.length} tags)`);
                        if (tagsRes.data.length > 0) {
                            console.log(`  First tag: ${tagsRes.data[0].code} - ${tagsRes.data[0].category}`);
                        }
                    } else {
                        console.log(`✗ Failed to get tags: ${tagsRes.status}`);
                    }

                    // Test 4: Query Tags
                    console.log('\nTEST 4: Query Tags');
                    console.log('-------------------------------------------');

                    const queryRes = await makeRequest('POST', '/api/agent/tags/query', {
                        query: 'xxx'
                    }, {
                        'Authorization': `Bearer ${AGENT_TOKEN}`
                    });

                    if (queryRes.status === 200) {
                        console.log(`✓ Tag query successful (${queryRes.data.matches} matches)`);
                    } else {
                        console.log(`✗ Tag query failed: ${queryRes.status}`);
                    }

                    // Test 5: Get Tenant Config
                    console.log('\nTEST 5: Get Tenant Configuration');
                    console.log('-------------------------------------------');

                    const configRes = await makeRequest('GET', '/api/agent/tenant/config', null, {
                        'Authorization': `Bearer ${AGENT_TOKEN}`
                    });

                    if (configRes.status === 200) {
                        console.log('✓ Tenant config retrieved');
                        console.log(`  Company: ${configRes.data.name}`);
                        console.log(`  Email: ${configRes.data.email}`);
                    } else {
                        console.log(`✗ Failed to get config: ${configRes.status}`);
                    }

                    // Test 6: Log Activity
                    console.log('\nTEST 6: Log Agent Activity');
                    console.log('-------------------------------------------');

                    const logRes = await makeRequest('POST', '/api/agent/logs', {
                        action: 'test_action',
                        metadata: { test: true, timestamp: Date.now() }
                    }, {
                        'Authorization': `Bearer ${AGENT_TOKEN}`
                    });

                    if (logRes.status === 200) {
                        console.log('✓ Activity logged successfully');
                        console.log(`  Log ID: ${logRes.data.logId}`);
                    } else {
                        console.log(`✗ Failed to log activity: ${logRes.status}`);
                    }

                    // Test 7: Get Logs
                    console.log('\nTEST 7: Get Agent Logs');
                    console.log('-------------------------------------------');

                    const getLogsRes = await makeRequest('GET', '/api/agent/logs?limit=5', null, {
                        'Authorization': `Bearer ${AGENT_TOKEN}`
                    });

                    if (getLogsRes.status === 200) {
                        console.log(`✓ Logs retrieved (${getLogsRes.data.count} entries)`);
                        if (getLogsRes.data.logs.length > 0) {
                            console.log(`  Latest log: ${getLogsRes.data.logs[0].action}`);
                        }
                    } else {
                        console.log(`✗ Failed to get logs: ${getLogsRes.status}`);
                    }

                } else {
                    console.log(`✗ Agent authentication failed: ${agentAuthRes.status}`);
                    console.log(`  Error: ${JSON.stringify(agentAuthRes.data)}`);
                }

            } else {
                console.log(`✗ Failed to get API key: ${apiKeyRes.status}`);
            }

        } else {
            console.log(`✗ Login failed: ${loginRes.status}`);
        }

    } catch (err) {
        console.error('Error during tests:', err);
    }

    console.log('\n===========================================');
    console.log('  TEST SUITE COMPLETE');
    console.log('===========================================');
}

// Run tests
runTests();
