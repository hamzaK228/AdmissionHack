"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

export interface Profile {
  name: string;
  level: "bachelor's" | "master's";
  country: string; // display name or "undecided"
  intake: string;
  budget: number; // USD per year
  ielts?: string;
  toefl?: string;
  sat?: string;
  gpa?: string;
  gpaScale?: string;
}

export type Tier = "dream" | "target" | "safe";
export interface AppEntry {
  slug: string;
  tier: Tier;
}

export type PortfolioKind = "activity" | "award" | "work" | "volunteering";
export interface PortfolioEntry {
  id: string;
  kind: PortfolioKind;
  title: string;
  org: string;
  description: string;
  years: string;
  hours: string;
}

export interface ExamResults {
  ieltsOverall?: string;
  ieltsL?: string;
  ieltsR?: string;
  ieltsW?: string;
  ieltsS?: string;
  toefl?: string;
  satEbrw?: string;
  satMath?: string;
  gpa?: string;
  gpaScale?: string;
}

export interface Deadline {
  id: string;
  title: string;
  date: string; // ISO yyyy-mm-dd
}

/**
 * A whole workspace arriving from the cloud. Every field is optional and only
 * the ones present are written, so a partial payload cannot silently blank a
 * section it did not carry.
 */
export interface WorkspaceImport {
  profile?: Profile | null;
  apps?: AppEntry[];
  portfolio?: PortfolioEntry[];
  exams?: ExamResults;
  deadlines?: Deadline[];
  checklist?: Record<string, boolean>;
}

interface Store {
  ready: boolean;
  onboarded: boolean;
  setOnboarded: () => void;
  profile: Profile | null;
  saveProfile: (p: Profile) => void;
  clearProfile: () => void;
  apps: AppEntry[];
  toggleShortlist: (slug: string) => void;
  isSaved: (slug: string) => boolean;
  setTier: (slug: string, tier: Tier) => void;
  removeApp: (slug: string) => void;
  portfolio: PortfolioEntry[];
  addPortfolio: (p: Omit<PortfolioEntry, "id">) => void;
  removePortfolio: (id: string) => void;
  exams: ExamResults;
  saveExams: (e: ExamResults) => void;
  deadlines: Deadline[];
  addDeadline: (d: { title: string; date: string }) => void;
  removeDeadline: (id: string) => void;
  checklist: Record<string, boolean>;
  toggleDoc: (id: string) => void;
  importWorkspace: (w: WorkspaceImport) => void;
  toast: string | null;
}

const Ctx = createContext<Store | null>(null);

