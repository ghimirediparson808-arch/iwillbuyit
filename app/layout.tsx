import type { Metadata } from 'next';
import '@fontsource/dm-serif-display/400.css';
import '@fontsource/manrope/400.css';
import '@fontsource/manrope/500.css';
import '@fontsource/manrope/600.css';
import '@fontsource/manrope/700.css';
import '@/styles/tokens.css';
import '@/styles/globals.css';
export const metadata: Metadata={title:{default:'I WILL BUY IT — Design. Preview. Print.',template:'%s | I WILL BUY IT'},description:'Discover artwork you love, preview it on your colour, and we’ll print it for you.',icons:{icon:'/assets/brand/favicon-32.png'}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en" suppressHydrationWarning><body><a className="skip-link" href="#main">Skip to content</a>{children}</body></html>}
