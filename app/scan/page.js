"use client"
import {useState} from 'react';
import Head from 'next/head';

export default function WebViewScannerPage() {
    // State to hold the results of our scan
    const [scanResults, setScanResults] = useState([]);
    // State to manage the button's status
    const [isScanning, setIsScanning] = useState(false);
    const [scanComplete, setScanComplete] = useState(false);

    // This is the core function that will probe the WebView environment
    const startScan = () => {
        setIsScanning(true);
        setScanComplete(false);
        setScanResults([]); // Clear previous results

        const foundInterfaces = [];

        // Keywords to identify potential custom interfaces
        const keywords = ['android', 'app', 'bridge', 'mobile', 'webkit', 'handler'];

        // Iterate over all properties of the global 'window' object
        for (const key in window) {
            try {
                // We are interested in objects that might be injected by the app
                if (typeof window[key] === 'object' && window[key] !== null) {
                    const lowerKey = key.toLowerCase();

                    // Check if the key name contains any of our keywords or is an unusual, non-standard name
                    if (keywords.some(k => lowerKey.includes(k)) || !/^[a-z]/.test(key)) {
                        const methods = [];
                        // Now, let's inspect this object to find its functions (methods)
                        for (const prop in window[key]) {
                            // Ensure we only look at own properties and check if it's a function
                            if (Object.prototype.hasOwnProperty.call(window[key], prop)) {
                                if (typeof window[key][prop] === 'function') {
                                    methods.push(prop);
                                }
                            }
                        }

                        // If we found any methods, it's a strong candidate for a JS bridge
                        if (methods.length > 0) {
                            foundInterfaces.push({
                                name: key, // The name of the interface, e.g., "Android"
                                methods: methods, // The list of functions, e.g., ["showToast", "openLink"]
                            });
                        }
                    }
                }
            } catch (error) {
                // Some properties on `window` can throw an error when accessed (e.g., cross-origin iframes).
                // We can safely ignore these.
                console.warn(`Could not access property: ${key}`, error);
            }
        }

        setScanResults(foundInterfaces);
        setIsScanning(false);
        setScanComplete(true);
    };

    // Function to attempt calling a discovered method
    const tryMethod = (interfaceName, methodName) => {
        const marketUrl = 'market://details?id=com.google.android.apps.maps'; // Example package
        const intentUrl = 'intent://details?id=com.google.android.apps.maps#Intent;scheme=market;package=com.android.vending;end'; // More robust intent URL

        let urlToTry = prompt(`Enter the URL to test with (or press OK for default market:// link):`, marketUrl);
        if (urlToTry === null) return; // User cancelled

        try {
            const interfaceObject = window[interfaceName];
            if (interfaceObject && typeof interfaceObject[methodName] === 'function') {
                alert(`Calling: window.${interfaceName}.${methodName}("${urlToTry}")`);
                // The actual call
                interfaceObject[methodName](urlToTry);
            } else {
                alert('Error: Method or interface no longer exists.');
            }
        } catch (e) {
            alert(`An error occurred while calling the method: ${e.message}`);
        }
    };

    return (
        <div>
            <Head>
                <title>WebView JS Interface Scanner</title>
            </Head>

            <main>
                <h1>WebView JavaScript Interface Scanner</h1>

                <p>
                    Press the button to scan the <code>window</code> object for custom interfaces injected by the native
                    app.
                </p>

                {!scanComplete && (
                    <button onClick={startScan} disabled={isScanning}
                            style={{padding: '15px 30px', fontSize: '18px', cursor: 'pointer'}}>
                        {isScanning ? 'Scanning...' : 'Start Scan'}
                    </button>
                )}

                {scanComplete && (
                    <div style={{marginTop: '2rem', width: '90%', textAlign: 'left'}}>
                        <h2>Scan Results:</h2>
                        {scanResults.length > 0 ? (
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
                                    ) : (
                                        <p>No methods found on this object.</p>
                                    )}
                                </div>
                            ))
                        ) : (
                            <p><strong>No potential JavaScript interfaces were found.</strong></p>
                        )}
                        <button onClick={startScan} style={{width: '100%', padding: '10px', marginTop: '20px'}}>
                            Scan Again
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
}