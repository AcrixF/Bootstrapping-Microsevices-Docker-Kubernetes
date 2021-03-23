const express = require('express');
const http = require("http");

const app = express();

if (!process.env.PORT) {
    throw new Error("Please specify the port number for the HTTP server with the environment variable PORT.");
}

if (!process.env.VIDEO_STORAGE_HOST) {
    throw new Error("Please specify the host name for the video storage microservice in variable VIDEO_STORAGE_HOST.");
}

if (!process.env.VIDEO_STORAGE_PORT) {
    throw new Error("Please specify the port number for the video storage microservice in variable VIDEO_STORAGE_PORT.");
}

const PORT = process.env.PORT;
const VIDEO_STORAGE_HOST = process.env.VIDEO_STORAGE_HOST;
const VIDEO_STORAGE_PORT = parseInt(process.env.VIDEO_STORAGE_PORT);

console.log(`Forwarding video requests to ${VIDEO_STORAGE_HOST}:${VIDEO_STORAGE_PORT}.`);

app.listen(PORT, () => {
    console.log('Video Streaming Microservice Online.');
});

app.get("/video", (req, res) => {
    const forwardRequest = http.request( // Forward the request to the video storage microservice.
        {
            host: VIDEO_STORAGE_HOST,
            port: VIDEO_STORAGE_PORT,
            path: '/video?path=big_buck_bunny_720p_1mb.mp4',
            method: 'GET',
            headers: req.headers
        },
        forwardResponse => {
            res.writeHead(forwardResponse.statusCode, forwardResponse.headers);
            forwardResponse.pipe(res);
        }
    );

    req.pipe(forwardRequest);
});