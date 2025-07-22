"use client";
import { useState, useEffect } from 'react';
import Head from 'next/head';

export default function IframeEscapeTest() {
    const [log, setLog] = useState([]);

    const addLog = (message, type = 'info') => {
        const color = type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#333';
        const logEntry = (
            <div style={{ color, borderLeft: `3px solid ${color}`, paddingLeft: '8px', marginBottom: '5px' }}>
                <strong>{new Date().toLocaleTimeString()}:</strong> {message}
            </div>
        );
        setLog(prev => [logEntry, ...prev]);
    };

    // This effect sets up the listener for messages coming *back* from the iframe.
    useEffect(() => {
        const handleIframeResponse = (event) => {
            // We only care about messages that are objects with a 'status' property
            if (typeof event.data === 'object' && event.data.status) {
                if (event.data.status === 'ACK_COMMAND_RECEIVED') {
                    addLog("Communication successful: Iframe acknowledged the command.", 'success');
                    addLog("Now observing to see if navigation occurs or an error is reported...");
                } else if (event.data.status === 'ERROR') {
                    addLog(`Iframe reported an error: ${event.data.message}`, 'error');
                }
            }
        };

        window.addEventListener('message', handleIframeResponse);
        return () => window.removeEventListener('message', handleIframeResponse);
    }, []);

    const executeIframeEscape = () => {
        setLog([]); // Clear log for new test
        addLog("Starting Iframe Sandbox Escape test...");

        // Remove any old iframe first
        document.getElementById('escape-iframe')?.remove();

        addLog("Creating a hidden iframe pointing to '/iframe-child.html'...");
        const iframe = document.createElement('iframe');
        iframe.id = 'escape-iframe';
        iframe.src = '/iframe-child.html'; // Points to the file in /public
        iframe.style.display = 'none';

        // This is the crucial part. We wait for the iframe to be fully loaded before we message it.
        iframe.onload = () => {
            addLog("Iframe has loaded successfully.", "success");
            try {
                const marketUrl = 'market://details?id=com.google.android.apps.maps';
                const payload = {
                    command: 'ATTEMPT_ESCAPE',
                    url: marketUrl
                };

                // Send the command to the iframe
                iframe.contentWindow.postMessage(payload, '*');
                addLog(`Command sent to iframe with URL: ${marketUrl}`);

            } catch (e) {
                addLog(`Error sending postMessage to iframe: ${e.message}`, 'error');
            }
        };

        iframe.onerror = () => {
            addLog("The iframe failed to load. Check the path and network.", 'error');
        };

        document.body.appendChild(iframe);
    };

    return (
        <div style={{ fontFamily: 'sans-serif', padding: '20px' }}>
            <Head><title>Iframe Sandbox Escape</title></Head>
            <main style={{ maxWidth: '800px', margin: 'auto' }}>
                <h1>Out-of-the-Box: Iframe Sandbox Escape</h1>
                <p>
                    This test creates a hidden iframe and then tells it to try and change the main page's URL.
                    This tests for flaws in the WebView's cross-frame security policy.
                </p>

                <button
                    onClick={executeIframeEscape}
                    style={{ width: '100%', padding: '15px', fontSize: '18px', cursor: 'pointer', backgroundColor: '#fd7e14', color: 'white', border: 'none' }}
                >
                    Attempt Iframe Escape
                </button>

                <div style={{ marginTop: '20px' }}>
                    <h3>Execution Log:</h3>
                    <div style={{ background: '#f8f9fa', border: '1px solid #dee2e6', padding: '15px', borderRadius: '5px', minHeight: '200px', fontFamily: 'monospace' }}>
                        {log.length > 0 ? log : 'Awaiting test...'}
                    </div>
                </div>
            </main>
        </div>
    );
}