const express = require('express');
const fs = require('fs');

const app = express();

const port = 3000;

app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}!`);
});

app.get("/video", ((req, res) => {
    const path = '/Users/acrixf/Desktop/big_buck_bunny_720p_1mb.mp4';
    fs.stat(path, ((err, stats) => {
        if (err) {
            console.error("An error occurred");
            res.sendStatus(500);
            return;
        }
        res.writeHead(200, {
            "Content-Length": stats.size,
            "Content-Type": "video/mp4",
        });
        fs.createReadStream(path).pipe(res);
    }))
}))