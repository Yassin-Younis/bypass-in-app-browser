"use client";
import {useState, useEffect} from 'react';
import Head from 'next/head';

export default function BridgedRedirectTest() {
    const [isBridgeReady, setIsBridgeReady] = useState(false);
    const [log, setLog] = useState([]);

    const addLog = (message) => setLog(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);

    useEffect(() => {
        if (typeof window !== 'undefined' && window.ToutiaoJSBridge) {
            setIsBridgeReady(true);
            addLog('Bridge detected.');
        } else {
            addLog('Error: ToutiaoJSBridge not found.');
        }
    }, []);

    const executeBridgedRedirect = () => {
        if (!isBridgeReady) {
            alert('Bridge not ready.');
            return;
        }
        setLog([]);
        addLog('Attempting bridged redirect...');

        // IMPORTANT: Make sure your redirectToStore API route exists at '/api/redirectToStore'
        // This must be a full, absolute URL.
        const redirectApiUrl = `${window.location.origin}/api/redirectToStore?packageId=com.google.android.apps.maps`;

        addLog(`Targeting our own API for redirect: ${redirectApiUrl}`);

        const payload = {
            "func": "openSchema",
            "params": {"schema": redirectApiUrl},
            "__callback_id": "0", // We don't expect a callback, just navigation
            "JSSDK": "1",
            "namespace": "host",
            "__msg_type": "callback"
        };

        try {
            window.ToutiaoJSBridge.invokeMethod(JSON.stringify(payload));
            addLog('invokeMethod called successfully. If this works, the app should navigate.');
        } catch (e) {
            addLog(`Error during invokeMethod call: ${e.message}`);
        }
    };

    return (
        <div style={{fontFamily: 'sans-serif', padding: '20px'}}>
            <Head><title>Bridged Redirect Test</title></Head>
            <main style={{maxWidth: '800px', margin: 'auto'}}>
                <h1>Final Test: Bridged Redirect</h1>
                <p>
                    This is the last attempt. We will ask the bridge to open a URL to our own server,
                    which will then try to redirect to the Play Store.
                </p>

                <button
                    onClick={executeBridgedRedirect}
                    disabled={!isBridgeReady}
                    style={{width: '100%', padding: '15px', fontSize: '18px', cursor: 'pointer'}}
                >
                    Attempt Bridged Redirect
                </button>

                <div style={{marginTop: '20px'}}>
                    <h3>Execution Log:</h3>
                    <div style={{
                        background: '#111',
                        color: '#eee',
                        padding: '15px',
                        borderRadius: '5px',
                        minHeight: '150px',
                        whiteSpace: 'pre-wrap',
                        fontFamily: 'monospace'
                    }}>
                        {log.join('\n')}
                    </div>
                </div>
            </main>
        </div>
    );
}