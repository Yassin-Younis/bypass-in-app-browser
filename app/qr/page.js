"use client";
import { useState, useEffect } from 'react';
import Head from 'next/head';

// A simple component to generate a QR Code using an external API
// In a real app, you might use a library like 'qrcode.react'
const QRCode = ({ url }) => {
    const encodedUrl = encodeURIComponent(url);
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodedUrl}`;
    return <img src={qrApiUrl} alt="QR Code" width="250" height="250" />;
};

export default function HailMaryPage() {
    const [showQrModal, setShowQrModal] = useState(false);
    const marketUrl = 'market://details?id=com.google.android.apps.maps';

    const handleOpenInstructions = () => {
        setShowQrModal(true);
    };

    return (
        <div style={{ fontFamily: 'sans-serif', textAlign: 'center', padding: '20px' }}>
            <Head><title>Continue Setup</title></Head>

            <main style={{ maxWidth: '600px', margin: 'auto' }}>
                <h1>One Final Step</h1>
                <p style={{ fontSize: '1.2em', color: '#555' }}>
                    To securely connect to the Play Store, please use your device's camera.
                </p>

                <button
                    onClick={handleOpenInstructions}
                    style={{
                        padding: '20px 40px',
                        fontSize: '22px',
                        cursor: 'pointer',
                        backgroundColor: '#28a745',
                        color: 'white',
                        border: 'none',
                        borderRadius: '10px',
                        marginTop: '20px'
                    }}
                >
                    Tap Here to Continue
                </button>

                {showQrModal && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                        backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', zIndex: 1000
                    }}>
                        <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '15px', textAlign: 'center', maxWidth: '90%' }}>
                            <h2 style={{marginTop: 0}}>Scan to Open in Play Store</h2>
                            <QRCode url={marketUrl} />
                            <p style={{fontWeight: 'bold'}}>Point your phone's camera at this QR code.</p>
                            <p>Your phone will automatically detect it and prompt you to open the store.</p>
                            <button onClick={() => setShowQrModal(false)} style={{marginTop: '10px', padding: '10px 20px'}}>Close</button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}