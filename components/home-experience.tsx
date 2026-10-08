"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowIcon, CameraIcon, CheckIcon, ClockIcon, LeafIcon, LocationIcon, SparkIcon, VolumeIcon } from "@/components/icons";
import { ProviderBadge } from "@/components/provider-badge";
import { formatDuration } from "@/lib/tracking";
import type { JournalEntry, Mood, Quest } from "@/lib/types";

const durations = [15, 30, 60] as const;
const moods: Array<{ value: Mood; label: string; icon: string }> = [
  { value: "calm", label: "Calm", icon: "◡" },
  { value: "energetic", label: "Energetic", icon: "↗" },
  { value: "curious", label: "Curious", icon: "✦" },
];

const sampleQuest: Quest = {
  title: "The small wonders trail",
  intro: "A gentle sample walk for when Gemma is not connected yet. Keep to a familiar, public route.",
  missions: [
    { id: "sky", type: "observe", text: "Find the softest edge in the sky—where a cloud, branch, or rooftop meets the light.", spokenText: "Find the softest edge where something meets the sky." },
    { id: "sounds", type: "listen", text: "Stand still and count three layers of sound: near, middle, and far away.", spokenText: "Pause and notice one near, one middle, and one far sound." },
    { id: "green", type: "find", text: "Look for three different shades of green without leaving your path.", spokenText: "Find three shades of green from the path." },
    { id: "steps", type: "move", text: "For twenty slow steps, notice how your feet meet the ground.", spokenText: "Take twenty slow steps and notice the ground." },
  ],
};

type Stage = "setup" | "loading" | "walk" | "finish";
type WeatherData = { label: string; area: string };

function timeOfDay() {
  const hour = new Date().getHours();
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  if (hour < 21) return "evening";
  return "night";
}

function weatherCode(code: number) {
  if (code === 0) return "clear";
  if (code <= 3) return "partly cloudy";
  if (code <= 67) return "rainy";
  if (code <= 77) return "snowy";
  if (code <= 82) return "showery";
  return "stormy";
}

async function fetchWeather(latitude: number, longitude: number, area: string): Promise<WeatherData> {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", latitude.toFixed(2));
  url.searchParams.set("longitude", longitude.toFixed(2));
  url.searchParams.set("current", "temperature_2m,weather_code,wind_speed_10m");
  const response = await fetch(url);
  if (!response.ok) throw new Error("Weather is unavailable");
  const data = await response.json() as { current: { temperature_2m: number; weather_code: number; wind_speed_10m: number } };
  return { area, label: `${Math.round(data.current.temperature_2m)}°C, ${weatherCode(data.current.weather_code)}, wind ${Math.round(data.current.wind_speed_10m)} km/h` };
}

async function geocodeCity(city: string) {
  const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
  url.searchParams.set("name", city);
  url.searchParams.set("count", "1");
  url.searchParams.set("language", "en");
  const response = await fetch(url);
  const data = await response.json() as { results?: Array<{ name: string; admin1?: string; country?: string; latitude: number; longitude: number }> };
  const place = data.results?.[0];
  if (!place) throw new Error("We couldn’t find that place.");
  return fetchWeather(place.latitude, place.longitude, [place.name, place.admin1, place.country].filter(Boolean).join(", "));
}

function speak(text: string) {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.92;
  utterance.pitch = 0.96;
  window.speechSynthesis.speak(utterance);
}

