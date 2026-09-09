import {Header} from '@/components/site/Header';
import {PageCurves} from '@/components/site/Decorations';
import {Customize} from '@/components/customize/Customize';
export const metadata={title:'Customize Your Design'};
export default function Page(){return <div className="site-page"><Header/><PageCurves/><Customize/></div>}
