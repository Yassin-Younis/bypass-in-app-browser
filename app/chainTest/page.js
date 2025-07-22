"use client"
import {useState, useEffect} from 'react';
import Head from 'next/head';

export default function ChainedTestPage() {
    const [isBridgeReady, setIsBridgeReady] = useState(false);
    const [log, setLog] = useState([]);

    const addLog = (message) => {
        setLog(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
    };

    useEffect(() => {
        if (typeof window !== 'undefined' && window.ToutiaoJSBridge) {
            setIsBridgeReady(true);
            addLog('Bridge detected.');
        } else {
            addLog('Error: ToutiaoJSBridge not found.');
        }
    }, []);

    const executeChainedSequence = () => {
        if (!isBridgeReady) {
            alert('Bridge not ready.');
            return;
        }

        setLog([]); // Clear log on new run
        addLog('Starting chained sequence...');

        // --- Define Callbacks First ---
        const preloadCallbackName = `__PRELOAD_CB_${Date.now()}`;
        const openSchemaCallbackName = `__OPEN_SCHEMA_CB_${Date.now()}`;

        // Callback for openSchema (our ultimate goal)
        window[openSchemaCallbackName] = (result) => {
            addLog('SUCCESS: openSchema callback received!');
            addLog('Final Result: ' + JSON.stringify(result, null, 2));
            delete window[preloadCallbackName];
            delete window[openSchemaCallbackName];
        };

        // Callback for preloadMiniApp. This is the key.
        window[preloadCallbackName] = (result) => {
            addLog('Step 1 SUCCESS: preloadMiniApp callback received.');
            addLog('Preload Result: ' + JSON.stringify(result, null, 2));

            // --- NOW we execute Step 2 ---
            addLog('Step 2: Firing openSchema...');
            const openSchemaPayload = {
                "func": "openSchema",
                "params": {"schema": "market://details?id=com.google.android.apps.maps"},
                "__callback_id": openSchemaCallbackName,
                "JSSDK": "1", "namespace": "host", "__msg_type": "callback"
            };

            try {
                window.ToutiaoJSBridge.invokeMethod(JSON.stringify(openSchemaPayload));
            } catch (e) {
                addLog(`Error during openSchema call: ${e.message}`);
            }
        };

        // --- Define Preload Payload ---
        const preloadPayload = {
            "func": "preloadMiniApp",
            "params": {"mini_app_url": "https://microapp/"},
            "__callback_id": preloadCallbackName,
            "JSSDK": "1", "namespace": "host", "__msg_type": "callback"
        };

        // --- Start the Chain by Calling Step 1 ---
        try {
            addLog('Step 1: Firing preloadMiniApp...');
            window.ToutiaoJSBridge.invokeMethod(JSON.stringify(preloadPayload));
        } catch (e) {
            addLog(`Error during preloadMiniApp call: ${e.message}`);
            // Clean up if it fails immediately
            delete window[preloadCallbackName];
            delete window[openSchemaCallbackName];
        }
    };

    return (
        <div>
            <Head>
                <title>Chained Bridge Test</title>
            </Head>

            <main>
                <h1>Chained Asynchronous Bridge Test</h1>
                <p>
                    This test correctly waits for the <code>preloadMiniApp</code> callback before
                    firing <code>openSchema</code>.
                </p>

                <div style={{margin: '2rem 0'}}>
                    <button
                        onClick={executeChainedSequence}
                        disabled={!isBridgeReady}
                        style={{padding: '20px 40px', fontSize: '22px'}}
                    >
                        Run Corrected Sequence
                    </button>
                </div>

                <div style={{width: '90%', textAlign: 'left', marginTop: '1rem'}}>
                    <h3>Execution Log:</h3>
                    <div style={{
                        background: '#111',
                        color: '#eee',
                        padding: '15px',
                        borderRadius: '5px',
                        minHeight: '200px',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-all',
                        fontFamily: 'monospace'
                    }}>
                        {log.join('\n')}
                    </div>
                </div>
            </main>
        </div>
    );
}