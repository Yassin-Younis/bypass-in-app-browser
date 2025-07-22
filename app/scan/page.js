"use client"; // For Next.js App Router compatibility

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Head from 'next/head';

// --- Reusable UI Component for Displaying Test Results ---
const TestResult = ({ title, status, details }) => {
    const getStatusStyle = (s) => {
        if (s === 'SUCCESS') return { color: '#28a745', fontWeight: 'bold' };
        if (s === 'FAILED') return { color: '#dc3545', fontWeight: 'bold' };
        return { color: '#6c757d', fontWeight: 'bold' }; // PENDING or INFO
    };

    return (
        <div style={{ border: '1px solid #ddd', padding: '15px', marginBottom: '15px', borderRadius: '8px', background: '#f9f9f9' }}>
            <h3 style={{ margin: '0 0 10px 0' }}>{title}</h3>
            <p style={{ margin: '0 0 5px 0' }}>
                Status: <span style={getStatusStyle(status)}>{status}</span>
            </p>
            <p style={{ margin: 0, fontSize: '0.9em', color: '#555' }}>{details}</p>
        </div>
    );
};


export default function AdvancedWebViewAnalyzer() {
    const router = useRouter();
    const [testResults, setTestResults] = useState({});
    const [scanResults, setScanResults] = useState([]);
    const [scanComplete, setScanComplete] = useState(false);
    const [postMessageLog, setPostMessageLog] = useState([]);

    const marketUrl = 'market://details?id=com.google.android.apps.maps';
    const intentUrl = 'intent://details?id=com.google.android.apps.maps#Intent;scheme=market;package=com.android.vending;end';

    // This effect runs all tests when the page loads and sets up listeners.
    useEffect(() => {
        runAllTests();

        // Setup listener for postMessage tests
        window.addEventListener('message', handlePostMessageResponse);

        // Cleanup function to remove the listener when the component unmounts
        return () => {
            window.removeEventListener('message', handlePostMessageResponse);
        };
    }, []);

    const updateResult = (key, status, details) => {
        setTestResults(prev => ({ ...prev, [key]: { status, details } }));
    };

    const runAllTests = () => {
        setTestResults({});
        setScanComplete(false);
        setPostMessageLog([]); // Clear logs on a new run

        // --- Run Basic Navigation Tests ---
        // window.open
        updateResult('windowOpen', 'PENDING', `Attempting to call window.open()`);
        try {
            const newWindow = window.open(marketUrl, '_blank');
            if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
                updateResult('windowOpen', 'FAILED', 'window.open() was blocked by the WebView or a popup blocker.');
            } else {
                updateResult('windowOpen', 'INFO', 'window.open() was called. Check if the OS handled the intent. This usually fails.');
            }
        } catch (e) {
            updateResult('windowOpen', 'FAILED', `An error occurred: ${e.message}`);
        }

        // --- Run JS Interface Scan ---
        runJsInterfaceScan();
    };

    const runJsInterfaceScan = () => {
        setScanResults([]);
        const foundInterfaces = [];
        // Expanded keyword list
        const keywords = ['android', 'app', 'bridge', 'mobile', 'webkit', 'handler', 'toutiao', 'bytedance', 'tiktok', 'tma', 'jsi'];

        for (const key in window) {
            try {
                if (window.hasOwnProperty(key) && typeof window[key] === 'object' && window[key] !== null) {
                    const lowerKey = key.toLowerCase();
                    // Find interfaces based on keywords OR non-standard naming (e.g., starting with uppercase)
                    if (keywords.some(k => lowerKey.includes(k)) || /^[A-Z]/.test(key) || !/^[a-z]/.test(key)) {
                        const methods = [];
                        for (const prop in window[key]) {
                            // Check if the property is a function on the object itself
                            if (typeof window[key][prop] === 'function') {
                                methods.push(prop);
                            }
                        }
                        if (methods.length > 0) {
                            foundInterfaces.push({ name: key, methods: methods.sort() });
                        }
                    }
                }
            } catch (error) { /* Ignore errors from accessing protected properties */ }
        }
        setScanResults(foundInterfaces);
        setScanComplete(true);
    };

    // --- IMPROVED Method Tester ---
    const tryMethod = (interfaceName, methodName) => {
        const urlToTry = prompt(`Enter the URL or first argument to test with:`, intentUrl);
        if (urlToTry === null) return;

        try {
            const interfaceObject = window[interfaceName];
            const methodToCall = interfaceObject[methodName];

            alert(`Attempting to call: \n\nwindow.${interfaceName}.${methodName}.call(window.${interfaceName}, "${urlToTry}")`);

            // Using .call() to explicitly set the 'this' context, which fixes many errors.
            methodToCall.call(interfaceObject, urlToTry);

        } catch (e) {
            alert(`An error occurred: \n\n${e.name}: ${e.message}`);
        }
    };

    // --- NEW `postMessage` Fuzzer and Listener ---
    const handlePostMessageResponse = (event) => {
        const logEntry = `[${new Date().toLocaleTimeString()}] Received message: ${JSON.stringify(event.data)}`;
        setPostMessageLog(prev => [logEntry, ...prev]);
    };

    const testPostMessage = (interfaceName) => {
        const defaultPayload = JSON.stringify({ action: 'openLink', url: marketUrl }, null, 2);
        const payloadStr = prompt('Enter the JSON payload to send via postMessage:', defaultPayload);
        if (!payloadStr) return;

        try {
            const payload = JSON.parse(payloadStr);
            const interfaceObject = window[interfaceName];

            const logEntry = `[${new Date().toLocaleTimeString()}] Sending to ${interfaceName}: ${payloadStr}`;
            setPostMessageLog(prev => [logEntry, ...prev]);

            // Some interfaces expect a second argument (e.g., targetOrigin)
            interfaceObject.postMessage(payload, '*');

        } catch (e) {
            alert(`Invalid JSON or error sending message: ${e.message}`);
        }
    };

    return (
        <div style={{ padding: '16px', fontFamily: 'Arial, sans-serif', backgroundColor: '#f4f6f8' }}>
            <Head><title>Advanced WebView Analysis Toolkit</title></Head>

            <main style={{ maxWidth: '800px', margin: 'auto', backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
                <h1 style={{ textAlign: 'center', borderBottom: '2px solid #eee', paddingBottom: '15px' }}>Advanced WebView Analysis Toolkit</h1>
                <button onClick={runAllTests} style={{ width: '100%', padding: '12px', marginBottom: '20px', fontSize: '16px', cursor: 'pointer' }}>
                    Scan Again
                </button>

                <details open style={{ marginBottom: '20px' }}>
                    <summary style={{ fontSize: '1.2em', fontWeight: 'bold', cursor: 'pointer', padding: '10px 0' }}>JavaScript Interface Scan</summary>
                    <div style={{ padding: '10px 0' }}>
                        {scanComplete ? (
                            scanResults.length > 0 ? (
                                scanResults.map((iface) => (
                                    <div key={iface.name} style={{ border: '1px solid #ddd', padding: '15px', marginBottom: '15px', borderRadius: '8px' }}>
                                        <h3 style={{ color: '#005a9c', wordBreak: 'break-all' }}>Interface: <code>window.{iface.name}</code></h3>
                                        <ul style={{ listStyle: 'none', paddingLeft: 0 }}>
                                            {iface.methods.map((method) => (
                                                <li key={method} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #eee' }}>
                                                    <code>{method}()</code>
                                                    {method === 'postMessage' ? (
                                                        <button onClick={() => testPostMessage(iface.name)} style={{cursor: 'pointer', padding: '5px 10px', backgroundColor: '#ffc107'}}>Test `postMessage`</button>
                                                    ) : (
                                                        <button onClick={() => tryMethod(iface.name, method)} style={{cursor: 'pointer', padding: '5px 10px'}}>Test Method</button>
                                                    )}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ))
                            ) : <p><strong>No potential JavaScript interfaces were found.</strong></p>
                        ) : <p>Scanning...</p>}
                    </div>
                </details>

                <details style={{ marginBottom: '20px' }}>
                    <summary style={{ fontSize: '1.2em', fontWeight: 'bold', cursor: 'pointer', padding: '10px 0' }}>`postMessage` Log</summary>
                    <div style={{ marginTop: '10px' }}>
                        <p>This log shows messages sent to and received from the app via `postMessage`.</p>
                        <div style={{ background: '#1d1f21', color: '#c5c8c6', padding: '15px', borderRadius: '5px', minHeight: '150px', whiteSpace: 'pre-wrap', wordBreak: 'break-all', fontFamily: 'monospace', fontSize: '14px' }}>
                            {postMessageLog.length > 0 ? postMessageLog.join('\n') : 'Listening for messages...'}
                        </div>
                    </div>
                </details>

                <details>
                    <summary style={{ fontSize: '1.2em', fontWeight: 'bold', cursor: 'pointer', padding: '10px 0' }}>Basic Navigation Tests</summary>
                    <div style={{ padding: '10px 0' }}>
                        {testResults.windowOpen && <TestResult title="Popup (window.open)" {...testResults.windowOpen} />}
                        <div style={{ padding: '15px', background: '#e9ecef', borderRadius: '5px', marginTop: '10px' }}>
                            <strong>Manual Test:</strong> <a href={marketUrl} target="_blank" rel="noopener noreferrer">Click this link</a> to test direct navigation.
                        </div>
                    </div>
                </details>
            </main>
        </div>
    );
}