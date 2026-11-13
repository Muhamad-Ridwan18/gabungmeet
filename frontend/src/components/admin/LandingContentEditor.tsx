"use client";

import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, ChevronDown, Plus, Trash2 } from "lucide-react";
import { RichTextEditor } from "@/components/forms/RichTextEditor";
import { buildDefaultLandingContent } from "@/content/landing-defaults";
import {
  adminGetLandingContent,
  adminUpdateLandingContent,
  adminUploadLandingImage,
  type LandingContent,
  type LandingItem,
  type LandingLocale,
  type LandingSection,
  type LandingSectionKind,
  type LandingSectionText,
} from "@/services/landing";
import { cn } from "@/lib/utils";

const KIND_LABEL: Record<LandingSectionKind, string> = {
  text: "Teks",
  cards: "Kartu",
  steps: "Langkah bernomor",
  chips: "Chip pendek",
  compare: "Perbandingan 2 kolom",
  image_cards: "Kartu gambar (kotak + link)",
};

const KIND_HINT: Record<LandingSectionKind, string> = {
  text: "Judul dan teks saja.",
  cards: "Teks di atas, lalu kartu (judul + deskripsi) di bawahnya.",
  steps: "Kartu bernomor otomatis 01, 02, 03, dan seterusnya.",
  chips: "Label pendek. Hanya judul item yang tampil.",
  compare: "Dua kolom. Judul item = kolom kiri, deskripsi = kolom kanan.",
  image_cards: "Kartu kotak berisi gambar. Klik gambar membuka link. Judul dan deskripsi opsional.",
};

function ImageUpload({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const pick = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    setErr(null);
    try {
      const res = await adminUploadLandingImage(file);
      if (!res.success || !res.data) throw new Error(res.message || "upload failed");
      onChange(res.data.url);
    } catch {
      setErr("Gagal upload gambar (JPG/PNG/WEBP/GIF, maks 5MB).");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface-2)] text-[10px] text-muted">
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" className="h-full w-full object-cover" />
        ) : (
          "Kotak"
        )}
      </div>
      <div className="min-w-0 space-y-1">
        <label className="btn-ghost inline-flex cursor-pointer px-3 py-1.5 text-xs">
          {busy ? "Mengunggah..." : value ? "Ganti gambar" : "Upload gambar"}
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="hidden"
            disabled={busy}
            onChange={(e) => {
              void pick(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </label>
        {value ? (
          <button type="button" className="ml-2 text-xs text-[var(--danger)]" onClick={() => onChange("")}>
            Hapus
          </button>
        ) : null}
        {err ? <p className="text-xs text-[var(--danger)]">{err}</p> : null}
      </div>
    </div>
  );
}

const emptyText: LandingSectionText = { kicker: "", title: "", body: "", col_a: "", col_b: "", items: [] };

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</label>
      {hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
      <div className="mt-2">{children}</div>
    </div>
  );
}

