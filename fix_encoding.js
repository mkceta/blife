const fs = require('fs');
const path = require('path');

const content = `'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { PublicProfileContent } from '@/components/profile/public-profile-content'

function UserProfileContent() {
    const searchParams = useSearchParams()
    const alias = searchParams.get('alias') || searchParams.get('username')

    if (!alias) {
        return <div className="min-h-screen flex items-center justify-center">Usuario no especificado</div>
    }

    return <PublicProfileContent alias={alias} />
}

export default function UserProfilePage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Cargando perfil...</div>}>
            <UserProfileContent />
        </Suspense>
    )
}
`;

const filePath = path.join(process.cwd(), 'app/user/page.tsx');
try {
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    }
    fs.writeFileSync(filePath, content, { encoding: 'utf8' });
    console.log('Successfully wrote app/user/page.tsx with UTF-8 encoding');
} catch (error) {
    console.error('Error writing file:', error);
    process.exit(1);
}
