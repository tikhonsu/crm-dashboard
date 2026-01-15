import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

// =====================
// UI
// =====================
const UI = {
  page:
    "min-h-screen text-white overflow-x-auto bg-gradient-to-br from-black via-neutral-950 to-black [background-image:radial-gradient(80rem_40rem_at_120%_-10%,rgba(255,255,255,0.06),transparent),radial-gradient(60rem_30rem_at_-20%_110%,rgba(255,255,255,0.04),transparent)]",
  shell:
    "max-w-[1800px] mx-auto bg-white/5 backdrop-blur rounded-2xl p-6 border border-white/10 shadow-[0_0_0_1px_rgba(255,255,255,0.05)]",
  btn: "px-4 py-2 rounded-xl border border-white/30 text-white bg-transparent hover:bg-white/10",
  input: "w-full border border-white/20 rounded-lg p-2 bg-white/5 text-white placeholder-white/60",
  cell: "py-2 pr-3 align-top whitespace-normal break-words",
};

// =====================
// Utils
// =====================
const TODAY = () => new Date().toISOString().slice(0, 10);
const TOMORROW = () => new Date(Date.now() + 86400000).toISOString().slice(0, 10);
const rank = { Красный: 3, Оранжевый: 2, Зелёный: 1 };
const sortTasks = (a) =>
  [...a].sort(
    (x, y) =>
      (x.date || "").localeCompare(y.date || "") ||
      (rank[y.priority] || 0) - (rank[x.priority] || 0) ||
      (x.time || x.shootStart || "").localeCompare(y.time || y.shootStart || "")
  );
const ROLES = ["Руководитель", "Заместитель", "Цензор", "Сценарист", "Исполнитель"];

const NAV = [
  ["engineers", "Видеоинженеры"],
  ["smm", "СММ"],
  ["mytasks", "Мои задачи"],
  ["mywork", "Моя работа"],
  ["completed", "Выполненные задачи"],
  ["posts", "Отчёт о выкладке"],
  ["accounts", "Аккаунты"],
  ["directory", "Справочник"],
];

const uid = () => {
  // crypto.randomUUID() не везде доступен
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return "id_" + Math.random().toString(16).slice(2) + "_" + Date.now().toString(16);
};

// =====================
// Persisted state
// =====================
function usePersistedState(key, initial) {
  const [s, setS] = useState(() => {
    try {
      const v = localStorage.getItem(key);
      return v ? JSON.parse(v) : initial;
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(s));
    } catch {}
  }, [key, s]);
  return [s, setS];
}

// =====================
// Contexts
// =====================
const CatalogCtx = createContext(null);
const AuthCtx = createContext(null);

function useCatalog() {
  const v = useContext(CatalogCtx);
  if (!v) throw new Error("useCatalog must be used within CatalogProvider");
  return v;
}
function useAuth() {
  const v = useContext(AuthCtx);
  if (!v) throw new Error("useAuth must be used within AuthProvider");
  return v;
}

