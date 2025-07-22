"use client"
import { useState, useEffect } from 'react';
import Head from 'next/head';

// --- Our Fuzzing Library ---
// We define all the parts we want to combine here.

const FUNCTION_NAMES = [
    'open_url', 'openUrl', 'openlink', 'openLink', 'open', 'start_activity',
    'startActivity', 'navigate', 'goto', 'router.open_url', 'open_browser', 'openBrowser'
];

const EVENT_NAMES = [
    'open_url', 'openUrl', 'navigate', 'openLink', 'app.open_url', 'router.open_url'
];

const URL_KEYS = ['url', 'uri', 'link', 'href', 'targetUrl'];

const TARGET_URL = 'market://details?id=com.google.android.apps.maps';

// This function generates all the possible JSON payloads
const generatePayloads = () => {
    const payloads = [];

    // Type 1: {"function": "...", "args": {...}}
    for (const func of FUNCTION_NAMES) {
        for (const key of URL_KEYS) {
            payloads.push(JSON.stringify({
                function: func,
                args: { [key]: TARGET_URL },
                __callback_id: `cb_${Date.now()}` // Add a callback for good measure
            }));
        }
    }

    // Type 2: {"event": "...", "params": {...}}
    for (const event of EVENT_NAMES) {
        for (const key of URL_KEYS) {
            payloads.push(JSON.stringify({
                event: event,
                params: { [key]: TARGET_URL },
                __callback_id: `cb_${Date.now()}`
            }));
        }
    }

    // Type 3: Simple top-level structure
    for (const func of FUNCTION_NAMES) {
        payloads.push(JSON.stringify({
            function: func,
            url: TARGET_URL // A common simple pattern
        }));
    }

    // Type 4: Payload as a stringified inner JSON (a common pattern)
    for (const func of FUNCTION_NAMES) {
        for (const key of URL_KEYS) {
            payloads.push(JSON.stringify({
                function: func,
                args: JSON.stringify({ [key]: TARGET_URL })
            }));
        }
    }

    return payloads;
};


export default function FuzzerPage() {
    const [isFuzzing, setIsFuzzing] = useState(false);
    const [currentPayload, setCurrentPayload] = useState('');
    const [currentIndex, setCurrentIndex] = useState(0);
    const [totalPayloads, setTotalPayloads] = useState(0);
    const [isBridgeFound, setIsBridgeFound] = useState(false);
    const [allPayloads, setAllPayloads] = useState([]);

    // Check for the bridge when the component mounts
    useEffect(() => {
        if (typeof window !== 'undefined' && window.ToutiaoJSBridge && typeof window.ToutiaoJSBridge.invokeMethod === 'function') {
            setIsBridgeFound(true);
            const generated = generatePayloads();
            setAllPayloads(generated);
            setTotalPayloads(generated.length);
        }
    }, []);

    const startFuzzing = () => {
        if (!isBridgeFound) return;
        setIsFuzzing(true);
        setCurrentIndex(0);
    };

    const stopFuzzing = () => {
        setIsFuzzing(false);
    }

    // The core loop effect
    useEffect(() => {
        if (!isFuzzing || currentIndex >= totalPayloads) {
            if(isFuzzing) setIsFuzzing(false); // Stop if we've finished
            return;
        }

        const payload = allPayloads[currentIndex];
        setCurrentPayload(payload);

        // THE ACTUAL CALL TO THE BRIDGE
        try {
            window.ToutiaoJSBridge.invokeMethod(JSON.parse(payload));
        } catch(e) {
            console.error("Error parsing/invoking payload: ", payload, e);
        }

        // Set a timer to move to the next payload
        const timer = setTimeout(() => {
            setCurrentIndex(prevIndex => prevIndex + 1);
        }, 700); // 700ms delay between attempts

        // Cleanup function to stop the timer if the component unmounts or fuzzing stops
        return () => clearTimeout(timer);

    }, [isFuzzing, currentIndex, allPayloads, totalPayloads]);

    return (
        <div>
            <Head>
                <title>ToutiaoJSBridge Fuzzer</title>
            </Head>

            <main>
                <h1><code>ToutiaoJSBridge</code> Fuzzer</h1>

                {!isBridgeFound ? (
                    <div style={{ padding: '20px', background: '#f8d7da', border: '1px solid #f5c6cb', borderRadius: '8px' }}>
                        <h2>Error: Bridge Not Found</h2>
                        <p><code>window.ToutiaoJSBridge.invokeMethod</code> was not found on this page.</p>
                    </div>
                ) : (
                    <>
                        <p >
                            This page will automatically test <strong>{totalPayloads}</strong> different JSON payloads with <code>invokeMethod()</code>.
                            <br />
                            Watch the screen. The last payload displayed before the app switches is the winner.
                        </p>

                        <div style={{ margin: '2rem 0' }}>
                            {!isFuzzing ? (
                                <button onClick={startFuzzing} style={{ padding: '20px 40px', fontSize: '22px', cursor: 'pointer', background: '#28a745', color: 'white', border: 'none' }}>
                                    Start Fuzzing
                                </button>
                            ) : (
                                <button onClick={stopFuzzing} style={{ padding: '20px 40px', fontSize: '22px', cursor: 'pointer', background: '#dc3545', color: 'white', border: 'none' }}>
                                    Stop Fuzzing
                                </button>
                            )}
                        </div>

                        {isFuzzing && (
                            <div style={{ width: '90%', textAlign: 'left', border: '2px solid #0070f3', padding: '20px', borderRadius: '8px' }}>
                                <h3 style={{ marginTop: 0 }}>Testing: {currentIndex + 1} / {totalPayloads}</h3>
                                <p><strong>Current Payload:</strong></p>
                                <code style={{ background: '#eee', padding: '10px', display: 'block', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                                    {currentPayload}
                                </code>
                            </div>
                        )}

                        {currentIndex >= totalPayloads && totalPayloads > 0 && !isFuzzing &&
                            <p><strong>Fuzzing complete. If nothing happened, none of these payloads worked.</strong></p>
                        }
                    </>
                )}
            </main>
        </div>
    );
}