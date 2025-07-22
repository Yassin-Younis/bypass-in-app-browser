# In-app browser bypass demo

If you open a link in TikTok's or Instagram's apps, they don't open using the
native browser, but using the respective social network's built-in browser.
This causes serious privacy concerns for once, but according to
stackoverflow, also interferes with basic functions such as printing the
website.

[See demo here.](https://untitaker.github.io/in-app-browser-framebreaker)

To try out the demo, you can:

1. Open the tiktok (or instagram) app.
2. Browse to a popular creator's profile that contains a youtube link
3. Tap the youtube link (will open in-app browser)
4. Enter `google.com` into the youtube searchbar
5. There will be at least one video that has a link to Google in its video descripton, tap it.
6. Search for this repository (or my username).
7. Browse to the above link.
8. It should redirect you back to google but this time in the browser
