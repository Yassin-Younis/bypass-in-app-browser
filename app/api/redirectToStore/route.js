import {NextResponse} from 'next/server';
export const dynamic = "force-dynamic";

// The function is named GET to handle GET requests.
// The first argument is the Request object.
export async function GET(request) {
    // 1. Get the search parameters from the request URL.
    const {searchParams} = new URL(request.url);

    // 2. Get the specific 'packageId' parameter.
    const packageId = searchParams.get('packageId');

    // 3. Validate the input.
    if (!packageId) {
        // For API routes, it's better to return a JSON error response.
        return NextResponse.json(
            {error: 'The "packageId" query parameter is required.'},
            {status: 400}
        );
    }

    // 4. Construct the target URL.
    const targetUrl = `market://details?id=${packageId}`;

    // 5. Log for debugging on the server.
    console.log(`App Router API Hit: Redirecting to ${targetUrl}`);

    // 6. Use NextResponse.redirect() to perform the redirect.
    // This correctly sends a 302 redirect response.
    return NextResponse.redirect(targetUrl);
}