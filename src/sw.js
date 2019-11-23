importScripts(
    "https://storage.googleapis.com/workbox-cdn/releases/4.3.1/workbox-sw.js"
);

if (workbox) {
    workbox.routing.registerRoute(
        "/",
        new workbox.strategies.StaleWhileRevalidate()
    );

    console.log(`Yay! Workbox is loaded 🎉`)
} else {
    console.log(`Boo! Workbox didn't load 😬`);
}