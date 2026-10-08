"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowIcon, JournalIcon, LeafIcon } from "@/components/icons";
import { formatDuration } from "@/lib/tracking";
import type { JournalEntry } from "@/lib/types";

export default function JournalPage() {
  const [entries, setEntries] = useState<JournalEntry[] | null>(null);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      try { setEntries(JSON.parse(localStorage.getItem("pagdandi:journals") || "[]") as JournalEntry[]); }
      catch { setEntries([]); }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);
  return <main className="inner-page"><header className="site-header"><Link className="brand" href="/"><span><LeafIcon/></span> Pagdandi</Link><nav><Link className="active" href="/journal">Journal</Link><Link href="/about">About</Link></nav></header><section className="journal-page"><p className="eyebrow">Kept on this device</p><h1>Your field<br/><em>journal.</em></h1><p className="lede">A quiet record of what you noticed—not where you went.</p>{entries === null ? <p>Opening your journal…</p> : entries.length === 0 ? <div className="empty-journal"><span><JournalIcon/></span><h2>Your first page is waiting.</h2><p>Take a walk, notice something small, and Gemma will help you remember it.</p><Link href="/">Plan your first walk <ArrowIcon/></Link></div> : <div className="journal-list">{entries.map((entry) => <article key={entry.id}><div className="journal-meta"><span>{new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "long", year: "numeric" }).format(new Date(entry.createdAt))}</span><span>{formatDuration(entry.outsideSeconds)} outside</span></div><h2>{entry.questTitle}</h2><p>{entry.text}</p><footer><span>{entry.completedCount} moments completed</span><span>{formatDuration(entry.screenSeconds)} screen active</span></footer></article>)}</div>}<p className="device-note"><LeafIcon/> These entries never leave this browser. Clearing site data will remove them.</p></section></main>;
}