export function LandingContentEditor() {
  const [content, setContent] = useState<LandingContent>(() => buildDefaultLandingContent());
  const [configured, setConfigured] = useState(false);
  const [loc, setLoc] = useState<LandingLocale>("id");
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const res = await adminGetLandingContent();
        if (res.success && res.data) {
          setConfigured(res.data.configured);
          if (res.data.content) setContent(res.data.content);
        }
      } catch {
        setError("Gagal memuat konten halaman utama.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const hero = content.hero[loc];
  const cta = content.cta[loc];
  const disclaimer = content.disclaimer[loc];

  const patchHero = (patch: Partial<typeof hero>) =>
    setContent((c) => ({ ...c, hero: { ...c.hero, [loc]: { ...c.hero[loc], ...patch } } }));
  const patchCta = (patch: Partial<typeof cta>) =>
    setContent((c) => ({ ...c, cta: { ...c.cta, [loc]: { ...c.cta[loc], ...patch } } }));
  const patchDisclaimer = (patch: Partial<typeof disclaimer>) =>
    setContent((c) => ({ ...c, disclaimer: { ...c.disclaimer, [loc]: { ...c.disclaimer[loc], ...patch } } }));

  const patchSection = (index: number, fn: (s: LandingSection) => LandingSection) =>
    setContent((c) => ({ ...c, sections: c.sections.map((s, i) => (i === index ? fn(s) : s)) }));
  const patchText = (index: number, patch: Partial<LandingSectionText>) =>
    patchSection(index, (s) => ({ ...s, i18n: { ...s.i18n, [loc]: { ...s.i18n[loc], ...patch } } }));
  const patchItem = (index: number, itemIndex: number, patch: Partial<LandingItem>) =>
    patchSection(index, (s) => ({
      ...s,
      i18n: {
        ...s.i18n,
        [loc]: {
          ...s.i18n[loc],
          items: s.i18n[loc].items.map((it, j) => (j === itemIndex ? { ...it, ...patch } : it)),
        },
      },
    }));
  const addItem = (index: number) =>
    patchSection(index, (s) => ({
      ...s,
      i18n: { ...s.i18n, [loc]: { ...s.i18n[loc], items: [...s.i18n[loc].items, { title: "", body: "" }] } },
    }));
  const removeItem = (index: number, itemIndex: number) =>
    patchSection(index, (s) => ({
      ...s,
      i18n: {
        ...s.i18n,
        [loc]: { ...s.i18n[loc], items: s.i18n[loc].items.filter((_, j) => j !== itemIndex) },
      },
    }));

  const moveSection = (index: number, dir: -1 | 1) =>
    setContent((c) => {
      const next = [...c.sections];
      const target = index + dir;
      if (target < 0 || target >= next.length) return c;
      [next[index], next[target]] = [next[target], next[index]];
      return { ...c, sections: next };
    });

  const removeSection = (index: number) =>
    setContent((c) => ({ ...c, sections: c.sections.filter((_, i) => i !== index) }));

  const addSection = () => {
    const key = `section-${Date.now().toString(36)}`;
    setContent((c) => ({
      ...c,
      sections: [
        ...c.sections,
        { key, kind: "text", enabled: true, i18n: { id: { ...emptyText }, en: { ...emptyText } } },
      ],
    }));
    setOpenKey(key);
  };

  const save = async () => {
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      const { updated_at: _ignored, ...payload } = content;
      void _ignored;
      const res = await adminUpdateLandingContent(payload);
      if (!res.success || !res.data) throw new Error(res.message || "save failed");
      setConfigured(res.data.configured);
      if (res.data.content) setContent(res.data.content);
      setSuccess("Konten halaman utama tersimpan.");
    } catch {
      setError("Gagal menyimpan. Periksa isian lalu coba lagi.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-4xl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-semibold">Konten halaman utama</h2>
          <p className="mt-1 max-w-2xl text-sm text-muted">
            Atur teks hero, section edukasi, ajakan daftar, dan disclaimer di halaman depan. Tiap bahasa punya isian
            sendiri.
            {configured ? "" : " Belum pernah disimpan, jadi halaman memakai teks bawaan."}
          </p>
        </div>
        <div className="inline-flex rounded-xl border border-[var(--border)] p-0.5" role="group" aria-label="Bahasa">
          {(["id", "en"] as const).map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setLoc(l)}
              aria-pressed={loc === l}
              className={cn(
                "rounded-lg px-4 py-1.5 text-xs font-semibold uppercase transition",
                loc === l ? "bg-[var(--primary)] text-white" : "text-muted hover:text-[var(--foreground)]",
              )}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <p className="mt-4 rounded-lg border border-[var(--danger)]/20 bg-[var(--danger)]/5 px-4 py-2 text-sm text-[var(--danger)]">
          {error}
        </p>
      ) : null}
      {success ? (
        <p className="mt-4 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-4 py-2 text-sm text-emerald-700 dark:text-emerald-300">
          {success}
        </p>
      ) : null}

      <fieldset disabled={loading || busy} className="mt-6 space-y-6">
        {/* Hero */}
        <div className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
          <h3 className="font-display text-base font-semibold">Hero</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Badge">
              <input className="field-input w-full" value={hero.badge} onChange={(e) => patchHero({ badge: e.target.value })} />
            </Field>
            <Field label="Teks tombol daftar">
              <input className="field-input w-full" value={hero.cta} onChange={(e) => patchHero({ cta: e.target.value })} />
            </Field>
            <Field label="Judul, bagian putih">
              <input className="field-input w-full" value={hero.title_a} onChange={(e) => patchHero({ title_a: e.target.value })} />
            </Field>
            <Field label="Judul, bagian berwarna">
              <input className="field-input w-full" value={hero.title_b} onChange={(e) => patchHero({ title_b: e.target.value })} />
            </Field>
          </div>
          <Field label="Subjudul">
            <input className="field-input w-full" value={hero.subtitle} onChange={(e) => patchHero({ subtitle: e.target.value })} />
          </Field>
          <Field label="Deskripsi singkat">
            <textarea className="field-input min-h-[80px] w-full" value={hero.body} onChange={(e) => patchHero({ body: e.target.value })} />
          </Field>
        </div>

        {/* Sections */}
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-display text-base font-semibold">Section ({content.sections.length})</h3>
            <button type="button" className="btn-ghost gap-2 px-3 py-1.5 text-xs" onClick={addSection}>
              <Plus className="h-3.5 w-3.5" />
              Tambah section
            </button>
          </div>

          {content.sections.map((section, index) => {
            const l = section.i18n[loc];
            const open = openKey === section.key;
            const label = l.title || l.kicker || section.key;
            return (
              <div key={section.key} className="rounded-2xl border border-[var(--border)] bg-[var(--card)]">
                <div className="flex flex-wrap items-center gap-2 p-3">
                  <button
                    type="button"
                    className="flex min-w-0 flex-1 items-center gap-2 text-left"
                    aria-expanded={open}
                    onClick={() => setOpenKey(open ? null : section.key)}
                  >
                    <ChevronDown className={cn("h-4 w-4 shrink-0 transition", open && "rotate-180")} />
                    <span className="min-w-0">
                      <span className={cn("block truncate text-sm font-medium", !section.enabled && "text-muted line-through")}>
                        {label}
                      </span>
                      <span className="block text-[11px] text-muted">{KIND_LABEL[section.kind]}</span>
                    </span>
                  </button>
                  <label className="flex items-center gap-1.5 text-xs">
                    <input
                      type="checkbox"
                      checked={section.enabled}
                      onChange={(e) => patchSection(index, (s) => ({ ...s, enabled: e.target.checked }))}
                    />
                    Tampil
                  </label>
                  <button type="button" className="rounded-lg p-1.5 text-muted hover:bg-accent-soft disabled:opacity-30" aria-label="Naikkan" disabled={index === 0} onClick={() => moveSection(index, -1)}>
                    <ArrowUp className="h-4 w-4" />
                  </button>
                  <button type="button" className="rounded-lg p-1.5 text-muted hover:bg-accent-soft disabled:opacity-30" aria-label="Turunkan" disabled={index === content.sections.length - 1} onClick={() => moveSection(index, 1)}>
                    <ArrowDown className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    className="rounded-lg p-1.5 text-[var(--danger)] hover:bg-[var(--danger)]/10"
                    aria-label="Hapus section"
                    onClick={() => {
                      if (window.confirm("Hapus section ini?")) removeSection(index);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {open ? (
                  <div className="space-y-4 border-t border-[var(--border)] p-4">
                    <Field label="Tipe tampilan" hint={KIND_HINT[section.kind]}>
                      <select
                        className="field-input w-full sm:w-72"
                        value={section.kind}
                        onChange={(e) => patchSection(index, (s) => ({ ...s, kind: e.target.value as LandingSectionKind }))}
                      >
                        {(Object.keys(KIND_LABEL) as LandingSectionKind[]).map((k) => (
                          <option key={k} value={k}>
                            {KIND_LABEL[k]}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="Label kecil di atas judul">
                        <input className="field-input w-full" value={l.kicker} onChange={(e) => patchText(index, { kicker: e.target.value })} />
                      </Field>
                      <Field label="Judul">
                        <input className="field-input w-full" value={l.title} onChange={(e) => patchText(index, { title: e.target.value })} />
                      </Field>
                    </div>
                    <Field label="Teks">
                      <RichTextEditor
                        key={`${section.key}-${loc}`}
                        value={l.body}
                        onChange={(html) => patchText(index, { body: html })}
                        placeholder="Tulis teks section di sini"
                      />
                    </Field>

                    {section.kind === "compare" ? (
                      <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Judul kolom kiri">
                          <input className="field-input w-full" value={l.col_a} onChange={(e) => patchText(index, { col_a: e.target.value })} />
                        </Field>
                        <Field label="Judul kolom kanan">
                          <input className="field-input w-full" value={l.col_b} onChange={(e) => patchText(index, { col_b: e.target.value })} />
                        </Field>
                      </div>
                    ) : null}

                    {section.kind !== "text" ? (
                      <div className="space-y-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                          {section.kind === "compare" ? "Baris perbandingan" : "Item"} ({l.items.length})
                        </p>
                        {l.items.map((item, j) => (
                          <div key={j} className="space-y-2 rounded-xl border border-[var(--border)] p-3">
                            <div className="flex items-center gap-2">
                              <input
                                className="field-input w-full"
                                value={item.title}
                                placeholder={section.kind === "compare" ? "Kolom kiri" : section.kind === "image_cards" ? "Judul (opsional)" : "Judul"}
                                onChange={(e) => patchItem(index, j, { title: e.target.value })}
                              />
                              <button
                                type="button"
                                className="rounded-lg p-1.5 text-[var(--danger)] hover:bg-[var(--danger)]/10"
                                aria-label="Hapus item"
                                onClick={() => removeItem(index, j)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                            {section.kind === "image_cards" ? (
                              <>
                                <ImageUpload value={item.image ?? ""} onChange={(url) => patchItem(index, j, { image: url })} />
                                <input
                                  className="field-input w-full"
                                  value={item.link ?? ""}
                                  placeholder="Link saat gambar diklik (https://... atau /halaman)"
                                  onChange={(e) => patchItem(index, j, { link: e.target.value })}
                                />
                              </>
                            ) : null}
                            {section.kind !== "chips" ? (
                              <textarea
                                className="field-input min-h-[64px] w-full"
                                value={item.body}
                                placeholder={section.kind === "compare" ? "Kolom kanan" : section.kind === "image_cards" ? "Deskripsi (opsional)" : "Deskripsi"}
                                onChange={(e) => patchItem(index, j, { body: e.target.value })}
                              />
                            ) : null}
                          </div>
                        ))}
                        <button type="button" className="btn-ghost gap-2 px-3 py-1.5 text-xs" onClick={() => addItem(index)}>
                          <Plus className="h-3.5 w-3.5" />
                          Tambah item
                        </button>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
          <h3 className="font-display text-base font-semibold">Ajakan daftar (bagian bawah)</h3>
          <Field label="Judul">
            <input className="field-input w-full" value={cta.title} onChange={(e) => patchCta({ title: e.target.value })} />
          </Field>
          <Field label="Deskripsi">
            <textarea className="field-input min-h-[80px] w-full" value={cta.body} onChange={(e) => patchCta({ body: e.target.value })} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Tombol daftar">
              <input className="field-input w-full" value={cta.button} onChange={(e) => patchCta({ button: e.target.value })} />
            </Field>
            <Field label="Tombol masuk">
              <input className="field-input w-full" value={cta.login} onChange={(e) => patchCta({ login: e.target.value })} />
            </Field>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
          <h3 className="font-display text-base font-semibold">Disclaimer risiko</h3>
          <Field label="Label">
            <input className="field-input w-full" value={disclaimer.label} onChange={(e) => patchDisclaimer({ label: e.target.value })} />
          </Field>
          <Field label="Isi" hint="Tampil di bawah semua section.">
            <textarea className="field-input min-h-[120px] w-full" value={disclaimer.body} onChange={(e) => patchDisclaimer({ body: e.target.value })} />
          </Field>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className="btn-primary px-4 py-2 text-sm" onClick={() => void save()}>
            {busy ? "Menyimpan..." : "Simpan konten"}
          </button>
          <button
            type="button"
            className="btn-ghost px-4 py-2 text-sm"
            onClick={() => {
              if (window.confirm("Kembalikan semua isian ke teks bawaan? Perubahan baru berlaku setelah disimpan.")) {
                setContent(buildDefaultLandingContent());
                setOpenKey(null);
              }
            }}
          >
            Kembalikan ke teks bawaan
          </button>
        </div>
      </fieldset>
    </div>
  );
}
