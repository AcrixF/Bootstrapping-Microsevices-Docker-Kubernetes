const express = require("express");
const fs = require("fs");
const amqp = require("amqplib");

if (!process.env.RABBIT) {
    throw new Error("Please specify the name of the RabbitMQ host using environment variable RABBIT");
}

const RABBIT = process.env.RABBIT;

// Connect to the RabbitMQ server.
function connectRabbit() {
    console.log(`Connecting to RabbitMQ server at ${RABBIT}.`);

    return amqp.connect(RABBIT) // Connect to the RabbitMQ server.
        .then(connection => {
            console.log("Connected to RabbitMQ.");

            return connection.createChannel()
                .then(messageChannel => {
                    return messageChannel.assertExchange("viewed", "fanout")
                        .then(() => {
                            return messageChannel;
                        });
                });
        });
}

function sendViewedMessage(messageChannel, videoPath) {
    console.log(`Publishing message on "viewed" exchange.`);

    const msg = { videoPath: videoPath };
    const jsonMsg = JSON.stringify(msg);
    messageChannel.publish("viewed", "", Buffer.from(jsonMsg)); // Publish message to the "viewed" exchange.
}

function setupHandlers(app, messageChannel) {
    app.get("/video", (req, res) => {
        const videoPath = "./videos/SampleVideo_1280x720_1mb.mp4";
        fs.stat(videoPath, (err,stats) => {
            if (err) {
                console.error("An error occurred");
                res.sendStatus(500);
                return;
            }

            res.writeHead(200, {
                "Content-Length": stats.size,
                "Content-Type": "video/mp4",
            });

            fs.createReadStream(videoPath).pipe(res);
            sendViewedMessage(messageChannel, videoPath); // Send message to history microservice
        })
    })
}

function startHttpServer(messageChannel) {
    return new Promise((resolve, reject) => {
        const app = express();
        setupHandlers(app, messageChannel);

        const port = process.env.PORT && parseInt(process.env.PORT) || 3000;
        app.listen(port, () => resolve());
    });
}

function main() {
    return connectRabbit()
        .then(messageChannel => {
            return startHttpServer(messageChannel);
        });
}

main()
    .then(() => console.log("Video Streaming Microservice online."))
    .catch(err => {
        console.error("Video Streaming Microservice failed to start.");
        console.error(err && err.stack || err);
    });