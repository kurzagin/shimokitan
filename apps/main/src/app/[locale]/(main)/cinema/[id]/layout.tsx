
import React from 'react';

export default function ArtifactDetailLayout({
    children,
    modal
}: {
    children: React.ReactNode;
    modal: React.ReactNode;
}) {
    return (
        <>
            {children}
            {modal}
        </>
    );
}
