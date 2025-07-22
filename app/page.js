import {Suspense} from 'react';
import InAppRedirector from './InAppRedirector';

function Loading() {
    return (
        <div style={{fontFamily: 'monospace', padding: '20px', backgroundColor: '#f5f5f5'}}>
            <h1 style={{borderBottom: '1px solid #ccc', paddingBottom: '10px'}}>In-App Browser Redirector</h1>
            <div style={{backgroundColor: 'white', border: '1px solid #ddd', padding: '15px'}}>
                <p>Initializing detection...</p>
            </div>
        </div>
    );
}

export default function Page() {
    return (
        <Suspense fallback={<Loading/>}>
            <InAppRedirector/>
        </Suspense>
    );
}