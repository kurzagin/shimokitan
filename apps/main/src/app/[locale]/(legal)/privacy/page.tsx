import { getDictionary, Locale } from "@shimokitan/utils";
import { InlineMarkdown } from "@shimokitan/ui";
import { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
    const locale = (await params).locale as Locale;
    const dict = getDictionary(locale);
    return {
        title: dict.legal.privacy.title,
        alternates: {
            canonical: `/${locale}/privacy`,
        },
    };
}

export default async function PrivacyPage({ params }: { params: Promise<{ locale: string }> }) {
    const locale = (await params).locale as Locale;
    const dict = getDictionary(locale);
    const p = dict.legal.privacy;

    return (
        <>
            <h1>{p.title}</h1>
            <p>{dict.legal.last_updated}: {dict.legal.last_updated_date}</p>

            {[1, 2, '2_5', 3, 4, 5, 6, 7, 8, 9, 10].map((i) => {
                const section = (p as any)[`s${i}`];
                if (!section) return null;

                return (
                    <div key={i}>
                        <h2>{section.title}</h2>
                        {section.content && <p><InlineMarkdown text={section.content} /></p>}
                        {section.p1 && <p><InlineMarkdown text={section.p1} /></p>}
                        {(section.l1 || section.l2 || section.l3 || section.l4) && (
                            <ul>
                                {section.l1 && <li><InlineMarkdown text={section.l1} /></li>}
                                {section.l2 && <li><InlineMarkdown text={section.l2} /></li>}
                                {section.l3 && <li><InlineMarkdown text={section.l3} /></li>}
                                {section.l4 && <li><InlineMarkdown text={section.l4} /></li>}
                            </ul>
                        )}
                        {section.p2 && <p><InlineMarkdown text={section.p2} /></p>}
                    </div>
                );
            })}
        </>
    );
}
