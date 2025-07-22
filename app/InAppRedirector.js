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

    // 2. Redirect to mobile browser if all conditions are met
    useEffect(() => {
        if (isInApp && phoneType && !hasRedirected) {
            addLog("All conditions met for redirection (in-app, known phone type, not a loop).");

            const currentUrl = new URL(window.location.href);
            currentUrl.searchParams.set("redirected", "true");
            const targetUrl = phoneType === "android" ? `https://play.google.com/store/apps/details?id=com.adamtllc.Depuff` : phoneType === "ios" ? `https://apps.apple.com/us/app/depuff-ai-debloat-your-face/id6746838126?pt=6746838126` : currentUrl.href;
            addLog(`Constructed target URL: ${targetUrl}`);

            let finalRedirectUrl;
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
                        window.location.href = finalRedirectUrl;
                    }
                }, 2000);

                return () => clearTimeout(timer);
            }
        } else {
            addLog("Skipping redirection logic: conditions not met.");
        }
    }, [isInApp, phoneType, hasRedirected]);

    // Return the same JSX as before
    return (<div style={{fontFamily: 'monospace', padding: '20px', backgroundColor: '#f5f5f5'}}>
        <h1 style={{borderBottom: '1px solid #ccc', paddingBottom: '10px'}}>In-App Browser Redirector Log V2</h1>
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
                    </li>))}
            </ol>
        </div>
        {redirectUrl && (<div style={{
            marginTop: '20px', padding: '15px', backgroundColor: '#fffbe6', border: '1px solid #ffe58f'
        }}>
            <p>Attempting to open this page in your main browser...</p>
            <p>If you are not redirected automatically, please click this link:</p>
            <a href={redirectUrl} style={{wordBreak: 'break-all'}}>Open in Browser</a>
        </div>)}
        {!isInApp && !redirectUrl && (<div style={{
            marginTop: '20px', padding: '15px', backgroundColor: '#e6f7ff', border: '1px solid #91d5ff'
        }}>
            <p>Detection complete. You are already in a standard browser or redirection is not required.</p>
        </div>)}
    </div>);
}