function load<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function persist(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable */
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [onboarded, setOnboardedState] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [apps, setApps] = useState<AppEntry[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioEntry[]>([]);
  const [exams, setExams] = useState<ExamResults>({});
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [checklist, setChecklist] = useState<Record<string, boolean>>({});
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setOnboardedState(load("ah.onboarded", false));
    setProfile(load("ah.profile", null));

    // apps with tiers; migrate the legacy flat shortlist if present
    let storedApps = load<AppEntry[] | null>("ah.apps", null);
    if (!storedApps) {
      const legacy = load<string[]>("ah.shortlist", []);
      if (legacy.length > 0) {
        storedApps = legacy.map((slug) => ({ slug, tier: "target" as Tier }));
        persist("ah.apps", storedApps);
      }
    }
    setApps(storedApps ?? []);

    setPortfolio(load("ah.portfolio", []));
    setExams(load("ah.exams", {}));
    setDeadlines(load("ah.deadlines", []));
    setChecklist(load("ah.checklist", {}));
    setReady(true);
  }, []);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2200);
  }, []);

  const setOnboarded = useCallback(() => {
    setOnboardedState(true);
    persist("ah.onboarded", true);
  }, []);

  const saveProfile = useCallback(
    (p: Profile) => {
      setProfile(p);
      persist("ah.profile", p);
      showToast("profile saved ✓");
    },
    [showToast],
  );

  const clearProfile = useCallback(() => {
    setProfile(null);
    persist("ah.profile", null);
  }, []);

  const toggleShortlist = useCallback(
    (slug: string) => {
      setApps((prev) => {
        const exists = prev.some((a) => a.slug === slug);
        const next = exists
          ? prev.filter((a) => a.slug !== slug)
          : [...prev, { slug, tier: "target" as Tier }];
        persist("ah.apps", next);
        showToast(exists ? "removed from your list" : "added to Target ★ — move it on your dashboard");
        return next;
      });
    },
    [showToast],
  );

  const setTier = useCallback(
    (slug: string, tier: Tier) => {
      setApps((prev) => {
        const next = prev.map((a) => (a.slug === slug ? { ...a, tier } : a));
        persist("ah.apps", next);
        return next;
      });
      showToast(`moved to ${tier} ✓`);
    },
    [showToast],
  );

  const removeApp = useCallback((slug: string) => {
    setApps((prev) => {
      const next = prev.filter((a) => a.slug !== slug);
      persist("ah.apps", next);
      return next;
    });
  }, []);

  const addPortfolio = useCallback(
    (p: Omit<PortfolioEntry, "id">) => {
      setPortfolio((prev) => {
        const next = [...prev, { ...p, id: crypto.randomUUID() }];
        persist("ah.portfolio", next);
        return next;
      });
      showToast("portfolio entry added ✓");
    },
    [showToast],
  );

  const removePortfolio = useCallback((id: string) => {
    setPortfolio((prev) => {
      const next = prev.filter((p) => p.id !== id);
      persist("ah.portfolio", next);
      return next;
    });
  }, []);

  const saveExams = useCallback(
    (e: ExamResults) => {
      setExams(e);
      persist("ah.exams", e);
      showToast("exam results saved ✓");
    },
    [showToast],
  );

  const addDeadline = useCallback(
    (d: { title: string; date: string }) => {
      setDeadlines((prev) => {
        const next = [...prev, { ...d, id: crypto.randomUUID() }].sort((a, b) =>
          a.date.localeCompare(b.date),
        );
        persist("ah.deadlines", next);
        return next;
      });
      showToast("deadline added ✓");
    },
    [showToast],
  );

  const removeDeadline = useCallback((id: string) => {
    setDeadlines((prev) => {
      const next = prev.filter((d) => d.id !== id);
      persist("ah.deadlines", next);
      return next;
    });
  }, []);

  const toggleDoc = useCallback((id: string) => {
    setChecklist((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      persist("ah.checklist", next);
      return next;
    });
  }, []);

  const importWorkspace = useCallback(
    (w: WorkspaceImport) => {
      if (w.profile !== undefined) {
        setProfile(w.profile);
        persist("ah.profile", w.profile);
        // a restored profile means onboarding is behind us
        if (w.profile) {
          setOnboardedState(true);
          persist("ah.onboarded", true);
        }
      }
      if (w.apps) {
        setApps(w.apps);
        persist("ah.apps", w.apps);
      }
      if (w.portfolio) {
        setPortfolio(w.portfolio);
        persist("ah.portfolio", w.portfolio);
      }
      if (w.exams) {
        setExams(w.exams);
        persist("ah.exams", w.exams);
      }
      if (w.deadlines) {
        setDeadlines(w.deadlines);
        persist("ah.deadlines", w.deadlines);
      }
      if (w.checklist) {
        setChecklist(w.checklist);
        persist("ah.checklist", w.checklist);
      }
    },
    [],
  );

  const value = useMemo<Store>(
    () => ({
      ready,
      onboarded,
      setOnboarded,
      profile,
      saveProfile,
      clearProfile,
      apps,
      toggleShortlist,
      isSaved: (slug: string) => apps.some((a) => a.slug === slug),
      setTier,
      removeApp,
      portfolio,
      addPortfolio,
      removePortfolio,
      exams,
      saveExams,
      deadlines,
      addDeadline,
      removeDeadline,
      checklist,
      toggleDoc,
      importWorkspace,
      toast,
    }),
    [ready, onboarded, setOnboarded, profile, saveProfile, clearProfile, apps, toggleShortlist, setTier, removeApp, portfolio, addPortfolio, removePortfolio, exams, saveExams, deadlines, addDeadline, removeDeadline, checklist, toggleDoc, importWorkspace, toast],
  );

  return (
    <Ctx.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className={`fixed bottom-5 right-5 z-[90] rounded-xl border border-lime/40 bg-panel px-4 py-3 text-sm font-bold text-lime shadow-[0_10px_36px_rgba(0,0,0,0.6)] transition-[color,border-color,background-color] duration-300 ${
          toast ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0"
        }`}
      >
        <span className="text-lime/60">&gt; </span>
        {toast}
      </div>
    </Ctx.Provider>
  );
}

export function useStore(): Store {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}
