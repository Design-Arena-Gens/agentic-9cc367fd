"use client";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AvatarWoman } from "@/components/AvatarWoman";

type RecordMode = "canvas" | "tab";

type WordTiming = { word: string; startMs: number; endMs: number };

const DEFAULT_SCRIPT = `Willkommen bei SmartWelcome.de!\n\nIch bin Ihre virtuelle Gastgeberin. SmartWelcome begr??t Ihre Besucher mit pers?nlichen, kontextbezogenen Videos ? direkt auf Ihrer Website, im perfekten Moment.\n\nSteigern Sie Conversion, schaffen Sie Vertrauen und erkl?ren Sie komplexe Inhalte in wenigen Sekunden.\n\nBereit? Starten Sie jetzt mit SmartWelcome.de!`;

export function Presenter() {
  const [script, setScript] = useState<string>(DEFAULT_SCRIPT);
  const [status, setStatus] = useState<string>("Bereit");
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [useMic, setUseMic] = useState<boolean>(false);
  const [voiceName, setVoiceName] = useState<string>("");
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [recordMode, setRecordMode] = useState<RecordMode>("canvas");
  const [downloadUrl, setDownloadUrl] = useState<string>("");

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);

  const [mouthOpen, setMouthOpen] = useState<number>(0);
  const [progressMs, setProgressMs] = useState<number>(0);
  const [timeline, setTimeline] = useState<WordTiming[]>([]);
  const startTimeRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  // Prepare voices
  useEffect(() => {
    const loadVoices = () => {
      const v = window.speechSynthesis.getVoices();
      setVoices(v);
      const preferred = v.find((x) => x.lang.startsWith("de") && /female|frau|Google Deutsch/.test(x.name.toLowerCase())) || v.find((x) => x.lang.startsWith("de")) || v[0];
      setVoiceName(preferred?.name || "");
    };
    loadVoices();
    if (typeof window !== "undefined") {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  // Build naive word timings (used for subtitles + mouth when no mic)
  const computedTimeline = useMemo<WordTiming[]>(() => {
    const words = script.replace(/\n+/g, " ").split(/\s+/).filter(Boolean);
    const wpm = 150; // approximate
    const msPerWord = (60_000 / wpm);
    let t = 0;
    const result: WordTiming[] = words.map((w) => {
      const dur = Math.max(350, Math.min(1200, msPerWord * (Math.max(1, w.length / 4))));
      const entry: WordTiming = { word: w, startMs: t, endMs: t + dur };
      t += dur + 60; // small pause
      return entry;
    });
    return result;
  }, [script]);

  // Draw loop onto canvas
  const drawFrame = useCallback((ts: number) => {
    if (!canvasRef.current) return;
    if (startTimeRef.current === null) startTimeRef.current = ts;
    const elapsed = ts - startTimeRef.current;
    setProgressMs(elapsed);

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { width, height } = canvas;
    ctx.clearRect(0, 0, width, height);

    // Background
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, "#ecfeff");
    grad.addColorStop(1, "#ffffff");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Title
    ctx.fillStyle = "#0f172a";
    ctx.font = `700 ${Math.round(width * 0.035)}px system-ui`;
    ctx.fillText("SmartWelcome.de", 32, 56);

    // Subheadline
    ctx.font = `400 ${Math.round(width * 0.018)}px system-ui`;
    ctx.fillStyle = "#334155";
    ctx.fillText("Pers?nliche Video-Begr??ungen f?r Ihre Website", 32, 86);

    // Avatar area
    const avatarX = width * 0.55;
    const avatarY = height * 0.52;
    const avatarSize = Math.min(width, height) * 0.5;

    // Draw avatar using simple vector primitives
    const headR = avatarSize * 0.23;

    // shoulders
    ctx.fillStyle = "#0ea5e9";
    ctx.beginPath();
    ctx.ellipse(avatarX, avatarY + headR + 40, headR * 1.8, headR * 0.9, 0, 0, Math.PI * 2);
    ctx.fill();

    // neck
    ctx.fillStyle = "#f2c7a5";
    ctx.beginPath();
    ctx.roundRect(avatarX - 22, avatarY + headR - 10, 44, 36, 10);
    ctx.fill();

    // head
    ctx.fillStyle = "#f7d3b6";
    ctx.beginPath();
    ctx.arc(avatarX, avatarY, headR, 0, Math.PI * 2);
    ctx.fill();

    // hair
    ctx.fillStyle = "#1f2937";
    ctx.beginPath();
    ctx.moveTo(avatarX - headR, avatarY - headR * 0.1);
    ctx.bezierCurveTo(avatarX - headR * 0.8, avatarY - headR * 0.9, avatarX + headR * 0.8, avatarY - headR * 0.9, avatarX + headR, avatarY - headR * 0.1);
    ctx.bezierCurveTo(avatarX + headR * 1.05, avatarY + headR * 0.8, avatarX - headR * 1.05, avatarY + headR * 0.8, avatarX - headR, avatarY - headR * 0.1);
    ctx.fill();

    // eyes
    ctx.fillStyle = "#111827";
    ctx.beginPath();
    ctx.arc(avatarX - headR * 0.25, avatarY - headR * 0.1, 6, 0, Math.PI * 2);
    ctx.arc(avatarX + headR * 0.25, avatarY - headR * 0.1, 6, 0, Math.PI * 2);
    ctx.fill();

    // mouth
    const mouthH = 2 + Math.max(0, Math.min(1, mouthOpen)) * 16;
    ctx.fillStyle = "#b91c1c";
    ctx.beginPath();
    ctx.roundRect(avatarX - 18, avatarY + 22 - mouthH / 2, 36, mouthH, 8);
    ctx.fill();

    // subtitle box
    const active = timeline.find((w) => elapsed >= w.startMs && elapsed <= w.endMs);
    const subtitle = active?.word || "\u00A0";
    ctx.fillStyle = "rgba(15,23,42,0.8)";
    const boxW = width * 0.9;
    const boxX = (width - boxW) / 2;
    const boxY = height - 90;
    const boxH = 54;
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxW, boxH, 12);
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.font = `600 ${Math.round(width * 0.022)}px system-ui`;
    const textWidth = ctx.measureText(subtitle).width;
    ctx.fillText(subtitle, width / 2 - textWidth / 2, boxY + 36);

    rafRef.current = requestAnimationFrame(drawFrame);
  }, [mouthOpen, timeline]);

  useEffect(() => {
    setTimeline(computedTimeline);
  }, [computedTimeline]);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(drawFrame);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [drawFrame]);

  // Microphone setup for mouth animation
  const enableMic = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    audioStreamRef.current = stream;
    const ctx = new AudioContext();
    const src = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 2048;
    src.connect(analyser);
    analyserRef.current = analyser;

    const data = new Uint8Array(analyser.frequencyBinCount);
    const pump = () => {
      analyser.getByteTimeDomainData(data);
      // Compute RMS
      let sum = 0;
      for (let i = 0; i < data.length; i++) {
        const v = (data[i] - 128) / 128;
        sum += v * v;
      }
      const rms = Math.sqrt(sum / data.length);
      setMouthOpen((prev) => prev * 0.7 + Math.min(1, rms * 6) * 0.3);
      requestAnimationFrame(pump);
    };
    pump();
  }, []);

  // Fallback mouth animation using timeline (no audio)
  useEffect(() => {
    if (useMic) return; // mic drives mouth
    let id: number;
    const loop = () => {
      const t = performance.now() - (startTimeRef.current ?? performance.now());
      const active = timeline.find((w) => t >= w.startMs && t <= w.endMs);
      if (active) {
        // Simple envelope
        const rel = (t - active.startMs) / (active.endMs - active.startMs);
        const env = rel < 0.5 ? rel * 2 : (1 - rel) * 2;
        setMouthOpen(env);
      } else {
        setMouthOpen((m) => m * 0.8);
      }
      id = requestAnimationFrame(loop);
    };
    id = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(id);
  }, [timeline, useMic]);

  const speak = useCallback(async () => {
    if (isSpeaking) return;
    setStatus("Vortrag l?uft?");
    setIsSpeaking(true);
    startTimeRef.current = performance.now();

    if (useMic) {
      await enableMic();
    }

    const doSpeak = () => new Promise<void>((resolve) => {
      if (!("speechSynthesis" in window) || useMic) {
        // No TTS or mic mode: just run timeline duration
        const total = (timeline[timeline.length - 1]?.endMs ?? 10_000) + 800;
        setTimeout(resolve, total);
        return;
      }
      const utter = new SpeechSynthesisUtterance(script);
      utter.lang = "de-DE";
      if (voiceName) {
        const voice = voices.find((v) => v.name === voiceName);
        if (voice) utter.voice = voice;
      }
      utter.rate = 1.0;
      utter.pitch = 1.05;
      utter.onend = () => resolve();
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utter);
    });

    await doSpeak();

    setIsSpeaking(false);
    setStatus("Fertig");
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((t) => t.stop());
      audioStreamRef.current = null;
    }
  }, [enableMic, isSpeaking, script, timeline, useMic, voiceName, voices]);

  const startRecordingCanvas = useCallback(async () => {
    if (!canvasRef.current) return;
    const stream = canvasRef.current.captureStream(30);
    const rec = new MediaRecorder(stream, { mimeType: "video/webm;codecs=vp9" });
    chunksRef.current = [];
    rec.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    rec.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "video/webm" });
      setDownloadUrl(URL.createObjectURL(blob));
      setStatus("Aufnahme beendet ? Download bereit");
    };
    mediaRecorderRef.current = rec;
    rec.start();
    setStatus("Aufnahme (Canvas) l?uft?");
  }, []);

  const startRecordingTab = useCallback(async () => {
    // Ask user to capture "This Tab" so TTS/mic audio is included
    const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
    const rec = new MediaRecorder(stream, { mimeType: "video/webm;codecs=vp9" });
    chunksRef.current = [];
    rec.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    rec.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "video/webm" });
      setDownloadUrl(URL.createObjectURL(blob));
      setStatus("Aufnahme beendet ? Download bereit");
      stream.getTracks().forEach((t) => t.stop());
    };
    mediaRecorderRef.current = rec;
    rec.start();
    setStatus("Aufnahme (Tab) l?uft?");
  }, []);

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop();
  }, []);

  const startPresentation = useCallback(async () => {
    setDownloadUrl("");
    setTimeline(computedTimeline);
    startTimeRef.current = null;
    if (recordMode === "canvas") await startRecordingCanvas();
    if (recordMode === "tab") await startRecordingTab();
    await speak();
  }, [computedTimeline, recordMode, speak, startRecordingCanvas, startRecordingTab]);

  const totalMs = useMemo(() => (timeline.at(-1)?.endMs ?? 0) + 500, [timeline]);
  const progress = Math.min(1, totalMs ? progressMs / totalMs : 0);

  return (
    <div className="presenter-wrap">
      <div className="card">
        <div className="controls">
          <div>
            <label className="label">Skript (Deutsch)</label>
            <textarea value={script} onChange={(e) => setScript(e.target.value)} rows={8} className="input mono" />
            <div className="small" style={{ marginTop: 6 }}>
              Tipp: F?r klare Untertitel kurze S?tze und Abs?tze nutzen.
            </div>
          </div>
          <div>
            <div style={{ display: "grid", gap: 12 }}>
              <div>
                <label className="label">Vertonung</label>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input id="useMic" type="checkbox" checked={useMic} onChange={(e) => setUseMic(e.target.checked)} />
                  <label htmlFor="useMic">Mikrofon verwenden (empfohlen f?r echte Stimme)</label>
                </div>
                <div style={{ marginTop: 8, opacity: useMic ? 0.4 : 1, pointerEvents: useMic ? "none" : "auto" }}>
                  <div className="small" style={{ marginBottom: 6 }}>Oder Ger?te?TTS (falls verf?gbar):</div>
                  <select className="input" value={voiceName} onChange={(e) => setVoiceName(e.target.value)}>
                    {voices.map((v) => (
                      <option key={v.name} value={v.name}>{v.name} ({v.lang})</option>
                    ))}
                    {voices.length === 0 && <option>Keine Stimmen verf?gbar</option>}
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Aufnahme?Modus</label>
                <div style={{ display: "grid", gap: 8 }}>
                  <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <input type="radio" name="rec" checked={recordMode === "canvas"} onChange={() => setRecordMode("canvas")} />
                    <span>Nur Canvas (ohne Audio)</span>
                  </label>
                  <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <input type="radio" name="rec" checked={recordMode === "tab"} onChange={() => setRecordMode("tab")} />
                    <span>Tab aufnehmen (mit TTS oder Mikrofon)</span>
                  </label>
                  <div className="small">Hinweis: Bei Tab-Aufnahme bitte im Dialog ?Dieser Tab? ausw?hlen, damit Ton mitgeschnitten wird.</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="button" onClick={startPresentation} disabled={isSpeaking}>Start</button>
                <button className="button secondary" onClick={stopRecording}>Stop</button>
              </div>
              <div className="badge"><span className="status">Status:</span> {status}</div>
              <div className="small">Fortschritt: {(progress * 100).toFixed(0)}%</div>
              {downloadUrl && (
                <a className="button" href={downloadUrl} download="smartwelcome.webm">Video herunterladen (WebM)</a>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="canvas-frame">
          <canvas ref={canvasRef} width={1280} height={720} style={{ width: "100%", height: "100%", display: "block" }} />
        </div>
      </div>
    </div>
  );
}
