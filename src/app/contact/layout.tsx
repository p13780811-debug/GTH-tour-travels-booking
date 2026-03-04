import React from 'react';

export default function ContactLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <section className="contact-container">
            {children}
        </section>
    );
}