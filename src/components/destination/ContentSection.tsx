export default function ContentSection({ destination }: any) {

    return (
        <section className="max-w-5xl mx-auto px-6 py-20 space-y-8">

            <h2 className="text-3xl font-bold text-yellow-400">
                Travel Guide
            </h2>

            <p className="text-gray-300 leading-relaxed">
                {destination.longDescription}
            </p>

        </section>
    )
}