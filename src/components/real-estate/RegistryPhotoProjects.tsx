"use client";

import {useEffect, useState} from "react";
import Image from "next/image";
import Link from "next/link";
import {supabase} from "@/lib/supabase";
import {publishedMediaUrl} from "@/lib/property-media/published-media";
import {validPropertySlug} from "@/lib/real-estate/property-seo";

type Project = {id: number; slug: string; title: string; city: string | null; rera_id: string; mediaId: string; attribution: string | null};

/** Public approved photos only. Registry projects never become sale/rent offers. */
export default function RegistryPhotoProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5_000);
    async function load() {
      try {
        const media = await supabase.from("property_published_media")
          .select("id,project_id,attribution").eq("media_type", "photo")
          .order("is_primary", {ascending: false}).order("published_at", {ascending: false})
          .limit(60).abortSignal(controller.signal);
        if (media.error || !media.data?.length) return;
        const ids = [...new Set(media.data.map(row => Number(row.project_id)))].filter(id => Number.isSafeInteger(id) && id > 0);
        if (!ids.length) return;
        const records = await supabase.from("properties")
          .select("id,slug,title,city,rera_id,status").in("id", ids)
          .in("source_type", ["registry", "rera"]).ilike("ingestion_source", "%maharera%")
          .abortSignal(controller.signal);
        if (records.error || !records.data || controller.signal.aborted) return;
        const seen = new Set<number>();
        const cards: Project[] = [];
        for (const photo of media.data) {
          const project = records.data.find(row => Number(row.id) === Number(photo.project_id));
          if (!project || project.status === "archived" || seen.has(Number(project.id)) || !validPropertySlug(project.slug) ||
              typeof project.title !== "string" || project.title.trim().length < 3 ||
              !/^P[0-9]{11}$/.test(project.rera_id || "") || !publishedMediaUrl(photo.id)) continue;
          seen.add(Number(project.id));
          cards.push({...project, id: Number(project.id), mediaId: photo.id, attribution: photo.attribution});
          if (cards.length === 12) break;
        }
        setProjects(cards);
      } catch { /* Optional discovery section fails closed; registry lookup stays available. */ }
    }
    void load();
    return () => { clearTimeout(timeout); controller.abort(); };
  }, []);
  if (!projects.length) return null;
  return <section aria-labelledby="registry-photo-projects" className="mt-10">
    <p className="gold-text text-xs uppercase tracking-widest">Registry research</p>
    <h2 id="registry-photo-projects" className="mt-3 text-2xl font-semibold">Registry projects with approved photographs</h2>
    <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--text-soft)]">Explore recorded MahaRERA projects. Approved photography is separate from registration, current availability and GTH verification. These cards are not sale or rental offers.</p>
    <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {projects.map(project => <article key={project.id} className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)]">
        <Link href={`/real-estate/${encodeURIComponent(project.slug)}`} className="block">
          <div className="relative aspect-video"><Image src={publishedMediaUrl(project.mediaId)} alt={`Approved photograph of ${project.title}`} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" className="object-cover" unoptimized/></div>
          <div className="p-4"><p className="text-xs text-[var(--text-soft)]">Registry project · Availability unconfirmed</p><h3 className="mt-2 font-semibold">{project.title}</h3><p className="mt-2 text-sm">{project.city} · {project.rera_id}</p><p className="mt-3 text-sm underline">View recorded project details</p></div>
        </Link>
        {project.attribution && <p className="px-4 pb-4 text-xs text-[var(--text-soft)]">Photo: {project.attribution}</p>}
      </article>)}
    </div>
    <Link href="/real-estate/registry" className="gth-btn mt-5 inline-flex">Search all registry records</Link>
  </section>;
}
