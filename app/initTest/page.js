"use client"
import { useState, useEffect } from 'react';
import Head from 'next/head';

export default function InitializeTestPage() {
    const [isBridgeReady, setIsBridgeReady] = useState(false);
    const [feedback, setFeedback] = useState('Awaiting test...');
    const [callbackResult, setCallbackResult] = useState('');

    // Check for the bridge on page load
    useEffect(() => {
        if (typeof window !== 'undefined' && window.ToutiaoJSBridge && typeof window.ToutiaoJSBridge.invokeMethod === 'function') {
            setIsBridgeReady(true);
            setFeedback('Bridge detected. Ready to run initialization test.');
        } else {
            setIsBridgeReady(false);
            setFeedback('Error: window.ToutiaoJSBridge not found.');
        }
    }, []);

    const executeSequence = () => {
        if (!isBridgeReady) {
            alert('Cannot execute: ToutiaoJSBridge not found.');
            return;
        }

        // --- STEP 1: PREPARE THE LISTENER ---
        setCallbackResult('');
        const callbackName = `__INIT_CALLBACK_${Date.now()}`;

        const timeoutId = setTimeout(() => {
            setFeedback(prev => prev + '\n\nTimeout: openSchema did not call back within 10 seconds.');
            delete window[callbackName];
        }, 10000);

        window[callbackName] = (result) => {
            clearTimeout(timeoutId);
            setFeedback('SUCCESS: Callback received from openSchema!');
            setCallbackResult(JSON.stringify(result, null, 2));
            delete window[callbackName];
        };

        // --- STEP 2: DEFINE THE PAYLOADS ---

        // The Preload Payload (based on the PoC)
        const preloadPayload = {
            "func": "preloadMiniApp",
            "params": { "mini_app_url": "https://microapp/" },
            "JSSDK": "1", "namespace": "host", "__msg_type": "callback", "__callback_id": "0"
        };

        // The openSchema Payload with our listener
        const openSchemaPayload = {
            "func": "openSchema",
            "params": { "schema": "market://details?id=com.google.android.apps.maps" },
            "__callback_id": callbackName,
            "JSSDK": "1", "namespace": "host", "__msg_type": "callback"
        };

        // --- STEP 3: EXECUTE THE SEQUENCE ---
        try {
            // Fire the initialization command first
            setFeedback('Step 1: Firing preloadMiniApp...');
            window.ToutiaoJSBridge.invokeMethod(JSON.stringify(preloadPayload));

            // Immediately fire the command we want to test, and listen for its result
            setTimeout(() => {
                setFeedback('Step 1: Fired preloadMiniApp.\nStep 2: Firing openSchema and listening for callback...');
                window.ToutiaoJSBridge.invokeMethod(JSON.stringify(openSchemaPayload));
            }, 200); // A tiny delay to be safe

        } catch (e) {
            clearTimeout(timeoutId);
            delete window[callbackName];
            setFeedback(`An error occurred: ${e.message}`);
        }
    };

    return (
        <div>
            <Head>
                <title>Bridge Initialization Test</title>
            </Head>

            <main >
                <h1>
                    Bridge Initialization Test
                </h1>

                <p >
                    This test fires the <code>preloadMiniApp</code> command before calling <code>openSchema</code> and listening for a result.
                </p>

                <div style={{ margin: '2rem 0' }}>
                    <button
                        onClick={executeSequence}
                        disabled={!isBridgeReady}
                        style={{ padding: '20px 40px', fontSize: '22px' }}
                    >
                        Run Initialization Sequence
                    </button>
                </div>

                <div style={{ width: '90%', textAlign: 'left', marginTop: '1rem' }}>
                    <h3 style={{ borderBottom: '1px solid #ddd', paddingBottom: '5px' }}>Test Log:</h3>
                    <pre style={{ background: '#111', color: '#eee', padding: '15px', borderRadius: '5px', minHeight: '100px', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
            {feedback}
          </pre>

                    <h3 style={{ borderBottom: '1px solid #ddd', paddingBottom: '5px', marginTop: '2rem' }}>Result from openSchema:</h3>
                    <pre style={{ background: '#eee', padding: '15px', borderRadius: '5px', minHeight: '100px', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
            {callbackResult || '...'}
          </pre>
                </div>
            </main>
        </div>
    );
}