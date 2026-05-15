"use client"

import ReactMarkdown from "react-markdown"

interface ContentSectionProps {
    destination: {
        name?: string
        description?: string
    }
}

export default function ContentSection({
    destination
}: ContentSectionProps) {

    if (!destination?.description) return null

    return (

        <section className="bg-[var(--bg)] py-14 md:py-20">

            <div className="mx-auto max-w-4xl px-4 md:px-6">

                <div className="mb-8">

                    <span className="mb-3 inline-flex items-center rounded-full border border-[var(--border)] gth-glass px-4 py-2">

                        <span className="text-[10px] font-black uppercase tracking-[0.32em] text-[var(--text-soft)]">
                            Destination Guide
                        </span>

                    </span>

                    <h2 className="text-2xl font-black tracking-tight text-[var(--text)] md:text-4xl">

                        Explore{" "}

                        <span className="text-[var(--text)]">
                            {destination?.name}
                        </span>

                    </h2>

                </div>

                <article className="rounded-[28px] border border-[var(--border)] bg-[var(--card)] p-6 shadow-[var(--shadow)] md:p-10">

                    <div className="prose max-w-none text-[var(--text-soft)] prose-headings:text-[var(--text)] prose-p:text-[var(--text-soft)] prose-strong:text-[var(--text)] prose-li:text-[var(--text-soft)] prose-a:text-[var(--gold)] hover:prose-a:text-[var(--text)] transition-colors">

                        <ReactMarkdown>
                            {destination.description}
                        </ReactMarkdown>

                    </div>

                </article>

            </div>

        </section>

    )

}