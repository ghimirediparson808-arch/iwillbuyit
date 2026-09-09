import {Header} from '@/components/site/Header';
import {PageCurves} from '@/components/site/Decorations';
import {DesignDetail} from '@/components/design-preview/DesignDetail';
export default async function Page({params}:{params:Promise<{slug:string}>}){const {slug}=await params;return <div className="site-page"><Header/><PageCurves/><DesignDetail slug={slug}/></div>}
