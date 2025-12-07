import { ImageResponse } from 'next/og'

// Route segment config
export const runtime = 'edge'

// Image metadata
export const size = {
    width: 512,
    height: 512,
}
export const contentType = 'image/png'

// Image generation
export default function Icon() {
    return new ImageResponse(
        (
            // ImageResponse JSX element
            <div
                style={{
                    fontSize: 140,
                    background: '#000000',
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ff00cc',
                    fontWeight: 800,
                    fontFamily: 'sans-serif',
                    letterSpacing: '-0.05em',
                }}
            >
                Blife
            </div>
        ),
        {
            ...size,
        }
    )
}
