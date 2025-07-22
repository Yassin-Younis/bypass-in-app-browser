"use client"
/*
  This code is used to detect if the user is in an in-app browser (e.g., Instagram, LinkedIn, TikTok) and redirect to a mobile browser if they are.
  It uses the InAppSpy library to detect in-app browsers and the Bowser library to parse user agent strings.
  It then determines the phone type based on the OS and constructs the redirection URL based on the phone type.
  It also checks if the URL contains the 'redirected' parameter to prevent infinite redirect loop and removes the 'redirected' parameter from the URL.
  It then redirects to the mobile browser if the user is in an in-app browser.
  basicly:
    for android, go to:
        intent:${baseUrl}#Intent;scheme=https;package=com.android.chrome;end
    for ios, go to:
        x-safari-${baseUrl}
 */

// Import necessary dependencies
import {useState, useEffect} from "react";
import InAppSpy from "inapp-spy"; // For detecting in-app browsers
import Bowser from "bowser"; // For parsing user agent strings


export default function RootLayout() {
    // State variables for in-app browser detection and redirection
    const [userAgent, setUserAgent] = useState("");
    const [parser, setParser] = useState();
    const [isInApp, setIsInApp] = useState(false);
    const [phoneType, setPhoneType] = useState(undefined);
    const [hasRedirected, setHasRedirected] = useState(false);

    // Detect if user is in an in-app browser (e.g., Instagram, LinkedIn, TikTok)
    useEffect(() => {
        // Use InAppSpy to detect in-app browser
        const {isInApp: isInAppFromSpy, appKey, appName, ua} = InAppSpy();
        setIsInApp(isInAppFromSpy);
        setUserAgent(ua);

        if (isInAppFromSpy) {
            // Parse user agent string using Bowser
            const parserFromBowser = Bowser.getParser(ua);
            setParser(parserFromBowser);

            // Determine phone type based on OS
            switch (parserFromBowser?.getOSName()) {
                case "Android":
                    setPhoneType("android");
                    break;
                case "iOS":
                    setPhoneType("ios");
                    break;
                default:
                    setPhoneType(undefined);
            }
        }

        // Check if the URL contains the 'redirected' parameter to prevent infinite redirect loop
        const url = new URL(window.location.href);
        if (url.searchParams.get("redirected") === "true") {
            setHasRedirected(true);
            // Remove the 'redirected' parameter from the URL
            url.searchParams.delete("redirected");
            window.history.replaceState({}, "", url.toString());
        }
    }, []);

    // Redirect to mobile browser if user is in an in-app browser
    useEffect(() => {
        if (isInApp && phoneType && !hasRedirected) {
            const timer = setTimeout(() => {
                if (typeof window !== "undefined") {
                    // Construct redirection URL based on phone type
                    if (phoneType === "android") {
                        const url = "google.com"; // without https://
                        window.location.href = `intent:${url}?redirected=true#Intent;scheme=https;package=com.android.chrome;end`; // open in chrome browser

                        // open in default browser (most of the time it is not chrome, that is why open in chrome browser is preferred)
                        // window.location.href = `intent:${url}?redirected=true#Intent;end`; // open in default browser
                    } else if (phoneType === "ios") {
                        const baseUrl = "https://www.google.com"; // with https://
                        window.location.href = `x-safari-${baseUrl}?redirected=true`; // open in safari browser

                        // open in shortcuts app -> which will navigate to the default browser of the ios device (not recommended, because it is opening shortcuts app)
                        // window.location.href =  `shortcuts://x-callback-url/run-shortcut?name=${crypto.randomUUID()}&x-error=${encodeURIComponent("https://example.com")}`
                    }
                }
            }, 2000); // Delay redirection by 2 seconds

            // Clean up timer on component unmount
            return () => clearTimeout(timer);
        }
    }, [isInApp, phoneType, hasRedirected]);

    return (
        <div>
            In App Redirct
        </div>
    );
}