export function HomeExperience() {
  const [duration, setDuration] = useState<(typeof durations)[number]>(30);
  const [mood, setMood] = useState<Mood>("curious");
  const [city, setCity] = useState("Ranchi");
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [locationStatus, setLocationStatus] = useState("");
  const [stage, setStage] = useState<Stage>("setup");
  const [quest, setQuest] = useState<Quest | null>(null);
  const [missionIndex, setMissionIndex] = useState(0);
  const [completed, setCompleted] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [screenSeconds, setScreenSeconds] = useState(0);
  const [note, setNote] = useState("");
  const [hinglish, setHinglish] = useState(false);
  const [journalLoading, setJournalLoading] = useState(false);
  const [journalText, setJournalText] = useState("");
  const [identifyResult, setIdentifyResult] = useState<{ whatItLooksLike: string; confidence: string; funFact: string; safetyNote: string } | null>(null);
  const [identifyLoading, setIdentifyLoading] = useState(false);
  const startedAt = useRef(0);
  const visibleStartedAt = useRef(0);
  const visibleTotal = useRef(0);

  const useCurrentLocation = () => {
    if (!navigator.geolocation) return setLocationStatus("Location isn’t supported here. Type a city instead.");
    setLocationStatus("Finding your local weather…");
    navigator.geolocation.getCurrentPosition(async (position) => {
      try {
        const next = await fetchWeather(position.coords.latitude, position.coords.longitude, "Your local area");
        setWeather(next);
        setLocationStatus(`${next.area} · ${next.label}`);
      } catch { setLocationStatus("Weather couldn’t be reached. Type your city and continue."); }
    }, () => setLocationStatus("Location stayed private. Type a city instead."), { enableHighAccuracy: false, timeout: 8000 });
  };

  const beginWalk = useCallback((nextQuest: Quest) => {
    setQuest(nextQuest);
    setMissionIndex(0);
    setCompleted([]);
    setElapsed(0);
    setScreenSeconds(0);
    startedAt.current = Date.now();
    visibleTotal.current = 0;
    visibleStartedAt.current = document.visibilityState === "visible" ? Date.now() : 0;
    setStage("walk");
    localStorage.setItem("pagdandi:lastQuest", JSON.stringify(nextQuest));
    setTimeout(() => speak(nextQuest.missions[0].spokenText), 250);
  }, []);

  const replaySavedOrSample = () => {
    try {
      const saved = localStorage.getItem("pagdandi:lastQuest");
      beginWalk(saved ? JSON.parse(saved) as Quest : sampleQuest);
    } catch {
      beginWalk(sampleQuest);
    }
  };

  const generateQuest = async () => {
    setStage("loading");
    setError("");
    try {
      const localWeather = weather ?? await geocodeCity(city.trim());
      setWeather(localWeather);
      const response = await fetch("/api/quest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ durationMin: duration, mood, areaName: localWeather.area, weather: localWeather.label, month: new Intl.DateTimeFormat("en", { month: "long" }).format(new Date()), timeOfDay: timeOfDay() }),
      });
      const data = await response.json() as { quest?: Quest; error?: string };
      if (!response.ok || !data.quest) throw new Error(data.error || "Could not make this walk.");
      beginWalk(data.quest);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The trail could not be made.");
      setStage("setup");
    }
  };

  useEffect(() => {
    if (stage !== "walk") return;
    const timer = window.setInterval(() => setElapsed(Math.round((Date.now() - startedAt.current) / 1000)), 1000);
    const visibility = () => {
      if (document.visibilityState === "hidden" && visibleStartedAt.current) {
        visibleTotal.current += Date.now() - visibleStartedAt.current;
        visibleStartedAt.current = 0;
      } else if (document.visibilityState === "visible" && !visibleStartedAt.current) visibleStartedAt.current = Date.now();
    };
    document.addEventListener("visibilitychange", visibility);
    return () => { window.clearInterval(timer); document.removeEventListener("visibilitychange", visibility); };
  }, [stage]);

  const finishWalk = () => {
    if (visibleStartedAt.current) visibleTotal.current += Date.now() - visibleStartedAt.current;
    setElapsed(Math.round((Date.now() - startedAt.current) / 1000));
    setScreenSeconds(Math.round(visibleTotal.current / 1000));
    window.speechSynthesis?.cancel();
    setStage("finish");
  };

  const advance = (didComplete: boolean) => {
    if (!quest) return;
    const current = quest.missions[missionIndex];
    if (didComplete) setCompleted((items) => [...items, current.id]);
    if (missionIndex === quest.missions.length - 1) finishWalk();
    else {
      const next = missionIndex + 1;
      setMissionIndex(next);
      speak(quest.missions[next].spokenText);
    }
  };

  const createJournal = async () => {
    if (!quest) return;
    setJournalLoading(true);
    setError("");
    try {
      const completedMissions = quest.missions.filter((mission) => completed.includes(mission.id)).map((mission) => mission.text);
      const response = await fetch("/api/journal", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ questTitle: quest.title, completedMissions: completedMissions.length ? completedMissions : ["Completed the walk"], note, language: hinglish ? "hinglish" : "english", outsideSeconds: elapsed, screenSeconds }) });
      const data = await response.json() as { text?: string; error?: string };
      if (!response.ok || !data.text) throw new Error(data.error || "Could not write the journal.");
      const entry: JournalEntry = { id: crypto.randomUUID(), createdAt: new Date().toISOString(), questTitle: quest.title, text: data.text, outsideSeconds: elapsed, screenSeconds, completedCount: completed.length };
      const previous = JSON.parse(localStorage.getItem("pagdandi:journals") || "[]") as JournalEntry[];
      localStorage.setItem("pagdandi:journals", JSON.stringify([entry, ...previous]));
      setJournalText(data.text);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Could not write the journal."); }
    finally { setJournalLoading(false); }
  };

  const identify = async (file: File) => {
    setIdentifyLoading(true);
    setIdentifyResult(null);
    try {
      const bitmap = await createImageBitmap(file);
      const scale = Math.min(1, 1024 / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(bitmap.width * scale); canvas.height = Math.round(bitmap.height * scale);
      canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.78);
      const response = await fetch("/api/identify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ image: dataUrl.split(",")[1], mimeType: "image/jpeg" }) });
      const data = await response.json() as { result?: typeof identifyResult; error?: string };
      if (!response.ok || !data.result) throw new Error(data.error || "Could not inspect this photo.");
      setIdentifyResult(data.result);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Could not inspect this photo."); }
    finally { setIdentifyLoading(false); }
  };

  if (stage === "loading") return <main className="loading-screen"><div className="orbit"><LeafIcon width={34} height={34}/></div><p className="eyebrow">Gemma is reading the weather</p><h1>Finding a path worth noticing…</h1><p>Making small missions for {weather?.area || city}.</p></main>;

  if (stage === "walk" && quest) {
    const mission = quest.missions[missionIndex];
    return <main className="walk-screen">
      <div className="walk-top"><span className="walk-brand"><LeafIcon/> Pagdandi</span><span><ClockIcon/> {formatDuration(elapsed)}</span></div>
      <div className="mission-progress" aria-label={`Mission ${missionIndex + 1} of ${quest.missions.length}`}><span style={{ width: `${((missionIndex + 1) / quest.missions.length) * 100}%` }}/></div>
      <section className="mission-card" aria-live="polite">
        <p className="mission-count">Mission {String(missionIndex + 1).padStart(2, "0")} <span>of {String(quest.missions.length).padStart(2, "0")}</span></p>
        <span className="mission-type">{mission.type}</span>
        <h1>{mission.text}</h1>
        {mission.safetyNote && <p className="safety-note">Careful: {mission.safetyNote}</p>}
        <button className="repeat-button" onClick={() => speak(mission.spokenText)}><VolumeIcon/> Hear it again</button>
      </section>
      <div className="walk-actions">
        <button className="done-button" onClick={() => advance(true)}><CheckIcon/> Done <span>Next mission</span></button>
        <div className="walk-secondary"><button onClick={() => advance(false)}>Skip this one</button><label className="photo-button"><CameraIcon/> Photo guess<input type="file" accept="image/*" capture="environment" onChange={(event) => event.target.files?.[0] && identify(event.target.files[0])}/></label></div>
        {identifyLoading && <p className="walk-message">Gemma is looking carefully…</p>}
        {identifyResult && <div className="identify-card"><strong>{identifyResult.whatItLooksLike}</strong><span>{identifyResult.confidence} confidence</span><p>{identifyResult.funFact}</p><small>{identifyResult.safetyNote} This is an AI guess.</small></div>}
        {error && <p className="error-message">{error}</p>}
        <p className="pocket-note">Lock your screen between missions. The next one will be read aloud.</p>
      </div>
    </main>;
  }

  if (stage === "finish" && quest) {
    const ratio = elapsed ? Math.max(0, Math.min(100, 100 - (screenSeconds / elapsed) * 100)) : 0;
    return <main className="finish-screen"><section className="finish-wrap">
      <div className="finish-mark"><CheckIcon/></div><p className="eyebrow">Walk complete</p><h1>You went outside.<br/><em>The screen stayed behind.</em></h1>
      <div className="stat-card"><div><span>Time outside</span><strong>{formatDuration(elapsed)}</strong></div><div><span>Screen active</span><strong>{formatDuration(screenSeconds)}</strong></div><div className="ratio-row"><span style={{ width: `${ratio}%` }}/></div><p>{Math.round(ratio)}% of this walk was screen-free</p></div>
      {!journalText ? <div className="journal-maker"><h2>Leave a small field note</h2><p>Optional. Your note and journal stay on this device.</p><textarea value={note} onChange={(event) => setNote(event.target.value)} maxLength={500} placeholder="A sound, colour, or tiny thing you noticed…"/><label className="toggle-row"><input type="checkbox" checked={hinglish} onChange={(event) => setHinglish(event.target.checked)}/><span>Write it in Hinglish</span></label><button className="primary-button" onClick={createJournal} disabled={journalLoading}><SparkIcon/>{journalLoading ? "Writing your field note…" : "Write my field note"}</button>{error && <p className="error-message">{error}</p>}</div> : <div className="journal-result"><p>{journalText}</p><span>Saved privately on this device</span></div>}
      <div className="finish-links"><button onClick={() => { setStage("setup"); setQuest(null); setJournalText(""); setError(""); }}>Plan another walk</button><Link href="/journal">Open journal <ArrowIcon/></Link></div>
    </section></main>;
  }

  return <main>
    <header className="site-header"><Link className="brand" href="/"><span><LeafIcon/></span> Pagdandi</Link><nav><Link href="/journal">Journal</Link><Link href="/about">About</Link></nav></header>
    <section className="hero">
      <div className="hero-copy"><p className="eyebrow"><span/> Your pocket guide to the world outside</p><h1>Take the path<br/><em>less scrolled.</em></h1><p className="hero-lead">Small, AI-made quests that get your eyes off the screen and back into the world around you.</p><div className="proof-row"><span><VolumeIcon/> Audio-led</span><span><LocationIcon/> Weather-aware</span><span><LeafIcon/> Private by design</span></div></div>
      <section className="planner-card" aria-labelledby="planner-title"><div className="planner-heading"><span>01</span><div><h2 id="planner-title">Plan your walk</h2><p>Three choices. Then put your phone away.</p></div></div>
        <fieldset><legend>How long do you have?</legend><div className="segment-control">{durations.map((item) => <button type="button" aria-pressed={duration === item} className={duration === item ? "selected" : ""} onClick={() => setDuration(item)} key={item}><strong>{item}</strong><span>min</span></button>)}</div></fieldset>
        <fieldset><legend>How do you want to feel?</legend><div className="mood-grid">{moods.map((item) => <button type="button" aria-pressed={mood === item.value} className={mood === item.value ? "selected" : ""} onClick={() => setMood(item.value)} key={item.value}><span>{item.icon}</span>{item.label}</button>)}</div></fieldset>
        <fieldset><legend>Where are you walking?</legend><div className="location-input"><LocationIcon/><input aria-label="City or area" value={city} onChange={(event) => { setCity(event.target.value); setWeather(null); }} placeholder="City or area"/><button type="button" onClick={useCurrentLocation}>Use my location</button></div>{locationStatus && <p className="field-hint">{locationStatus}</p>}<p className="privacy-line">Exact coordinates never go to the AI.</p></fieldset>
        {error && <div className="error-box"><p>{error}</p><button onClick={replaySavedOrSample}>Replay my last walk (or use the sample)</button></div>}
        <button className="start-button" onClick={generateQuest} disabled={!city.trim() && !weather}><span>Start my walk</span><ArrowIcon/></button><p className="start-hint">Quest generated by open-weight Gemma · usually 5–10 seconds</p>
      </section>
    </section>
    <section className="how-section"><div><p className="eyebrow">A quieter kind of app</p><h2>The shortest screen time<br/>is the best one.</h2></div><ol><li><span>01</span><div><strong>Pick a pace</strong><p>Tell Pagdandi how much time and energy you have.</p></div></li><li><span>02</span><div><strong>Listen, then pocket it</strong><p>Your missions are spoken aloud, one small wonder at a time.</p></div></li><li><span>03</span><div><strong>Keep what you noticed</strong><p>Finish with a private field note—not a feed, streak, or score.</p></div></li></ol></section>
    <footer><ProviderBadge/><p>Made for outside. Your journal never leaves this device.</p><div><Link href="/about">How it works</Link><Link href="/journal">Your journal</Link></div></footer>
  </main>;
}
