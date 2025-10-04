"use client";
import { useState } from "react";

export default function RandomVideo() {
  const [vid, setVid] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function getRandom() {
    setLoading(true);
    try {
      setVid(null)
      const res = await fetch("/api/youtube", { cache: "no-store" });

      // read as text first so we can detect HTML (Next 404/500 pages) and avoid JSON parse errors
      const text = await res.text()
      let data: any
      try {
        data = JSON.parse(text)
      } catch (e) {
        // not JSON — show a helpful error containing the start of the response
        setVid({ error: `Unexpected non-JSON response from server: ${text.slice(0,200)}` })
        return
      }

      if (!res.ok) {
        setVid({ error: data?.error || `Request failed: ${res.status}` })
      } else {
        setVid(data)
      }
    } catch (err: any) {
      setVid({ error: err?.message || String(err) })
    }
    setLoading(false);
  }

  return (
    <main className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Random YouTube Video</h1>
      <button onClick={getRandom} className="border rounded px-4 py-2 mb-4">
        {loading ? "Loading…" : "Surprise me"}
      </button>

      {vid && !vid.error && (
        <div className="space-y-2">
          <div>
            <a
              href={`https://youtube.com/watch?v=${vid.id}`}
              target="_blank"
              rel="noreferrer"
              className="text-blue-600 underline"
            >
              Open on YouTube
            </a>
          </div>
          <div className="font-semibold">{vid.title}</div>
          <div className="text-sm text-gray-500">{vid.channelTitle}</div>
        </div>
      )}

      {vid?.error && <p className="text-red-600">{vid.error}</p>}
    </main>
  );
}