function CatalogProvider({ children }) {
  // ===== Names per spec =====
  const [peopleVE, setPeopleVE] = usePersistedState(
    "cat_people_ve",
    ["Усен", "Максим", "Вася", "Владимир"].map((n) => ({ id: n, history: [{ from: "1970-01-01", name: n }] }))
  );
  const [peopleSMM, setPeopleSMM] = usePersistedState(
    "cat_people_smm",
    ["Адель", "Алибек", "Азамат", "Катя", "Ваня", "Отец Иван", "Ян"].map((n) => ({ id: n, history: [{ from: "1970-01-01", name: n }] }))
  );
  const [leadership, setLeadership] = usePersistedState("cat_leadership", [
    { role: "Руководитель", name: "Тихон", locked: true },
    { role: "Заместитель", name: "Николай", locked: false },
    { role: "Цензор", name: "о. Иван", locked: false },
    { role: "Сценарист", name: "Жангир", locked: false },
  ]);
  const [accounts, setAccounts] = usePersistedState(
    "cat_accounts",
    [
      "Прообраз",
      "Антиаборт",
      "Суворов",
      "Вознесенский",
      "Семинария",
      "КазПросто",
      "Солнышко",
      "Радиовера",
      "Lucy инст",
      "Lucy АЛМ",
      "Lucy Жез",
      "Lucy Балх",
      "ПЦК",
      "Казанский",
      "Никольский",
      "Золотое Кольцо",
      "АПН",
    ].map((n) => ({ id: n, history: [{ from: "1970-01-01", name: n, project: "" }] }))
  );
  const [smmMap, setSmmMap] = usePersistedState("smm_links", {
    Алибек: ["Прообраз", "Антиаборт"],
    Адель: ["Суворов", "Вознесенский", "Семинария"],
    Азамат: ["КазПросто", "Солнышко", "Радиовера"],
    Катя: ["Lucy инст", "Lucy АЛМ", "Lucy Жез", "Lucy Балх"],
    Ваня: ["ПЦК", "Казанский"],
    "Отец Иван": ["Никольский", "Золотое Кольцо"],
    Ян: ["АПН"],
  });

  const addRename = (setter, id, entry) => setter((prev) => prev.map((x) => (x.id === id ? { ...x, history: [...x.history, entry] } : x)));
  const currentName = (hist, d) =>
    hist
      .slice()
      .sort((a, b) => a.from.localeCompare(b.from))
      .filter((h) => h.from <= d)
      .slice(-1)[0]?.name || hist[0]?.name;
  const latestName = (hist) => hist.slice().sort((a, b) => a.from.localeCompare(b.from)).slice(-1)[0]?.name || hist[0]?.name;

  // Workers list for auth (ВАЖНО: руководитель НЕ входит в список работников)
  const workers = useMemo(() => {
    const smm = peopleSMM.map((p) => ({ id: p.id, kind: "smm" }));
    const ve = peopleVE.map((p) => ({ id: p.id, kind: "ve" }));
    return [...smm, ...ve];
  }, [peopleSMM, peopleVE]);

  const value = {
    peopleVE,
    setPeopleVE,
    peopleSMM,
    setPeopleSMM,
    leadership,
    setLeadership,
    accounts,
    setAccounts,
    smmMap,
    setSmmMap,
    addRename,
    currentName,
    latestName,
    workers,
  };

  return <CatalogCtx.Provider value={value}>{children}</CatalogCtx.Provider>;
}

function AuthProvider({ children }) {
  const { leadership } = useCatalog();
  const bossName = leadership.find((l) => l.role === "Руководитель")?.name || "Тихон";

  const [currentUser, setCurrentUser] = usePersistedState("auth_user", null);
  const [pass, setPass] = usePersistedState("auth_pass", "230ew124");

  const loginAdmin = (pwd) => {
    if (pwd !== pass) return false;
    setCurrentUser({ id: bossName, kind: "admin" });
    return true;
  };
  const loginWorker = (id, workerKind) => setCurrentUser({ id, kind: "worker", workerKind });
  const logout = () => setCurrentUser(null);

  const isAdmin = currentUser?.kind === "admin";

  return <AuthCtx.Provider value={{ currentUser, isAdmin, loginAdmin, loginWorker, logout, pass, setPass }}>{children}</AuthCtx.Provider>;
}

// =====================
// Common Components
// =====================
function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
      <div className="w-full max-w-[1800px] bg-neutral-900 rounded-2xl overflow-hidden border border-white/10">
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/10 bg-white/5">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onClose} className={UI.btn}>
            Закрыть
          </button>
        </div>
        <div className="p-4 max-h-[75vh] overflow-auto">{children}</div>
      </div>
    </div>
  );
}

const Badge = ({ v }) => (
  <span className={`px-2 py-1 rounded-full text-xs text-white ${v === "Красный" ? "bg-red-500" : v === "Оранжевый" ? "bg-orange-500" : "bg-green-600"}`}>{v}</span>
);

function DateTabs({ tab, setTab, date, setDate }) {
  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      {["Сегодня", "Завтра", "Дата"].map((t) => (
        <button key={t} onClick={() => setTab(t)} className={`${UI.btn} ${tab === t ? "bg-white/10" : ""}`}>
          {t}
        </button>
      ))}
      {tab === "Дата" && <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={`${UI.input} w-auto`} />}
    </div>
  );
}

