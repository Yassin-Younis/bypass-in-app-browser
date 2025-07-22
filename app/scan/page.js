"use client"; // For Next.js App Router compatibility
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Head from 'next/head';

// --- Reusable TestResult Component (no changes) ---
const TestResult = ({ title, status, details }) => {
    // ... same as before
    const getStatusStyle = (s) => {
        if (s === 'SUCCESS') return {color: '#28a745', fontWeight: 'bold'};
        if (s === 'FAILED') return {color: '#dc3545', fontWeight: 'bold'};
        return {color: '#6c757d', fontWeight: 'bold'};
    };
    return (
        <div style={{ border: '1px solid #ddd', padding: '15px', marginBottom: '15px', borderRadius: '8px', background: '#f9f9f9' }}>
            <h3 style={{ margin: '0 0 10px 0' }}>{title}</h3>
            <p style={{ margin: '0 0 5px 0' }}>Status: <span style={getStatusStyle(status)}>{status}</span></p>
            <p style={{ margin: 0, fontSize: '0.9em', color: '#555' }}>{details}</p>
        </div>
    );
};

export default function WebViewAnalyzerPageV2() {
    const router = useRouter();
    const [testResults, setTestResults] = useState({});
    const [scanResults, setScanResults] = useState([]);
    const [scanComplete, setScanComplete] = useState(false);
    const [postMessageLog, setPostMessageLog] = useState([]);

    const marketUrl = 'market://details?id=com.google.android.apps.maps';

    // --- Main Test Runner ---
    useEffect(() => {
        runAllTests();
        // Setup listener for postMessage tests
        window.addEventListener('message', handlePostMessageResponse);
        return () => window.removeEventListener('message', handlePostMessageResponse);
    }, []);

    const updateResult = (key, status, details) => {
        setTestResults(prev => ({ ...prev, [key]: { status, details } }));
    };

    const runAllTests = () => {
        setTestResults({});
        setScanComplete(false);
        // Automated navigation tests (same as before, but with router fix)
        // ... (window.open, iframe, etc.)
        updateResult('nextRouter', 'PENDING', `Attempting router.push('${marketUrl}')`);
        try {
            router.push(marketUrl);
        } catch (e) {
            updateResult('nextRouter', 'FAILED', `As expected, Next.js router blocked this invalid route. Error: ${e.message}`);
        }
        runJsInterfaceScan();
    };

    // --- IMPROVEMENT 1: Expanded JS Interface Scanner ---
    const runJsInterfaceScan = () => {
        const foundInterfaces = [];
        const keywords = ['android', 'app', 'bridge', 'mobile', 'webkit', 'handler', 'toutiao', 'bytedance', 'tiktok', 'TMA'];
        for (const key in window) {
            try {
                if (window.hasOwnProperty(key) && typeof window[key] === 'object' && window[key] !== null) {
                    const lowerKey = key.toLowerCase();
                    if (keywords.some(k => lowerKey.includes(k)) || !/^[a-z]/.test(key)) {
                        const methods = [];
                        for (const prop in window[key]) {
                            if (typeof window[key][prop] === 'function') {
                                methods.push(prop);
                            }
                        }
                        if (methods.length > 0) {
                            foundInterfaces.push({ name: key, methods: methods });
                        }
                    }
                }
            } catch (error) { /* ignored */ }
        }
        setScanResults(foundInterfaces);
        setScanComplete(true);
    };

    // --- IMPROVEMENT 2: Robust Method Tester using .call() ---
    const tryMethod = (interfaceName, methodName) => {
        const urlToTry = prompt(`Enter the URL or first argument to test with:`, marketUrl);
        if (urlToTry === null) return;

        try {
            const interfaceObject = window[interfaceName];
            const methodToCall = interfaceObject[methodName];

            alert(`Calling: ${interfaceName}.${methodName}.call(${interfaceName}, "${urlToTry}")`);

            // Using .call() to preserve the correct 'this' context
            methodToCall.call(interfaceObject, urlToTry);

        } catch (e) {
            alert(`An error occurred: ${e.message}`);
        }
    };

    // --- IMPROVEMENT 3: NEW `postMessage` Fuzzer ---
    const handlePostMessageResponse = (event) => {
        const logEntry = `Received message: ${JSON.stringify(event.data)}`;
        setPostMessageLog(prev => [...prev, logEntry]);
    };

    const testPostMessage = (interfaceName) => {
        const defaultPayload = JSON.stringify({ event: 'open_url', url: marketUrl });
        const payloadStr = prompt('Enter JSON payload to send:', defaultPayload);
        if (!payloadStr) return;

        try {
            const payload = JSON.parse(payloadStr);
            const interfaceObject = window[interfaceName];

            setPostMessageLog(prev => [...prev, `Sending to ${interfaceName}: ${payloadStr}`]);
            interfaceObject.postMessage(payload);

        } catch (e) {
            alert(`Invalid JSON or error sending message: ${e.message}`);
        }
    };

    return (
        <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
            <Head><title>Advanced WebView Analysis</title></Head>

            <main>
                <h1 style={{ textAlign: 'center' }}>Advanced WebView Analysis Toolkit</h1>
                <button onClick={runAllTests} style={{ width: '100%', padding: '12px', marginBottom: '20px' }}>Run All Tests Again</button>

                {/* Section for Automated Navigation Tests (can be collapsed if desired) */}
                <details>
                    <summary style={{ fontSize: '1.2em', fontWeight: 'bold', cursor: 'pointer' }}>Automated Navigation Tests</summary>
                    <div style={{ padding: '10px' }}>
                        {testResults.nextRouter && <TestResult title="Next.js Router (router.push)" {...testResults.nextRouter} />}
                        {/* Add other simple tests here if needed */}
                    </div>
                </details>

                {/* Section for JavaScript Interface Scan */}
                <div style={{ marginTop: '20px' }}>
                    <h2 style={{ borderBottom: '2px solid #ccc', paddingBottom: '10px' }}>JavaScript Interface Scan</h2>
                    {scanComplete ? (
                        scanResults.length > 0 ? (
                            scanResults.map((iface) => (
                                <div key={iface.name} style={{ border: '1px solid #ddd', padding: '15px', marginBottom: '15px', borderRadius: '8px' }}>
                                    <h3 style={{ color: '#0070f3' }}>Interface: <code>window.{iface.name}</code></h3>
                                    <strong>Methods:</strong>
                                    <ul>
                                        {iface.methods.map((method) => (
                                            <li key={method} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0' }}>
                                                {/* Differentiate postMessage test */}
                                                {method === 'postMessage' ? (
                                                    <>
                                                        <code>{method}(payload)</code>
                                                        <button onClick={() => testPostMessage(iface.name)} style={{cursor: 'pointer'}}>Test `postMessage`</button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <code>{method}()</code>
                                                        <button onClick={() => tryMethod(iface.name, method)} style={{cursor: 'pointer'}}>Test Method</button>
                                                    </>
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))
                        ) : <p><strong>No potential JavaScript interfaces were found.</strong></p>
                    ) : <p>Scanning...</p>}
                </div>

                {/* NEW Section for postMessage Logging */}
                <div style={{ marginTop: '20px' }}>
                    <h2 style={{ borderBottom: '2px solid #ccc', paddingBottom: '10px' }}>`postMessage` Log</h2>
                    <p>This log will show any messages received from the app in response to a `postMessage` call.</p>
                    <div style={{ background: '#111', color: '#eee', padding: '15px', borderRadius: '5px', minHeight: '100px', whiteSpace: 'pre-wrap', wordBreak: 'break-all', fontFamily: 'monospace' }}>
                        {postMessageLog.join('\n') || 'Listening for messages...'}
                    </div>
                </div>
            </main>
        </div>
    );
}