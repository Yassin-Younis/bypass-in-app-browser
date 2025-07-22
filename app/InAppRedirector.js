"use client";

import {useState, useEffect} from "react";
import {useRouter, useSearchParams} from 'next/navigation';
import InAppSpy from "inapp-spy";
import Bowser from "bowser";

export default function InAppRedirector() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [logs, setLogs] = useState([]);
    const [userAgent, setUserAgent] = useState("");
    const [isInApp, setIsInApp] = useState(false);
    const [phoneType, setPhoneType] = useState(undefined);
    const [hasRedirected, setHasRedirected] = useState(false);
    const [redirectUrl, setRedirectUrl] = useState(null);

    const addLog = (message) => {
        setLogs(prevLogs => [...prevLogs, `[${new Date().toLocaleTimeString()}] ${message}`]);
    };

    // 1. Detect if user is in an in-app browser and gather system info
    useEffect(() => {
        addLog("Process started: Initializing detection.");
        try {
            const {isInApp: isInAppFromSpy, appName, ua} = InAppSpy();
            setIsInApp(isInAppFromSpy);
            setUserAgent(ua);
            addLog(`User Agent detected: ${ua}`);
            addLog(`In-app browser check complete. Result: ${isInAppFromSpy}${isInAppFromSpy ? ` (Detected App: ${appName || 'Unknown'})` : ''}.`);

            if (isInAppFromSpy) {
                addLog("Parsing User Agent with Bowser library...");
                const parserFromBowser = Bowser.getParser(ua);
                const osName = parserFromBowser?.getOSName();
                addLog(`Operating System detected: ${osName || 'Unknown'}.`);

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
                        addLog("Could not determine phone type. Redirection will be skipped.");
                }
            } else {
                addLog("Not an in-app browser. No redirection necessary.");
            }

            addLog("Checking URL for 'redirected' parameter to prevent loop...");
            if (searchParams.get("redirected") === "true") {
                setHasRedirected(true);
                addLog("Found 'redirected=true' parameter. Halting redirection process.");

                addLog("Removing 'redirected' parameter from URL using Next Router...");
                const newSearchParams = new URLSearchParams(searchParams.toString());
                newSearchParams.delete('redirected');
                router.replace(`${window.location.pathname}?${newSearchParams.toString()}`, {scroll: false});
                addLog("Removed 'redirected' parameter from URL.");
            } else {
                addLog("No 'redirected' parameter found. Proceeding normally.");
            }
        } catch (error) {
            addLog(`ERROR: An exception occurred during detection: ${error.message}`);
            console.error("Redirection script error:", error);
        }
    }, [router, searchParams]);

    // 2. Handle redirection logic
    useEffect(() => {
        if (isInApp && phoneType && !hasRedirected) {
            addLog("All conditions met for redirection (in-app, known phone type, not a loop).");

            const androidPackageName = "com.adamtllc.Depuff";
            const playStoreWebUrl = `https://play.google.com/store/apps/details?id=${androidPackageName}`;

            const baseUrls = {
                android: `intent://details?id=${androidPackageName}#Intent;scheme=market;package=com.android.vending;S.browser_fallback_url=${encodeURIComponent(playStoreWebUrl)};end;`,
                ios: `https://apps.apple.com/us/app/depuff-ai-debloat-your-face/id6746838126?pt=6746838126`
            };

            const baseTargetUrl = baseUrls[phoneType];
            if (!baseTargetUrl) {
                addLog(`Could not find a base URL for phone type: ${phoneType}`);
                return;
            }

            const urlWithParam = new URL(baseTargetUrl);
            urlWithParam.searchParams.set("redirected", "true");
            const finalRedirectUrl = urlWithParam.toString();

            setRedirectUrl(finalRedirectUrl);
            addLog(`Final redirection URL: ${finalRedirectUrl}`);
            addLog("Starting 2-second timer before redirecting...");

            const timer = setTimeout(() => {
                if (typeof window !== "undefined") {
                    addLog("Timer finished. Attempting auto-redirect...");

                    try {
                        window.location.href = finalRedirectUrl;
                    } catch (e) {
                        addLog("Auto-redirect failed. Waiting for user click.");
                    }
                }
            }, 2000);


            return () => clearTimeout(timer);
        } else {
            addLog("Skipping redirection logic: conditions not met.");
        }
    }, [isInApp, phoneType, hasRedirected]);

    return (
        <div style={{fontFamily: 'monospace', padding: '20px', backgroundColor: '#f5f5f5'}}>
            <h1 style={{borderBottom: '1px solid #ccc', paddingBottom: '10px'}}>In-App Browser Redirector Log V5</h1>
            <div style={{
                backgroundColor: 'white',
                border: '1px solid #ddd',
                padding: '15px',
                maxHeight: '400px',
                overflowY: 'auto'
            }}>
                <ol style={{margin: 0, paddingLeft: '20px'}}>
                    {logs.map((log, index) => (
                        <li key={index} style={{padding: '4px 0', borderBottom: '1px solid #eee'}}>
                            {log.includes("ERROR:") ? <strong style={{color: 'red'}}>{log}</strong> : log}
                        </li>
                    ))}
                </ol>
            </div>

            {redirectUrl && (
                <div style={{
                    marginTop: '20px',
                    padding: '15px',
                    backgroundColor: '#fffbe6',
                    border: '1px solid #ffe58f'
                }}>
                    <p>Attempting to open this page in your main browser...</p>
                    <p>If it doesn’t happen automatically, tap the button below:</p>
                    <a
                        href={redirectUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                            display: 'inline-block',
                            marginTop: '10px',
                            padding: '10px 20px',
                            backgroundColor: '#1890ff',
                            color: 'white',
                            textDecoration: 'none',
                            borderRadius: '5px',
                            fontWeight: 'bold'
                        }}
                    >
                        Open in Browser
                    </a>

                </div>
            )}

            <a
                href={"/scan"}
                target="_blank"
                rel="noopener noreferrer"
                style={{textDecoration: 'none'}}
            >
                Go to scanner
            </a>
            <a
                href={"/fuzzer"}
                target="_blank"
                rel="noopener noreferrer"
                style={{textDecoration: 'none'}}
            >
                Go to fuzzer
            </a>
            <a
                href={"/final-test"}
                target="_blank"
                rel="noopener noreferrer"
                style={{textDecoration: 'none'}}
            >
                Go to final
            </a>


            {!isInApp && !redirectUrl && (
                <div style={{
                    marginTop: '20px',
                    padding: '15px',
                    backgroundColor: '#e6f7ff',
                    border: '1px solid #91d5ff'
                }}>
                    <p>Detection complete. You are already in a standard browser or redirection is not required.</p>
                </div>
            )}
        </div>
    );
}