function Table({ cols, rows, onDel }) {
  return rows.length ? (
    <div className="overflow-x-auto">
      <table className="w-full table-auto text-sm">
        <thead>
          <tr className="text-left border-b border-white/10 bg-white/5">
            {cols.map((c) => (
              <th key={c.key} className={UI.cell}>
                {c.title}
              </th>
            ))}
            {onDel && <th className={UI.cell}></th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr
              key={r.id}
              className={`border-b border-white/10 ${
                r.status === "Прервана" ? "bg-red-900/30" : r.status === "В процессе" ? "bg-yellow-700/20" : ["Готово", "Выполнена"].includes(r.status) ? "bg-emerald-900/20" : ""
              }`}
            >
              {cols.map((c) => (
                <td key={c.key} className={UI.cell}>
                  {c.render ? c.render(r[c.key], r) : r[c.key]}
                </td>
              ))}
              {onDel && (
                <td className={UI.cell}>
                  <button onClick={() => onDel(r)} className={UI.btn}>
                    Удалить
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ) : (
    <div className="p-4 border border-white/10 rounded-xl bg-white/5 text-sm text-white/70">Пусто</div>
  );
}

// =====================
// Auth UI (button in header)
// =====================
function LoginModal({ open, onClose }) {
  const { workers } = useCatalog();
  const { loginAdmin, loginWorker } = useAuth();
  const [tab, setTab] = useState("Сотрудник");
  const [pwd, setPwd] = useState("");

  useEffect(() => {
    if (!open) {
      setPwd("");
      setTab("Сотрудник");
    }
  }, [open]);

  return (
    <Modal open={open} onClose={onClose} title="Войти">
      <div className="space-y-4">
        <div className="flex gap-2 flex-wrap">
          {["Сотрудник", "Руководитель"].map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`${UI.btn} ${tab === t ? "bg-white/10" : ""}`}>
              {t}
            </button>
          ))}
        </div>

        {tab === "Руководитель" ? (
          <div className="space-y-3">
            <input type="password" value={pwd} onChange={(e) => setPwd(e.target.value)} placeholder="Пароль руководителя" className={UI.input} />
            <button
              className={UI.btn}
              onClick={() => {
                const ok = loginAdmin(pwd);
                if (!ok) return alert("Неверный пароль");
                onClose();
              }}
            >
              Войти
            </button>
            <p className="text-xs text-white/60">Вход руководителя — только через пароль</p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="text-sm text-white/70">Выберите сотрудника (без пароля)</div>
            <div className="flex flex-wrap gap-2">
              {workers.map((u) => (
                <button
                  key={`${u.kind}-${u.id}`}
                  className={UI.btn}
                  onClick={() => {
                    loginWorker(u.id, u.kind);
                    onClose();
                  }}
                >
                  {u.id}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

// =====================
// Pages\n// =====================\n// NOTE: For GitHub scaffold we keep this file as-is.\n// If you paste the rest of pages below in your repo, it will work.\n\nfunction AppShell(){\n  const { currentUser, isAdmin, logout } = useAuth();\n  const [loginOpen, setLoginOpen] = useState(false);\n  const [page, setPage] = useState(\"engineers\");\n\n  useEffect(() => {\n    if (!currentUser) setLoginOpen(true);\n  }, [currentUser]);\n\n  const go = (k) => {\n    if (k === \"directory\" && !isAdmin) {\n      return alert(\"Справочник доступен только руководителю\");\n    }\n    setPage(k);\n  };\n\n  return (\n    <div className=\"min-h-screen\">\n      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />\n\n      <header className=\"sticky top-0 z-40 bg-black/70 backdrop-blur border-b border-white/10 text-white\">\n        <div className=\"max-w-[1800px] mx-auto px-4 py-3 flex items-center justify-between gap-3\">\n          <div className=\"text-base font-semibold tracking-tight\">TikhonSu Production</div>\n          <div className=\"text-sm text-white/70 hidden md:block\">Сегодня: {TODAY()}</div>\n          <div className=\"flex items-center gap-2 flex-wrap justify-end\">\n            <div className=\"text-sm text-white/80\">Вошёл: <span className=\"font-semibold\">{currentUser?.id || \"—\"}</span>{isAdmin ? \" (Руководитель)\" : \"\"}</div>\n            <button\n              className={UI.btn}\n              onClick={() => {\n                logout();\n                setLoginOpen(true);\n              }}\n            >\n              Сменить пользователя\n            </button>\n            <button className={UI.btn} onClick={() => setLoginOpen(true)}>\n              Войти\n            </button>\n            <nav className=\"flex flex-wrap gap-2\">\n              {NAV.map(([k, lab]) => (\n                <button key={k} onClick={() => go(k)} className={`${UI.btn} ${page === k ? \"bg-white/10\" : \"\"}`}>\n                  {lab}\n                </button>\n              ))}\n            </nav>\n          </div>\n        </div>\n      </header>\n\n      <div className={UI.page + \" p-8\"}>\n        <div className={UI.shell}>\n          <p className=\"text-white/70\">Каркас Vite+GitHub готов. Вставьте полный файл Dashboard.jsx (включая все страницы) — и проект будет полностью функционален.</p>\n        </div>\n      </div>\n    </div>\n  );\n}\n\nexport default function Dashboard() {\n  return (\n    <CatalogProvider>\n      <AuthProvider>\n        <AppShell />\n      </AuthProvider>\n    </CatalogProvider>\n  );\n}\n
export default Dashboard;
