import {notFound} from 'next/navigation';
import {AdminSections} from '@/components/admin/AdminSections';
export default async function Page({params}:{params:Promise<{section:string}>}){const {section}=await params;if(!['designs','customers','inventory','analytics','settings','search'].includes(section))notFound();return <AdminSections key={section} section={section}/>}
