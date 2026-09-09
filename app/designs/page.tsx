import {Header} from '@/components/site/Header';
import {PageCurves} from '@/components/site/Decorations';
import {Gallery} from '@/components/gallery/Gallery';
export const metadata={title:'Design Gallery'};
export default function Page(){return <div className="site-page"><Header/><PageCurves/><Gallery/></div>}
