import Link from 'next/link';
import {HeroArtwork} from '@/components/site/HeroArtwork';
import {Header} from '@/components/site/Header';
import {Eyebrow,BottomWave} from '@/components/site/Decorations';
export default function Home(){return <div className="landing"><Header/><main id="main" className="hero"><div className="hero-copy"><Eyebrow>DESIGN • PREVIEW • PRINT</Eyebrow><h1>Browse<br/>Your Design</h1><p>Discover artwork you love, preview it<br className="desktop-break"/> on your colour, and we’ll print it for you.</p><div className="hero-actions"><Link className="button" href="/designs">Explore Designs</Link><Link className="text-link" href="/customize">Customize Yours</Link></div></div><HeroArtwork/><BottomWave/></main></div>}
