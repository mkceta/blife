import { redirect } from 'next/navigation'

interface PageProps {
    params: Promise<{
        id: string
    }>
}

export default async function ListingRedirectPage(props: PageProps) {
    const params = await props.params;
    // Redirect /market/[id] -> /market/product?id=[id]
    // This fixes 404s from old notifications or shared links
    redirect(`/market/product?id=${params.id}`)
}
