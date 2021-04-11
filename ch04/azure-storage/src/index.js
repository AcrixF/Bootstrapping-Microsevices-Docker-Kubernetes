const express = require("express");
const azure = require("azure-storage");

const app = express();

const PORT = process.env.PORT;
const STORAGE_ACCOUNT_NAME = process.env.STORAGE_ACCOUNT_NAME;
const STORAGE_ACCESS_KEY = process.env.STORAGE_ACCESS_KEY;

function createBlobService() {
    return azure.createBlobService(STORAGE_ACCOUNT_NAME, STORAGE_ACCESS_KEY);
}

console.log(`Serving videos from Azure storage account ${STORAGE_ACCOUNT_NAME}.`);

app.get("/video", ((req, res) => {
    const videoPath = req.query.path;
    console.log(`Streaming video from path ${videoPath}` )
    const blobService = createBlobService();

    const containerName = "videos";
    blobService.getBlobProperties(containerName, videoPath, ((err, properties) => {
        if (err) {
            console.error(`Error occurred getting properties for video ${containerName}/${videoPath}.`);
            console.error(err && err.stack || err);
            res.sendStatus(500);
            return;
        }

        res.writeHead(200, {
            "Content-Length": properties.contentLength,
            "Content-Type": "video/mp4"
        })

        blobService.getBlobToStream(containerName, videoPath, res, err => {
            if (err) {
                console.error(`Error occurred getting video ${containerName}/${videoPath} to stream.`);
                console.error(err && err.stack || err);
                res.sendStatus(500);
                return;
            }
        });
    }));
}));

app.listen(PORT, () => {
    console.log("Video Storage Microservice online");
})