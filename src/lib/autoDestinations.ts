import { cities } from "@/data/cities"

const imageMap: Record<string, string> = {


    // 🇮🇳 INDIA
    goa: "photo-1512343879784-a960bf40e7f2",
    jaipur: "photo-1477587458883-47145ed94245",
    manali: "photo-1626621341517-bbf3d9990a23",
    darjeeling: "photo-1544460411-10c053153052",
    digha: "photo-1590523277543-a94d2e4eb00b",
    shimla: "photo-1562625867-607fe06db6e0",
    ooty: "photo-1590496794008-383c8070bb25",
    munnar: "photo-1523712999610-f77fbcfc3843",
    rishikesh: "photo-1545105378-824831aa7326",
    varanasi: "photo-1561359313-0639aad49ca6",
    udaipur: "photo-1602643163983-ed0babc39797",
    jodhpur: "photo-1589392131239-17efd8829497",
    amritsar: "photo-1588096344316-f70ca2b63081",
    ladakh: "photo-1599933023673-c2401f8759d0",
    kasol: "photo-1622030232534-7a3f3a8f1585",
    mussoorie: "photo-1582650800045-31f4a4783307",
    pondicherry: "photo-1582200547055-32e6750337c7",
    andaman: "photo-1589985270826-4b7bb135bc9d",
    lakshadweep: "photo-1544550581-5f7ceaf7f992",
    coorg: "photo-1616843413587-9e3a37f7bbd8",

    // 🌏 ASIA
    dubai: "photo-1512453979798-5ea266f8880c",
    bangkok: "photo-1508009603885-50cf7c579367",
    bali: "photo-1537996194471-e657df975ab4",
    singapore: "photo-1525596662741-e94ff9916383",
    phuket: "photo-1589394815844-d4037f1303a7",
    "kuala-lumpur": "photo-1524231757912-21f4fe3a7200",
    tokyo: "photo-1540959733332-eab4deabeeaf",
    seoul: "photo-1444418776041-9c7e33cc5a9c",
    "hong-kong": "photo-1507450491953-248d24eb3efc",
    macau: "photo-1550098612-4828695f2694",
    maldives: "photo-1514282401047-d79a71a590e8",
    colombo: "photo-1552423814-248bc8610427",
    kathmandu: "photo-1542151121-0a67137f687a",
    hanoi: "photo-1555944196-193d5c2d490b",
    "ho-chi-minh": "photo-1528127269322-539801943592",
    jakarta: "photo-1503904423011-9a746594c965",
    manila: "photo-1518509562704-e7c1232ad391",
    taipei: "photo-1470004914212-05527e49370b",
    beijing: "photo-1547981609-4b6bfe67ca0b",
    shanghai: "photo-1548919973-5cdf5916ad52",

    // 🇪🇺 EUROPE
    paris: "photo-1502602898657-3e91760cbb34",
    london: "photo-1513635269975-59663e0ac1ad",
    rome: "photo-1552832230-c0197dd3ef1b",
    barcelona: "photo-1583997051651-8bd1bfac55c4",
    amsterdam: "photo-1512470876302-972faa2aa9a4",
    vienna: "photo-1516550893923-42d28e5677af",
    prague: "photo-1519677190237-755f99c7c523",
    budapest: "photo-1551840538-99fa58bb7582",
    lisbon: "photo-1527275393274-67252277028b",
    athens: "photo-1505995433366-e12047f3f144",
    zurich: "photo-1527668752968-14dc70a27c95",
    geneva: "photo-1533031061327-183313d4b684",
    copenhagen: "photo-1513106580091-1d82408b8cd6",
    stockholm: "photo-1509356843151-3e7d96241e11",
    oslo: "photo-1581467655410-0c2bf55d9d6c",
    helsinki: "photo-1538330621152-4f18ba1ad4b4",
    warsaw: "photo-1519197924294-4ba991a11128",
    krakow: "photo-1519671482749-fd09be7ccebf",
    edinburgh: "photo-1506377585622-bedcbb027afc",
    dublin: "photo-1549918830-11ec21b6a604",

    // 🇺🇸 AMERICA
    "new-york": "photo-1496442226666-8d4d0e62e6e9",
    "los-angeles": "photo-1534190232481-29d0c102454a",
    "las-vegas": "photo-1605833559746-6d16fd329df5",
    miami: "photo-1533106497176-45ae19e68ba2",
    orlando: "photo-1597466599360-3b9775841aec",
    "san-francisco": "photo-1501594907352-04cda38ebc29",
    chicago: "photo-1477959858617-67f85cf4f1df",
    toronto: "photo-1503289021116-59a8a6100a31",
    vancouver: "photo-1559511260-66a654ae982a",
    montreal: "photo-1519176211765-7193a693f18e",
    "mexico-city": "photo-1518105779142-d975b22f1b0a",
    cancun: "photo-1510414842594-a61c69b5ae57",
    rio: "photo-1483729558449-99ef09a8c325",
    "sao-paulo": "photo-1543059152-4092001dd54e",
    "buenos-aires": "photo-1589909202802-8f4aadce1148",
    lima: "photo-1531968455001-5c5272a41129",
    santiago: "photo-1474904200416-6b2b7930f9a2",
    bogota: "photo-1536308037832-1530129ac03d",
    "panama-city": "photo-1554474776-8575084930d6",
    havanna: "photo-1504109586057-7a2ae83d1338",

    // 🕌 MIDDLE EAST
    doha: "photo-1559586616-361e18714958",
    "abu-dhabi": "photo-1512632578888-169bbbc64f33",
    riyadh: "photo-1533311910772-246e499d3012",
    jeddah: "photo-1563294324-4a572a0834ec",
    "kuwait-city": "photo-1563051412-f0da87192801",
    muscat: "photo-1622323719001-f25492822a96",
    amman: "photo-1542668228-391df47039f5",
    jerusalem: "photo-1542851923-448c51a14949",
    "tel-aviv": "photo-1544971587-b842c27f8e14",
    istanbul: "photo-1524231757912-21f4fe3a7200",

    // 🌍 AFRICA
    "cape-town": "photo-1580060839134-75a5edca2e99",
    johannesburg: "photo-1510133769068-081977717466",
    nairobi: "photo-1489392191049-fc10c97e64b6",
    zanzibar: "photo-1586500036706-41963de24d8b",
    marrakech: "photo-1539020140153-e479b7c2b3af",
    casablanca: "photo-1528414457317-742a784d2847",
    cairo: "photo-1539768942893-daf53e448371",
    alexandria: "photo-1540304453527-62f979142a17",
    tunis: "photo-1534067783941-51c9c23ceff3",
    "addis-ababa": "photo-1560947672-97558ec46497",

    // 🇦🇺 AUSTRALIA / NZ
    sydney: "photo-1506973035872-a4ec16b8e8d9",
    melbourne: "photo-1514395462725-fb4566210144",
    brisbane: "photo-1510546020578-a35ad983d9d6",
    perth: "photo-1534050359320-02900022631d",
    adelaide: "photo-1545044846-351ba102b4d5",
    "gold-coast": "photo-1558905200-74944f77c050",
    auckland: "photo-1507699622108-4be3abd695ad",
    queenstown: "photo-1589492477829-5e65395b66cc",
    wellington: "photo-1589492477829-5e65395b66cc",
    christchurch: "photo-1510113827131-07755745f448"
};
const citisMap: Record<string, string> = {
    goa: "beach",
    jaipur: "jaipur-palace",
    manali: "manali-mountains",
    darjeeling: "darjeeling-hills",
    digha: "digha-beach",
    dubai: "dubai-skyline",
    paris: "eiffel-tower",
    bangkok: "bangkok-temple",
    bali: "bali-beach",
    singapore: "singapore-skyline",
    london: "london-bigben",
    "new-york": "new-york-skyline",
    tokyo: "tokyo-city",
    "kuala-lumpur": "petronas-towers",
    maldives: "maldives-island",
    phuket: "phuket-beach"
}
export function generateDestinations() {

    return cities.map((slug, index) => {

        const name =
            slug
                .split("-")
                .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                .join(" ")

        const hotels = Array.from({ length: 10 }).map((_, i) => ({
            name: `${name} Hotel ${i + 1}`,
            price: `₹${(2000 + i * 700).toLocaleString()}`
        }))

        const keyword = imageMap[slug] || `${slug}-travel`

        return {
            slug,
            name,
            description: `Discover ${name}. Compare hotels, tours and travel deals.`,



            heroImage: `https://images.unsplash.com/${imageMap[slug] || "photo-1501785888041-af3ef285b470"}?auto=format&fit=crop&w=1600&q=80`,
            featuredHotel: {
                name: `${name} Grand Resort`,
                location: name,
                price: "Starting ₹4,999",
                whatsapp: "919999999999"
            },

            hotels,

            guides: [
                { name: `${name} Local Guide`, experience: "5 years experience" },
                { name: `${name} Tour Expert`, experience: "7 years experience" }
            ]
        }

    })

}