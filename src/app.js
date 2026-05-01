const { useEffect, useMemo, useState } = React;

function App() {
  const [tab, setTab] = useState("Content Generator");
  const [foundation, setFoundation] = useState(null);
  const [addon, setAddon] = useState(null);
  const [leadResponse, setLeadResponse] = useState("");
  const [scriptInput, setScriptInput] = useState("");
  const [batchDay, setBatchDay] = useState("Tuesday");

  const [form, setForm] = useState({
    bucket: "",
    avatarLane: "",
    outcomeLane: "",
    contentFormat: "",
    feeling: "",
    pillar: "",
    voiceMode: "",
  });

  useEffect(() => {
    Promise.all([
      fetch("./data/brand-foundation.json").then((r) => r.json()),
      fetch("./data/foundation-addon-system.json").then((r) => r.json()),
    ]).then(([f, a]) => {
      setFoundation(f);
      setAddon(a);
      setForm((prev) => ({
        ...prev,
        bucket: f.buckets[0],
        avatarLane: f.avatarLanes[0],
        outcomeLane: f.outcomeLanes[0],
        contentFormat: f.contentFormats[0],
        feeling: f.feelings[0],
        pillar: f.pillars[0],
        voiceMode: f.voiceModes[0],
      }));
    });
  }, []);

  const generated = useMemo(() => {
    if (!foundation || !addon || !form.avatarLane) return null;
    const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
    const hook = pick(addon.hookTemplates)
      .replace("{{avatar}}", form.avatarLane)
      .replace("{{outcome}}", form.outcomeLane)
      .replace("{{pillar}}", form.pillar)
      .replace("{{bucket}}", form.bucket);

    return {
      hook,
      script: `${pick(addon.scriptTemplates)} Keep it in ${form.voiceMode.toLowerCase()} tone and make the audience feel ${form.feeling.toLowerCase()}.`,
      caption: pick(addon.captionTemplates)
        .replace("{{avatar}}", form.avatarLane)
        .replace("{{outcome}}", form.outcomeLane),
      shotList: addon.shotListTemplates.join(" | "),
      broll: pick(addon.brollIdeas),
      cta: pick(foundation.ctas),
    };
  }, [foundation, addon, form]);

  const scriptScore = useMemo(() => {
    if (!foundation) return [];
    const text = scriptInput;
    const words = text.toLowerCase();
    return foundation.foundationRules.map((rule) => {
      let pass = false;
      if (rule === "Clear subject in first 3 seconds") pass = text.split(" ").slice(0, 12).length > 4;
      if (rule === "One idea only") pass = (text.match(/\./g) || []).length <= 4;
      if (rule === "One viewer") pass = /\byou\b/i.test(text);
      if (rule === "Warm truth") pass = /real|honest|truth|i get it|you are not/i.test(words);
      if (rule === "Simple words") pass = text.split(" ").filter((w) => w.length > 14).length === 0;
      if (rule === "No em dashes") pass = !text.includes("—");
      if (rule === "Not too clean") pass = /lol|kinda|really|honestly|\?/i.test(words);
      if (rule === "Makes viewer feel seen or helped") pass = /you|help|feel|seen|stuck|struggle/i.test(words);
      if (rule === "Has CTA") pass = /comment|dm|save|share|message|book/i.test(words);
      return { rule, pass };
    });
  }, [scriptInput, foundation]);

  const dmReplies = useMemo(() => {
    if (!leadResponse.trim()) return null;
    return {
      soft: `I hear you. Appreciate you being real about that. If you want, I can help you keep this simple and take it one step at a time.`,
      direct: `Got you. If you want results, let's lock in one clear next step today and stop guessing.`,
      deeper: `Real question, what happens in the next 90 days if nothing changes with this?`,
    };
  }, [leadResponse]);

  if (!foundation || !addon) return <div className="p-8">Loading foundation files...</div>;

  const tabs = ["Content Generator", "Script Checker", "Batch Day Builder", "DM Helper"];
  const inputClass = "w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm";

  return (
    <div className="mx-auto max-w-5xl p-6">
      <h1 className="text-3xl font-bold">Coach Dave Content OS</h1>
      <p className="mt-2 text-sm text-zinc-400">Private app. Local JSON foundation is the source of truth.</p>

      <div className="mt-6 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`rounded-lg px-4 py-2 text-sm font-semibold ${tab === t ? "bg-amber-400 text-zinc-900" : "bg-zinc-800"}`}>
            {t}
          </button>
        ))}
      </div>

      <div className="mt-6 rounded-xl border border-zinc-800 bg-zinc-900 p-5">
        {tab === "Content Generator" && (
          <div className="grid gap-4 md:grid-cols-2">
            {Object.entries({
              bucket: foundation.buckets,
              avatarLane: foundation.avatarLanes,
              outcomeLane: foundation.outcomeLanes,
              contentFormat: foundation.contentFormats,
              feeling: foundation.feelings,
              pillar: foundation.pillars,
              voiceMode: foundation.voiceModes,
            }).map(([key, options]) => (
              <label key={key} className="text-sm">
                <div className="mb-1 capitalize text-zinc-300">{key.replace(/([A-Z])/g, " $1")}</div>
                <select className={inputClass} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })}>
                  {options.map((o) => <option key={o}>{o}</option>)}
                </select>
              </label>
            ))}
            <div className="md:col-span-2 grid gap-2 rounded-lg bg-zinc-950 p-4 text-sm">
              <Output title="Hook" text={generated.hook} />
              <Output title="Script" text={generated.script} />
              <Output title="Caption" text={generated.caption} />
              <Output title="Shot list" text={generated.shotList} />
              <Output title="B-roll idea" text={generated.broll} />
              <Output title="CTA" text={generated.cta} />
            </div>
          </div>
        )}

        {tab === "Script Checker" && (
          <div>
            <textarea value={scriptInput} onChange={(e) => setScriptInput(e.target.value)} placeholder="Paste script here..." className={`${inputClass} min-h-40`} />
            <div className="mt-4 space-y-2 text-sm">
              {scriptScore.map((item) => (
                <div key={item.rule} className="flex items-center justify-between rounded border border-zinc-800 px-3 py-2">
                  <span>{item.rule}</span>
                  <span className={item.pass ? "text-emerald-400" : "text-red-400"}>{item.pass ? "Pass" : "Needs work"}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "Batch Day Builder" && (
          <div className="space-y-4 text-sm">
            <select value={batchDay} onChange={(e) => setBatchDay(e.target.value)} className={inputClass}>
              <option>Tuesday</option><option>Thursday</option>
            </select>
            <div className="rounded-lg bg-zinc-950 p-4">
              <h3 className="font-semibold">{batchDay} Recording List</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-zinc-300">
                <li>3 talking heads</li><li>2 gym form videos</li><li>2 B-roll clips</li><li>1 inside voice clip</li><li>1 reaction or nutrition idea</li>
              </ul>
            </div>
          </div>
        )}

        {tab === "DM Helper" && (
          <div>
            <textarea value={leadResponse} onChange={(e) => setLeadResponse(e.target.value)} placeholder="Paste lead response..." className={`${inputClass} min-h-32`} />
            {dmReplies && <div className="mt-4 grid gap-2 text-sm"><Output title="Soft" text={dmReplies.soft} /><Output title="Direct" text={dmReplies.direct} /><Output title="Deeper qualification" text={dmReplies.deeper} /></div>}
          </div>
        )}
      </div>
    </div>
  );
}

function Output({ title, text }) {
  return <div><div className="text-xs uppercase tracking-wide text-amber-300">{title}</div><div className="rounded bg-zinc-900 p-2 text-zinc-200">{text}</div></div>;
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
