import fs from "fs"
import path from "path"
import https from "https"
import dotenv from "dotenv"

dotenv.config({ path: ".env.local" })

const API_KEY = process.env.PEXELS_KEY

const cities = [
    "paris", "goa", "manali", "jaipur", "ladakh", "shimla"
]

const folder = "public/images/cities/gallery"

if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder, { recursive: true })
}

const MAX_DOWNLOAD = 500
const PER_CITY = 3

let downloaded = 0

function delay(ms) {
    return new Promise(r => setTimeout(r, ms))
}

function fetchImages(city) {

    return new Promise((resolve, reject) => {

        const options = {
            hostname: "api.pexels.com",
            path: `/v1/search?query=${city}+travel&per_page=${PER_CITY}`,
            headers: { Authorization: API_KEY }
        }

        https.get(options, res => {

            let data = ""

            res.on("data", chunk => data += chunk)

            res.on("end", () => {

                const json = JSON.parse(data)

                if (!json.photos) {
                    reject("No photos")
                    return
                }

                const images = json.photos.map(p => p.src.large2x)

                resolve(images)

            })

        }).on("error", reject)

    })

}

function download(url, filepath) {

    return new Promise((resolve, reject) => {

        https.get(url, res => {

            const file = fs.createWriteStream(filepath)

            res.pipe(file)

            file.on("finish", () => {
                file.close()
                resolve()
            })

        }).on("error", reject)

    })

}

async function run() {

    if (!fs.existsSync(folder)) {
        fs.mkdirSync(folder, { recursive: true })
    }

    for (const city of cities) {

        if (downloaded >= MAX_DOWNLOAD) {
            console.log("Daily limit reached")
            break
        }

        try {

            console.log("Collecting images:", city)

            const images = await fetchImages(city)

            let i = 0

            for (const img of images) {

                const filepath = path.join(folder, `${city}-${i}.jpg`)

                await download(img, filepath)

                downloaded++

                console.log("Saved:", filepath)

                i++

                await delay(1200) // safe delay

            }

        } catch (err) {

            console.log("Failed:", city)

        }

    }

    console.log("Downloaded:", downloaded)

}

run()