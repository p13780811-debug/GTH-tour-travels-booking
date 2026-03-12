import fs from "fs";
import https from "https";
import path from "path";
import { cities } from "./src/data/cities.js";

const folder = "public/images/cities";

if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder, { recursive: true });
}

function download(url, filepath) {
    return new Promise((resolve, reject) => {

        https.get(url, (res) => {

            // redirect handle
            if (res.statusCode === 302 || res.statusCode === 301) {
                return download(res.headers.location, filepath)
                    .then(resolve)
                    .catch(reject);
            }

            const file = fs.createWriteStream(filepath);

            res.pipe(file);

            file.on("finish", () => {
                file.close();
                resolve();
            });

        }).on("error", reject);

    });
}

async function run() {

    for (const city of cities) {

        const url = `https://source.unsplash.com/1600x900/?${city},travel`;

        const filepath = path.join(folder, `${city}.jpg`);

        console.log("Downloading:", city);

        await download(url, filepath);

    }

    console.log("All images downloaded");

}

run();