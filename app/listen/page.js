"use client"
import {useState, useEffect} from 'react';
import Head from 'next/head';

export default function ListenPage() {
    const [isBridgeReady, setIsBridgeReady] = useState(false);
    const [feedback, setFeedback] = useState('Awaiting test...');
    const [callbackResult, setCallbackResult] = useState('');

    // Check for the bridge on page load
    useEffect(() => {
        if (typeof window !== 'undefined' && window.ToutiaoJSBridge && typeof window.ToutiaoJSBridge.invokeMethod === 'function') {
            setIsBridgeReady(true);
            setFeedback('Bridge detected. Ready to listen for callback.');
        } else {
            setIsBridgeReady(false);
            setFeedback('Error: window.ToutiaoJSBridge not found.');
        }
    }, []);

    const executeAndListen = () => {
        if (!isBridgeReady) {
            alert('Cannot execute: ToutiaoJSBridge not found.');
            return;
        }

        // 1. Prepare the listener
        setCallbackResult(''); // Clear previous results
        const callbackName = `__ToutiaoJSBridge_Callback_${Date.now()}`;
        setFeedback(`Executing... Waiting for native bridge to call: window.${callbackName}`);

        // Set a timeout in case the bridge never calls back
        const timeoutId = setTimeout(() => {
            setFeedback(`Timeout: The bridge did not call back within 10 seconds.`);
            // Clean up the global function to avoid memory leaks
            delete window[callbackName];
        }, 10000); // 10 second timeout

        // 2. Create the global listener function that the bridge will call
        window[callbackName] = (result) => {
            // --- THIS IS WHERE WE RECEIVE THE RESULT ---
            console.log("CALLBACK FIRED! Result:", result);
            clearTimeout(timeoutId); // We got a response, so cancel the timeout

            setFeedback('SUCCESS: Callback received from bridge!');

            // The result might be an object or a string. We format it nicely.
            let formattedResult;
            try {
                formattedResult = JSON.stringify(result, null, 2); // Pretty-print JSON
            } catch (e) {
                formattedResult = String(result); // Or just display as a string
            }
            setCallbackResult(formattedResult);

            // Clean up the global function
            delete window[callbackName];
        };


        // 3. Construct the payload with our dynamic callback ID
        const payload = {
            "func": "openSchema",
            "params": {
                "schema": "market://details?id=com.google.android.apps.maps"
            },
            "__callback_id": callbackName, // Use the name of our new listener function
            "JSSDK": "1",
            "namespace": "host",
            "__msg_type": "callback"
        };

        // 4. Execute the command
        try {
            window.ToutiaoJSBridge.invokeMethod(JSON.stringify(payload));
        } catch (e) {
            console.error("Error invoking bridge:", e);
            setFeedback(`Error calling invokeMethod: ${e.message}`);
            alert(`Error calling invokeMethod: ${e.message}`);
            // Clean up if the initial call fails
            clearTimeout(timeoutId);
            delete window[callbackName];
        }
    };

    return (
        <div>
            <Head>
                <title>Bridge Callback Listener</title>
            </Head>

            <main>
                <h1>
                    Bridge Callback Listener
                </h1>

                <p>
                    This test creates a temporary listener function and asks the bridge to call it.
                </p>

                <div style={{margin: '2rem 0'}}>
                    <button
                        onClick={executeAndListen}
                        disabled={!isBridgeReady}
                        style={{
                            padding: '20px 40px',
                            fontSize: '22px',
                            cursor: isBridgeReady ? 'pointer' : 'not-allowed',
                            backgroundColor: isBridgeReady ? '#0070f3' : '#ccc'
                        }}
                    >
                        Execute and Listen for Result
                    </button>
                </div>

                <div style={{width: '90%', textAlign: 'left', marginTop: '1rem'}}>
                    <h3 style={{borderBottom: '1px solid #ddd', paddingBottom: '5px'}}>Test Status</h3>
                    <p><i>{feedback}</i></p>

                    <h3 style={{borderBottom: '1px solid #ddd', paddingBottom: '5px', marginTop: '2rem'}}>Result from
                        Bridge:</h3>
                    <pre style={{
                        background: '#eee',
                        padding: '15px',
                        borderRadius: '5px',
                        minHeight: '100px',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-all'
                    }}>
            {callbackResult || '...'}
          </pre>
                </div>
            </main>
        </div>
    );
}