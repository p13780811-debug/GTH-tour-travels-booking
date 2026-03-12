import ReactMarkdown from "react-markdown"

export default function ContentSection({ destination }: any) {

    return (
        <section className="max-w-4xl mx-auto py-20 px-6">

            <div className="prose prose-invert max-w-none">

                <ReactMarkdown>
                    {destination.description}
                </ReactMarkdown>

            </div>

        </section>
    )
}