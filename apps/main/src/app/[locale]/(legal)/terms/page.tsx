import { getDictionary, Locale } from "@shimokitan/utils";
import { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
    const locale = (await params).locale as Locale;
    const dict = getDictionary(locale);
    return {
        title: dict.legal.terms.title,
        alternates: {
            canonical: `/${locale}/terms`,
        },
    };
}
import { InlineMarkdown } from "@shimokitan/ui";

export default async function TermsPage({ params }: { params: Promise<{ locale: string }> }) {
    const locale = (await params).locale as Locale;
    const dict = getDictionary(locale);
    const t = dict.legal.terms;

    return (
        <>
            <h1>{t.title}</h1>
            <p>{dict.legal.last_updated}: {dict.legal.last_updated_date}</p>

            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14].map((i) => {
                const section = (t as any)[`s${i}`];
                if (!section) return null;

                return (
                    <div key={i}>
                        <h2>{section.title}</h2>
                        {section.content && <p><InlineMarkdown text={section.content} /></p>}
                        {section.p1 && <p><InlineMarkdown text={section.p1} /></p>}
                        {(section.l1 || section.l2 || section.l3 || section.l4 || section.l5) && (
                            <ul>
                                {section.l1 && <li><InlineMarkdown text={section.l1} /></li>}
                                {section.l2 && <li><InlineMarkdown text={section.l2} /></li>}
                                {section.l3 && <li><InlineMarkdown text={section.l3} /></li>}
                                {section.l4 && <li><InlineMarkdown text={section.l4} /></li>}
                                {section.l5 && <li><InlineMarkdown text={section.l5} /></li>}
                            </ul>
                        )}
                        {section.p2 && <p><InlineMarkdown text={section.p2} /></p>}
                    </div>
                );
            })}
        </>
    );
}
