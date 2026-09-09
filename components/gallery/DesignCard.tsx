'use client';
import Link from 'next/link';
import {ArrowRight} from 'lucide-react';
import type {Design} from '@/types';
import {useAsset} from '@/lib/hooks';
export function DesignCard({design}:{design:Design}){const src=useAsset(design.thumbnail);return <article className="design-card"><Link href={`/designs/${design.slug}`} className="card-art" aria-label={`Inspect ${design.name}`}>{src?<img src={src} alt={design.description} loading="lazy"/>:<img src="/assets/placeholders/design-placeholder.svg" alt="Artwork preview unavailable"/>}</Link><div className="card-info"><div><h2><Link href={`/designs/${design.slug}`}>{design.name}</Link></h2><p>{design.id}</p></div><Link className="inspect-link" href={`/designs/${design.slug}`}>Inspect<span className="inspect-long"> Design</span><ArrowRight/></Link></div></article>}
