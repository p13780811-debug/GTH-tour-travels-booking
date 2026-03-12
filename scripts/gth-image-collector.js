import fs from "fs"
import path from "path"
import https from "https"
import dotenv from "dotenv"
dotenv.config({ path: ".env.local" })

console.log("PEXELS KEY:", process.env.PEXELS_KEY)


const API_KEY = process.env.PEXELS_KEY

const cities = [
    "paris",
    "goa",
    "manali",
    "jaipur",
    "ladakh",
    "shimla"
]

const folder = "public/images/cities"

if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder, { recursive: true })
}

function fetchImages(city) {

    return new Promise((resolve, reject) => {

        const options = {
            hostname: "api.pexels.com",
            path: `/v1/search?query=${city}+travel&per_page=1`,
            headers: {
                Authorization: API_KEY
            }
        }

        https.get(options, res => {

            let data = ""

            res.on("data", chunk => data += chunk)

            res.on("end", () => {

                const json = JSON.parse(data)

                if (!json.photos || json.photos.length === 0) {
                    reject("No image")
                    return
                }

                const imageUrl = json.photos[0].src.large2x

                resolve(imageUrl)

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

    for (const city of cities) {

        try {

            console.log("Collecting image for:", city)

            const imageUrl = await fetchImages(city)

            const filepath = path.join(folder, `${city}.jpg`)

            await download(imageUrl, filepath)

            console.log("Saved:", filepath)

        } catch (err) {

            console.log("Failed:", city)

        }

    }

    console.log("GTH AI Image Collector Finished")

}

run()