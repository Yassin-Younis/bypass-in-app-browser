"use client"
import {useState, useEffect} from 'react';
import { useRouter } from 'next/navigation'
import Head from 'next/head';

// A small component to display test results consistently
const TestResult = ({title, status, details}) => {
    const getStatusStyle = (s) => {
        if (s === 'SUCCESS') return {color: '#28a745', fontWeight: 'bold'};
        if (s === 'FAILED') return {color: '#dc3545', fontWeight: 'bold'};
        return {color: '#6c757d', fontWeight: 'bold'}; // PENDING or INFO
    };

    return (
        <div style={{
            border: '1px solid #ddd',
            padding: '15px',
            marginBottom: '15px',
            borderRadius: '8px',
            background: '#f9f9f9'
        }}>
            <h3 style={{margin: '0 0 10px 0'}}>{title}</h3>
            <p style={{margin: '0 0 5px 0'}}>
                Status: <span style={getStatusStyle(status)}>{status}</span>
            </p>
            <p style={{margin: 0, fontSize: '0.9em', color: '#555'}}>{details}</p>
        </div>
    );
};


export default function WebViewAnalyzerPage() {
    const router = useRouter();
    const [testResults, setTestResults] = useState({});
    const [scanResults, setScanResults] = useState([]);
    const [scanComplete, setScanComplete] = useState(false);

    const marketUrl = 'market://details?id=com.google.android.apps.maps';
    const intentUrl = 'intent://details?id=com.google.android.apps.maps#Intent;scheme=market;package=com.android.vending;end';

    // This effect runs all tests automatically when the page loads.
    useEffect(() => {
        runAllTests();
    }, []);

    const updateResult = (key, status, details) => {
        setTestResults(prev => ({...prev, [key]: {status, details}}));
    };

    const runAllTests = async () => {
        setTestResults({});
        setScanComplete(false);

        // --- Test 1: Direct Navigation ---
        updateResult('directNav', 'PENDING', 'Testing window.location.href. This test will navigate away if successful.');
        // We can't really "catch" this if it fails, as it throws a hard navigation error.
        // The details text serves as the instruction.

        // --- Test 2: window.open() ---
        updateResult('windowOpen', 'PENDING', `Attempting to call window.open('${marketUrl}')`);
        try {
            const newWindow = window.open(marketUrl, '_blank');
            if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
                updateResult('windowOpen', 'FAILED', 'window.open() was blocked by the WebView or a popup blocker.');
            } else {
                // This is tricky. The call succeeded, but the OS might still ignore the intent.
                updateResult('windowOpen', 'SUCCESS', 'window.open() was called successfully. Check if the Play Store opened. The WebView may have blocked the subsequent intent.');
            }
        } catch (e) {
            updateResult('windowOpen', 'FAILED', `An error occurred: ${e.message}`);
        }

        // --- Test 3: Iframe Navigation ---
        updateResult('iframeNav', 'PENDING', 'Creating an iframe and setting its src.');
        try {
            const iframe = document.createElement('iframe');
            iframe.style.display = 'none';
            iframe.src = marketUrl;
            document.body.appendChild(iframe);
            // This usually fails silently by showing a "net::ERR_UNKNOWN_URL_SCHEME" error in the iframe, which we can't easily detect.
            updateResult('iframeNav', 'INFO', 'Iframe was created. This method usually fails silently in a secure WebView. No explicit error was caught.');
            setTimeout(() => document.body.removeChild(iframe), 1000);
        } catch (e) {
            updateResult('iframeNav', 'FAILED', `An error occurred: ${e.message}`);
        }

        // --- Test 4: Form Submission ---
        updateResult('formSubmit', 'PENDING', 'Creating and submitting a form.');
        try {
            const form = document.createElement('form');
            form.method = 'POST';
            form.action = marketUrl;
            document.body.appendChild(form);
            // This will navigate the top-level frame if it works.
            form.submit();
            updateResult('formSubmit', 'INFO', 'Form created. The submit() action is commented out to prevent page navigation. Manually trigger it if needed for a specific test.');
            document.body.removeChild(form);
        } catch (e) {
            updateResult('formSubmit', 'FAILED', `An error occurred: ${e.message}`);
        }

        // --- Test 5: Next.js Router ---
        updateResult('nextRouter', 'PENDING', `Attempting router.push('${marketUrl}')`);
        try {
            // router.push() expects a valid route. This will almost certainly throw an error in Next.js.
            router.push(marketUrl).catch(e => {
                // We expect this to fail because it's not a valid Next.js route.
                updateResult('nextRouter', 'FAILED', `As expected, Next.js router blocked this invalid route. Error: ${e.message}`);
            });
        } catch (e) {
            updateResult('nextRouter', 'FAILED', `An error occurred: ${e.message}`);
        }

        // --- Test 6: JS Interface Scan ---
        runJsInterfaceScan();
    };

    const runJsInterfaceScan = () => {
        // [The same scanning logic from the previous answer]
        const foundInterfaces = [];
        const keywords = ['android', 'app', 'bridge', 'mobile', 'webkit', 'handler'];
        for (const key in window) {
            try {
                if (typeof window[key] === 'object' && window[key] !== null) {
                    const lowerKey = key.toLowerCase();
                    // if (keywords.some(k => lowerKey.includes(k)) || !/^[a-z]/.test(key)) {
                        const methods = [];
                        for (const prop in window[key]) {
                            if (Object.prototype.hasOwnProperty.call(window[key], prop)) {
                                if (typeof window[key][prop] === 'function') {
                                    methods.push(prop);
                                }
                            }
                        }
                        if (methods.length > 0) {
                            foundInterfaces.push({name: key, methods: methods});
                        }
                    // }
                }
            } catch (error) { /* ignored */
            }
        }
        setScanResults(foundInterfaces);
        setScanComplete(true);
    };

    const tryMethod = (interfaceName, methodName) => {
        let urlToTry = prompt(`Enter the URL to test with:`, intentUrl);
        if (urlToTry === null) return;
        try {
            alert(`Calling: window.${interfaceName}.${methodName}("${urlToTry}")`);
            window[interfaceName][methodName](urlToTry);
        } catch (e) {
            alert(`An error occurred: ${e.message}`);
        }
    };


    return (
        <div>
            <Head>
                <title>WebView Analysis Toolkit</title>
            </Head>

            <main>
                <h1>WebView Analysis Toolkit</h1>

                <p>
                    This page automatically tests various methods for escaping the WebView sandbox.
                    <br/>
                    <button onClick={runAllTests} style={{marginTop: '15px'}}>Run All Tests Again</button>
                </p>

                <div style={{marginTop: '2rem', width: '90%', textAlign: 'left'}}>
                    <h2>Automated Test Suite</h2>
                    {testResults.directNav &&
                        <TestResult title="1. Direct Navigation (window.location)" {...testResults.directNav} />}
                    {testResults.windowOpen &&
                        <TestResult title="2. Popup (window.open)" {...testResults.windowOpen} />}
                    {testResults.iframeNav && <TestResult title="3. Iframe Navigation" {...testResults.iframeNav} />}
                    {testResults.formSubmit && <TestResult title="4. Form Submission" {...testResults.formSubmit} />}
                    {testResults.nextRouter &&
                        <TestResult title="5. Next.js Router (router.push)" {...testResults.nextRouter} />}
                    <div style={{padding: '10px', background: '#e9ecef', borderRadius: '5px', marginTop: '10px'}}>
                        <strong>Manual Test:</strong> To test Direct Navigation, <a href={marketUrl}>click this link</a>.
                        If the page doesn't change and the Play Store doesn't open, the method is blocked.
                    </div>
                </div>

                <div style={{
                    marginTop: '2rem',
                    width: '90%',
                    textAlign: 'left',
                    borderTop: '2px solid #ccc',
                    paddingTop: '2rem'
                }}>
                    <h2>JavaScript Interface Scan</h2>
                    {scanComplete ? (
                        scanResults.length > 0 ? (
                            scanResults.map((iface, index) => (
                                <div key={index} style={{
                                    border: '1px solid #ddd',
                                    padding: '15px',
                                    marginBottom: '15px',
                                    borderRadius: '8px',
                                    background: '#f9f9f9'
                                }}>
                                    <h3 style={{margin: '0 0 10px 0', color: '#0070f3'}}>
                                        Interface Found: <code>window.{iface.name}</code>
                                    </h3>
                                    <strong>Available Methods:</strong>
                                    {iface.methods.length > 0 ? (
                                        <ul style={{listStyle: 'none', paddingLeft: '0'}}>
                                            {iface.methods.map((method, methodIndex) => (
                                                <li key={methodIndex} style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    padding: '8px',
                                                    background: '#fff',
                                                    border: '1px solid #eee',
                                                    marginTop: '5px'
                                                }}>
                                                    <code>{method}()</code>
                                                    <button onClick={() => tryMethod(iface.name, method)}
                                                            style={{cursor: 'pointer', padding: '5px 10px'}}>
                                                        Test
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (<p>No methods found.</p>)}
                                </div>
                            ))
                        ) : (<p><strong>No potential JavaScript interfaces were found.</strong></p>)
                    ) : (<p>Scanning for JS interfaces...</p>)}
                </div>
            </main>
        </div>
    );
}