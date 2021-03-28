const express = require("express");
const mongodb = require("mongodb");
const bodyParser = require("body-parser");
const amqp = require("amqplib");


if (!process.env.DBHOST) {
    throw new Error("Please specify the databse host using environment variable DBHOST.");
}

if (!process.env.DBNAME) {
    throw new Error("Please specify the name of the database using environment variable DBNAME");
}

if (!process.env.RABBIT) {
    throw new Error("Please specify the name of the RabbitMQ host using environment variable RABBIT");
}

const DBHOST = process.env.DBHOST;
const DBNAME = process.env.DBNAME;
const RABBIT = process.env.RABBIT;


// Connect to the database.
function connectDb() {
    return mongodb.MongoClient.connect(DBHOST)
        .then(client => {
            return client.db(DBNAME);
        })
}

//Connect to the RabbitMQ server.
function connectRabbit() {
    console.log(`Connecting to RabbitMQ server at ${RABBIT}.`);
    return amqp.connect(RABBIT)
        .then(messagingConnection => {
            console.log("Connected tpo RabbitMQ.");
            return messagingConnection.createChannel();
        });
}

// Setup event handlers.
function setupHandlers(app, db, messageChannel) {
   const videosCollection = db.collection("videos");

   function consumeViewedMessage(msg) {
       console.log("Received a 'viewed' message.");

       const parseMsg = JSON.parse(msg.content.toString());
       return videosCollection.insertOne({videoPath: parseMsg.videoPath})
           .then(() => {
               console.log("Acknowledging message was handled.");
               messageChannel.ack(msg);
           });
   }

   return messageChannel.assertQueue("viewed", {})
       .then(() => {
           console.log("Asserted that the 'viewed' queue exists.");
           return messageChannel.consume("viewed", consumeViewedMessage);
       });
}

// Start the HTTP server.
function startHttpServer(db, messageChannel) {
    return new Promise(resolve => { // Wrap in a promise so we can be notified when the server has started.
        const app = express();
        app.use(bodyParser.json()); // Enable JSOn body for HTTP requests

        setupHandlers(app, db, messageChannel);

        const port = process.env.PORT && parseInt(process.env.PORT) || 3000;
        app.listen(port, () => {
            resolve(); // HTTP server is listening, resolve the promise.
        });
    });
}

// Application entry point.
function main() {
   return connectDb()
       .then(db => {
           return connectRabbit()
               .then(messageChannel => {
                   return startHttpServer(db, messageChannel)
               })
       })
}

main()
    .then(() => console.log("History Microservice online."))
    .catch(err => {
        console.error("History Microservice failed to start.");
        console.error(err && err.stack || err);
    });