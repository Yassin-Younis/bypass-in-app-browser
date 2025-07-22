"use client";

// Import necessary dependencies
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from 'next/navigation'; // Import Next.js hooks
import InAppSpy from "inapp-spy"; // For detecting in-app browsers
import Bowser from "bowser"; // For parsing user agent strings

export default function RootLayout() {
    // Initialize Next.js router and search params hooks
    const router = useRouter();
    const searchParams = useSearchParams();

    // State variables for in-app browser detection and redirection
    const [logs, setLogs] = useState([]);
    const [userAgent, setUserAgent] = useState("");
    const [parser, setParser] = useState();
    const [isInApp, setIsInApp] = useState(false);
    const [phoneType, setPhoneType] = useState(undefined);
    const [hasRedirected, setHasRedirected] = useState(false);
    const [redirectUrl, setRedirectUrl] = useState(null);

    // Helper function to log messages to the page
    const addLog = (message) => {
        setLogs(prevLogs => [...prevLogs, `[${new Date().toLocaleTimeString()}] ${message}`]);
    };

    // 1. Detect if user is in an in-app browser and gather system info
    useEffect(() => {
        addLog("Process started: Initializing detection.");

        try {
            // Use InAppSpy to detect in-app browser
            const { isInApp: isInAppFromSpy, appKey, appName, ua } = InAppSpy();
            setIsInApp(isInAppFromSpy);
            setUserAgent(ua);
            addLog(`User Agent detected: ${ua}`);
            addLog(`In-app browser check complete. Result: ${isInAppFromSpy}${isInAppFromSpy ? ` (Detected App: ${appName || 'Unknown'})` : ''}.`);

            if (isInAppFromSpy) {
                // Parse user agent string using Bowser
                addLog("Parsing User Agent with Bowser library...");
                const parserFromBowser = Bowser.getParser(ua);
                setParser(parserFromBowser);
                const osName = parserFromBowser?.getOSName();
                addLog(`Operating System detected: ${osName || 'Unknown'}.`);

                // Determine phone type based on OS
                switch (osName) {
                    case "Android":
                        setPhoneType("android");
                        addLog("Phone type identified as: Android.");
                        break;
                    case "iOS":
                        setPhoneType("ios");
                        addLog("Phone type identified as: iOS.");
                        break;
                    default:
                        setPhoneType(undefined);
                        addLog("Could not determine phone type as Android or iOS. Redirection will be skipped.");
                }
            } else {
                addLog("Not an in-app browser. No redirection necessary.");
            }

            // Check if the URL contains 'redirected' parameter using Next.js useSearchParams
            addLog("Checking URL for 'redirected' parameter to prevent loop...");
            if (searchParams.get("redirected") === "true") {
                setHasRedirected(true);
                addLog("Found 'redirected=true' parameter. This is the destination page. Halting redirection process.");

                // Remove the 'redirected' parameter from the URL using Next.js Router
                // This updates the URL in the browser's history without a page reload.
                addLog("Removing 'redirected' parameter from URL using Next Router...");
                const newSearchParams = new URLSearchParams(searchParams.toString());
                newSearchParams.delete('redirected');
                // router.replace keeps the user on the same page but updates the URL
                router.replace(`${window.location.pathname}?${newSearchParams.toString()}`);
                addLog("Removed 'redirected' parameter from URL.");
            } else {
                addLog("No 'redirected' parameter found. Proceeding normally.");
            }
        } catch (error) {
            addLog(`ERROR: An exception occurred during detection: ${error.message}`);
            console.error("Redirection script error:", error);
        }

    }, [router, searchParams]); // Add router and searchParams to dependency array

    // 2. Redirect to mobile browser if all conditions are met
    useEffect(() => {
        // This effect runs when detection results change
        if (isInApp && phoneType && !hasRedirected) {
            addLog("All conditions met for redirection (in-app, known phone type, not a loop).");

            // Construct the base URL to redirect to (the current page)
            const currentUrl = new URL(window.location.href);
            currentUrl.searchParams.set("redirected", "true"); // Add the loop prevention param
            const targetUrl = currentUrl.href;
            addLog(`Constructed target URL: ${targetUrl}`);

            let finalRedirectUrl;
            // Construct redirection URL based on phone type
            if (phoneType === "android") {
                const urlWithoutScheme = targetUrl.substring(targetUrl.indexOf(":") + 3);
                finalRedirectUrl = `intent:${urlWithoutScheme}#Intent;scheme=https;package=com.android.chrome;end`;
                addLog(`Android detected. Preparing Chrome Intent URL.`);
            } else if (phoneType === "ios") {
                finalRedirectUrl = `x-safari-${targetUrl}`;
                addLog(`iOS detected. Preparing Safari URL scheme.`);
            }

            if (finalRedirectUrl) {
                setRedirectUrl(finalRedirectUrl);
                addLog(`Final redirection URL: ${finalRedirectUrl}`);
                addLog("Starting 2-second timer before redirecting...");

                const timer = setTimeout(() => {
                    if (typeof window !== "undefined") {
                        addLog("Timer finished. REDIRECTING NOW...");
                        // CRITICAL: Use window.location.href for custom URI schemes.
                        // Next.js router.push() is for in-app navigation and will not work here.
                        window.location.href = finalRedirectUrl;
                    }
                }, 2000); // Delay redirection by 2 seconds

                return () => clearTimeout(timer);
            }
        } else {
            addLog("Skipping redirection logic: conditions not met.");
        }
    }, [isInApp, phoneType, hasRedirected]);

    return (
        <div style={{ fontFamily: 'monospace', padding: '20px', backgroundColor: '#f5f5f5' }}>
            <h1 style={{ borderBottom: '1px solid #ccc', paddingBottom: '10px' }}>In-App Browser Redirector Log</h1>
            <div style={{ backgroundColor: 'white', border: '1px solid #ddd', padding: '15px', maxHeight: '400px', overflowY: 'auto' }}>
                <ol style={{ margin: 0, paddingLeft: '20px' }}>
                    {logs.map((log, index) => (
                        <li key={index} style={{ padding: '4px 0', borderBottom: '1px solid #eee' }}>
                            {log.includes("ERROR:") ? <strong style={{color: 'red'}}>{log}</strong> : log}
                        </li>
                    ))}
                </ol>
            </div>
            {redirectUrl && (
                <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#fffbe6', border: '1px solid #ffe58f' }}>
                    <p>Attempting to open this page in your main browser...</p>
                    <p>If you are not redirected automatically within a few seconds, please click this link:</p>
                    <a href={redirectUrl} style={{ wordBreak: 'break-all' }}>Open in Browser</a>
                </div>
            )}
            {!isInApp && (
                <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#e6f7ff', border: '1px solid #91d5ff' }}>
                    <p>Detection complete. You are already in a standard browser. No action needed.</p>
                </div>
            )}
        </div>
    );
}