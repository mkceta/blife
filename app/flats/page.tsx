import { redirect } from 'next/navigation'

export default function FlatsRedirect() {
    redirect('/home?tab=flats')
}
