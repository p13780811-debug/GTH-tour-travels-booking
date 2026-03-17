import fs from "fs";
import https from "https";
import path from "path";
import { cities } from "./src/data/cities.js";

const folder = "public/images/cities";
const IMAGES_PER_CITY = 5;

if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder, { recursive: true });
}

function download(url, filepath, retry = 3) {

    return new Promise((resolve, reject) => {

        https.get(url, (res) => {

            // redirect handle
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                return download(res.headers.location, filepath, retry)
                    .then(resolve)
                    .catch(reject);
            }

            const file = fs.createWriteStream(filepath);

            res.pipe(file);

            file.on("finish", () => {
                file.close();
                resolve();
            });

        }).on("error", (err) => {

            if (retry > 0) {
                console.log("Retry:", filepath);
                setTimeout(() => {
                    download(url, filepath, retry - 1).then(resolve).catch(reject);
                }, 1000);
            } else {
                reject(err);
            }

        });

    });

}

async function run() {

    console.log("Starting image download...\n");

    for (const city of cities) {

        const slug = city.toLowerCase().replace(/\s+/g, "-");

        console.log(`\nCity: ${city}`);

        for (let i = 1; i <= IMAGES_PER_CITY; i++) {

            const filepath = path.join(folder, `${slug}-${i}.jpg`);

            if (fs.existsSync(filepath)) {
                console.log("Skip:", filepath);
                continue;
            }

            const url = `https://source.unsplash.com/featured/1600x900/?${city},travel,landscape&sig=${i}`;

            console.log("Downloading:", `${slug}-${i}`);

            try {
                await download(url, filepath);
                console.log("Saved:", filepath);
            } catch (err) {
                console.log("Failed:", filepath);
            }

        }

    }

    console.log("\nAll downloads finished.");

}

run();