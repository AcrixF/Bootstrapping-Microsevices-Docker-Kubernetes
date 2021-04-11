const express = require('express');
const fs = require('fs');

const app = express();


const PORT = 3000;

app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.listen(PORT, () => {
    console.log(`Example app listening on port ${PORT}!`);
});

app.get("/video", ((req, res) => {
    const path = './videos/big_buck_bunny_720p_1mb.mp4';
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