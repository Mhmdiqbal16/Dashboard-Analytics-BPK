import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./App.css";
import {
  PieChart,
  Pie,
  Cell,
  Sector,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  Legend,
} from "recharts";

const RADIAN = Math.PI / 180;
function renderActiveShape(props: any) {
  const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, name, value, index } = props;
  const sin = Math.sin(-RADIAN * midAngle);
  const cos = Math.cos(-RADIAN * midAngle);
  const sx = cx + (outerRadius + 6) * cos;
  const sy = cy + (outerRadius + 6) * sin;
  const mx = cx + (outerRadius + 22) * cos;
  const my = cy + (outerRadius + 22) * sin;
  const ex = mx + (cos >= 0 ? 1 : -1) * 30;
  const ey = my;
  const textAnchor = cos >= 0 ? 'start' : 'end';

  return (
    <g>
      <Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius + 6} startAngle={startAngle} endAngle={endAngle} fill={fill} />
      <Sector cx={cx} cy={cy} startAngle={startAngle} endAngle={endAngle} innerRadius={outerRadius + 8} outerRadius={outerRadius + 11} fill={fill} opacity={0.3} />
      <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" strokeWidth={1.5} />
      <circle cx={ex} cy={ey} r={2.5} fill={fill} />
      <text x={ex + (cos >= 0 ? 6 : -6)} y={ey - 5} textAnchor={textAnchor} fill="#334155" fontSize={11} fontWeight={600}>
        {name && name.length > 20 ? name.slice(0, 20) + '…' : name}
      </text>
      <text x={ex + (cos >= 0 ? 6 : -6)} y={ey + 10} textAnchor={textAnchor} fill="#64748b" fontSize={10}>
        {formatShort(value)}
      </text>
    </g>
  );
}

const COLORS = ["#818cf8", "#34d399", "#fbbf24", "#f87171", "#22d3ee", "#a78bfa"];

/* ================== HELPERS ================== */
function parseGvizResponse(text: string) {
  const match = text.match(/google\.visualization\.Query\.setResponse\((.*)\);/s);
  if (!match || !match[1]) throw new Error("Invalid Google Sheets response format");
  return JSON.parse(match[1]);
}

function buildColIndexMap(cols: any[]) {
  const map: Record<string, number> = {};
  cols.forEach((c, i) => {
    if (c.label) map[c.label.trim()] = i;
  });
  return map;
}

function formatCurrency(v: number) {
  return v.toLocaleString("id-ID", { style: "currency", currency: "IDR" });
}

function formatShort(v: number) {
  if (v >= 1e12) return `Rp ${(v / 1e12).toFixed(2)} T`;
  if (v >= 1e9) return `Rp ${(v / 1e9).toFixed(2)} M`;
  if (v >= 1e6) return `Rp ${(v / 1e6).toFixed(2)} Jt`;
  return `Rp ${v.toLocaleString("id-ID")}`;
}

/* ================== ICONS ================== */
const Icons = {
  dashboard: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  ),
  belanja: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  ),
  satker: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  laporan: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  ),
  deskripsi: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  ),
  search: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  chevronDown: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  ),
  logout: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  ),
};

/* ================== CALENDAR HEATMAP ================== */
function CalendarHeatmap({ data, year }: { data: Record<string, number>; year: string }) {
  const [hoveredDay, setHoveredDay] = useState<{ date: string; value: number; x: number; y: number } | null>(null);

  const targetYear = year !== 'all' ? Number(year) : new Date().getFullYear();
  const startDate = new Date(targetYear, 0, 1);
  const endDate = new Date(targetYear, 11, 31);

  // Build array of all days
  const days: { date: string; value: number; dayOfWeek: number; weekIndex: number }[] = [];
  const d = new Date(startDate);
  // Align to start of week (Sunday)
  const startDay = d.getDay();
  let weekIdx = 0;
  let prevWeekDay = startDay;

  while (d <= endDate) {
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const dow = d.getDay();
    if (dow === 0 && days.length > 0) weekIdx++;
    days.push({ date: dateStr, value: data[dateStr] || 0, dayOfWeek: dow, weekIndex: weekIdx });
    prevWeekDay = dow;
    d.setDate(d.getDate() + 1);
  }

  const totalWeeks = weekIdx + 1;
  const maxVal = Math.max(...days.map(d => d.value), 1);

  function getColor(val: number) {
    if (val === 0) return '#f1f5f9';
    const ratio = val / maxVal;
    if (ratio < 0.25) return '#bbf7d0';
    if (ratio < 0.5) return '#4ade80';
    if (ratio < 0.75) return '#16a34a';
    return '#15803d';
  }

  const monthLabels: { label: string; weekIndex: number }[] = [];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'];
  let lastMonth = -1;
  days.forEach(day => {
    const m = parseInt(day.date.split('-')[1]) - 1;
    if (m !== lastMonth) {
      monthLabels.push({ label: monthNames[m], weekIndex: day.weekIndex });
      lastMonth = m;
    }
  });

  const cellSize = 13;
  const cellGap = 3;
  const step = cellSize + cellGap;
  const leftPad = 28;
  const topPad = 20;
  const svgWidth = leftPad + totalWeeks * step + 10;
  const svgHeight = topPad + 7 * step + 10;
  const dayLabels = ['', 'Sen', '', 'Rab', '', 'Jum', ''];

  return (
    <div className="relative">
      <div className="overflow-x-auto">
        <svg width={svgWidth} height={svgHeight} className="block">
          {monthLabels.map((m, i) => (
            <text key={i} x={leftPad + m.weekIndex * step} y={12} fontSize={10} fill="#94a3b8" fontWeight={500}>
              {m.label}
            </text>
          ))}
          {dayLabels.map((label, i) => (
            label && <text key={i} x={0} y={topPad + i * step + cellSize - 2} fontSize={9} fill="#94a3b8" fontWeight={500}>{label}</text>
          ))}
          {days.map((day, i) => (
            <rect
              key={i}
              x={leftPad + day.weekIndex * step}
              y={topPad + day.dayOfWeek * step}
              width={cellSize}
              height={cellSize}
              rx={3}
              fill={getColor(day.value)}
              className="cursor-pointer"
              style={{ transition: 'fill 0.15s' }}
              onMouseEnter={(e) => {
                const rect = (e.target as SVGRectElement).getBoundingClientRect();
                setHoveredDay({ date: day.date, value: day.value, x: rect.left + rect.width / 2, y: rect.top });
              }}
              onMouseLeave={() => setHoveredDay(null)}
            />
          ))}
        </svg>
      </div>
      {hoveredDay && (
        <div
          className="fixed z-50 px-3 py-2 rounded-lg bg-slate-800 text-white text-xs shadow-xl pointer-events-none"
          style={{ left: hoveredDay.x, top: hoveredDay.y - 40, transform: 'translateX(-50%)' }}
        >
          <div className="font-semibold">{hoveredDay.date}</div>
          <div className="text-slate-300">{hoveredDay.value > 0 ? formatCurrency(hoveredDay.value) : 'Tidak ada transaksi'}</div>
        </div>
      )}
      <div className="flex items-center gap-2 mt-3 text-[10px] text-slate-500">
        <span>Sedikit</span>
        {['#f1f5f9', '#bbf7d0', '#4ade80', '#16a34a', '#15803d'].map((c, i) => (
          <span key={i} className="inline-block w-3 h-3 rounded-sm" style={{ backgroundColor: c }} />
        ))}
        <span>Banyak</span>
      </div>
    </div>
  );
}

/* ================== GOOGLE-STYLE AUTOCOMPLETE SEARCH ================== */
function AutocompleteSearch({
  value,
  onChange,
  rows,
}: {
  value: string;
  onChange: (v: string) => void;
  rows: any[];
}) {
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Build unique suggestion pool from all text fields
  const suggestionPool = useMemo(() => {
    const fields = ['akun', 'satker', 'sumberDana', 'deskripsi', 'kodePeriode'];
    const fieldLabels: Record<string, string> = {
      akun: 'Akun',
      satker: 'Satker',
      sumberDana: 'Sumber Dana',
      deskripsi: 'Deskripsi',
      kodePeriode: 'Kode',
    };
    const seen = new Set<string>();
    const pool: { text: string; category: string }[] = [];
    rows.forEach((r) => {
      fields.forEach((f) => {
        const val = r[f];
        if (val && val !== '-' && !seen.has(val)) {
          seen.add(val);
          pool.push({ text: val, category: fieldLabels[f] || f });
        }
      });
    });
    return pool;
  }, [rows]);

  const suggestions = useMemo(() => {
    if (!value.trim()) return [];
    const q = value.toLowerCase();
    return suggestionPool
      .filter((s) => s.text.toLowerCase().includes(q))
      .slice(0, 8);
  }, [value, suggestionPool]);

  const showDropdown = open && value.trim().length > 0 && suggestions.length > 0;

  // Close on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selectItem = useCallback(
    (text: string) => {
      onChange(text);
      setOpen(false);
      setActiveIdx(-1);
      inputRef.current?.blur();
    },
    [onChange]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIdx >= 0 && activeIdx < suggestions.length) {
        selectItem(suggestions[activeIdx].text);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
      setActiveIdx(-1);
    }
  };

  const highlightMatch = (text: string, query: string) => {
    const idx = text.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return <span>{text}</span>;
    const before = text.slice(0, idx);
    const match = text.slice(idx, idx + query.length);
    const after = text.slice(idx + query.length);
    return (
      <span>
        <span className="completion">{before}</span>
        <span className="match">{match}</span>
        <span className="completion">{after}</span>
      </span>
    );
  };

  return (
    <div className="gsearch-container" ref={containerRef}>
      <div className={`gsearch-box ${showDropdown ? 'open' : ''}`}>
        <div className="gsearch-input-row">
          <div className="gsearch-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
          <input
            ref={inputRef}
            className="gsearch-input"
            value={value}
            onChange={(e) => {
              onChange(e.target.value);
              setOpen(true);
              setActiveIdx(-1);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder="Cari data transaksi…"
            autoComplete="off"
          />
          {value && (
            <button
              className="gsearch-clear"
              onClick={() => {
                onChange('');
                setOpen(false);
                inputRef.current?.focus();
              }}
              tabIndex={-1}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
      </div>
      {showDropdown && (
        <div className="gsearch-dropdown">
          <div className="gsearch-divider" />
          <div className="gsearch-suggestions">
            {suggestions.map((s, i) => (
              <div
                key={`${s.category}-${s.text}`}
                className={`gsearch-item ${i === activeIdx ? 'active' : ''}`}
                onMouseEnter={() => setActiveIdx(i)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => selectItem(s.text)}
              >
                <div className="gsearch-item-icon">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </div>
                <div className="gsearch-item-text">
                  {highlightMatch(s.text, value)}
                </div>
                <span className="gsearch-item-category">{s.category}</span>
                <div className="gsearch-item-action">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 4 15 10 9 16" />
                  </svg>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ================== GOOGLE-STYLE FILTER SELECT ================== */
function AutocompleteFilterSelect({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  options: any[];
  placeholder: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIdx, setActiveIdx] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // All options including 'all'
  const allOptions = useMemo(
    () => [{ value: 'all', label: placeholder }, ...options.map((o: any) => ({ value: String(o), label: String(o) }))],
    [options, placeholder]
  );

  const filtered = useMemo(() => {
    if (!query.trim()) return allOptions;
    const q = query.toLowerCase();
    return allOptions.filter((o) => o.label.toLowerCase().includes(q));
  }, [query, allOptions]);

  const displayValue = value === 'all' ? '' : String(value);

  // Close on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selectOption = useCallback(
    (val: string) => {
      onChange(val);
      setOpen(false);
      setQuery('');
      setActiveIdx(-1);
    },
    [onChange]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx((prev) => (prev < filtered.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx((prev) => (prev > 0 ? prev - 1 : filtered.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIdx >= 0 && activeIdx < filtered.length) {
        selectOption(filtered[activeIdx].value);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
      setQuery('');
      setActiveIdx(-1);
    }
  };

  const highlightMatch = (text: string, q: string) => {
    if (!q.trim()) return <span>{text}</span>;
    const idx = text.toLowerCase().indexOf(q.toLowerCase());
    if (idx === -1) return <span>{text}</span>;
    const before = text.slice(0, idx);
    const match = text.slice(idx, idx + q.length);
    const after = text.slice(idx + q.length);
    return (
      <span>
        <span className="completion">{before}</span>
        <span className="match">{match}</span>
        <span className="completion">{after}</span>
      </span>
    );
  };

  return (
    <div className="gfilter-container" ref={containerRef}>
      <div className={`gfilter-box ${open ? 'open' : ''}`}>
        <div
          className="gfilter-input-row"
          onClick={() => {
            setOpen(true);
            setTimeout(() => inputRef.current?.focus(), 0);
          }}
        >
          <input
            ref={inputRef}
            className="gfilter-input"
            value={open ? query : displayValue}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIdx(-1);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            autoComplete="off"
          />
          <div className={`gfilter-chevron ${open ? 'open' : ''}`}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
        </div>
      </div>
      {open && (
        <div className="gfilter-dropdown">
          <div className="gfilter-options">
            {filtered.length === 0 ? (
              <div className="gfilter-item" style={{ color: '#9aa0a6', cursor: 'default' }}>
                Tidak ada hasil
              </div>
            ) : (
              filtered.map((o, i) => (
                <div
                  key={o.value}
                  className={`gfilter-item ${i === activeIdx ? 'active' : ''} ${value === o.value ? 'selected' : ''}`}
                  onMouseEnter={() => setActiveIdx(i)}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => selectOption(o.value)}
                >
                  <div className="gfilter-item-check">
                    {value === o.value && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>
                  <div className="gfilter-item-text">
                    {highlightMatch(o.label, query)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ================== MAIN ================== */
export default function DashboardAnalytics() {
  const [rows, setRows] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState("dashboard");
  const [year, setYear] = useState("all");
  const [month, setMonth] = useState("all");
  const [satkerFilter, setSatkerFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activePieIndex, setActivePieIndex] = useState(-1);

  useEffect(() => {
    // PASTIKAN SHEET_ID DAN SHEET_NAME SESUAI DENGAN FILE YANG DIUPLOAD
    const SHEET_ID = "1L2_ZN32Nc59zPSIMqdSvYuUZZ3moqIJ30p8tdjabGds";
    const SHEET_NAME = "Sheet1";
    fetch(`https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${SHEET_NAME}`)
      .then((r) => r.text())
      .then((text) => {
        const json = parseGvizResponse(text);
        const col = buildColIndexMap(json.table.cols);

        const data = json.table.rows.map((r: any) => {
          // --- LOGIKA PARSING DATA YANG DISESUAIKAN DENGAN EXCEL ---

          // Ambil Tanggal Dokumen
          const rawTgl = r.c[col.TGL_DOK]?.f || r.c[col.TGL_DOK]?.v || "-";

          // Parse tanggal untuk mendapatkan Tahun dan Bulan
          // Excel format: "YYYY-MM-DD HH:mm:ss" atau standar date object
          let dateObj = new Date(rawTgl);
          let tahunStr = "-";
          let bulanStr = "-";

          if (!isNaN(dateObj.getTime())) {
            tahunStr = String(dateObj.getFullYear());
            bulanStr = String(dateObj.getMonth() + 1); // 0-11 menjadi 1-12
          }

          return {
            tanggal: rawTgl, // Simpan raw date string
            tahun: tahunStr, // Hasil derivasi dari TGL_DOK
            bulan: bulanStr, // Hasil derivasi dari TGL_DOK
            akun: r.c[col.NAMA_AKUN]?.v || "-",
            satker: r.c[col.NAMA_SATKER]?.v || "-",
            sumberDana: r.c[col.NAMA_SUMBER_DANA]?.v || "-",
            debet: Number(r.c[col.DEBET]?.v || 0),
            deskripsi: r.c[col.DESKRIPSI]?.v || r.c[col.DESKRIPSI_TRANS]?.v || "-", // Prioritaskan DESKRIPSI
            kodePeriode: r.c[col.KODE_PERIODE]?.v || "-",
          };
        });
        setRows(data);
      })
      .catch((e) => setError(e.message));
  }, []);

  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      if (year !== "all" && String(r.tahun) !== year) return false;
      if (month !== "all" && String(r.bulan) !== String(month)) return false;
      if (satkerFilter !== "all" && r.satker !== satkerFilter) return false;
      if (search && !JSON.stringify(r).toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [rows, year, month, satkerFilter, search]);

  const totalDebet = useMemo(() => filteredRows.reduce((a, b) => a + b.debet, 0), [filteredRows]);
  const avgDebet = useMemo(() => filteredRows.length > 0 ? totalDebet / filteredRows.length : 0, [totalDebet, filteredRows]);

  const groupBy = (key: string) =>
    Object.values(
      filteredRows.reduce((acc: any, r: any) => {
        acc[r[key]] = acc[r[key]] || { name: r[key], value: 0 };
        acc[r[key]].value += r.debet;
        return acc;
      }, {})
    ).sort((a: any, b: any) => b.value - a.value);

  const byAkun = groupBy("akun");
  const bySumberDana = groupBy("sumberDana");
  const bySatker = groupBy("satker");
  const byDeskripsi = groupBy("deskripsi");

  const years = [...new Set(rows.map((r) => r.tahun).filter((t) => t !== "-" && Boolean(t)))].sort();
  const months = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];
  const satkers = [...new Set(rows.map((r) => r.satker).filter(Boolean))].sort();

  const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'];

  // --- TREN BELANJA BULANAN ---
  const monthlyTrend = useMemo(() => {
    const map: Record<string, number> = {};
    filteredRows.forEach((r) => {
      const m = Number(r.bulan);
      if (m >= 1 && m <= 12) {
        const key = String(m);
        map[key] = (map[key] || 0) + r.debet;
      }
    });
    const yearLabel = year !== 'all' ? ` ${year}` : '';
    return Array.from({ length: 12 }, (_, i) => ({
      bulan: `${MONTH_NAMES[i]}${yearLabel}`,
      bulanNum: i + 1,
      total: map[String(i + 1)] || 0,
    }));
  }, [filteredRows]);

  const STACKED_COLORS = ['#818cf8', '#34d399', '#fbbf24', '#f87171', '#22d3ee', '#a78bfa', '#fb923c', '#f472b6'];

  // --- BELANJA PER SATKER (BULANAN) ---
  const { stackedData, topSatkerNames } = useMemo(() => {
    // Get top 5 satkers by total spending
    const satkerTotals: Record<string, number> = {};
    filteredRows.forEach((r) => {
      satkerTotals[r.satker] = (satkerTotals[r.satker] || 0) + r.debet;
    });
    const topNames = Object.entries(satkerTotals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name]) => name);

    // Build monthly data with satker breakdown
    const monthMap: Record<string, Record<string, number>> = {};
    filteredRows.forEach((r) => {
      const m = Number(r.bulan);
      if (m >= 1 && m <= 12) {
        const key = String(m);
        if (!monthMap[key]) monthMap[key] = {};
        const satkerName = topNames.includes(r.satker) ? r.satker : 'Lainnya';
        monthMap[key][satkerName] = (monthMap[key][satkerName] || 0) + r.debet;
      }
    });

    const allNames = [...topNames];
    const hasOthers = filteredRows.some(r => !topNames.includes(r.satker));
    if (hasOthers) allNames.push('Lainnya');

    const yearLabel = year !== 'all' ? ` ${year}` : '';
    const data = Array.from({ length: 12 }, (_, i) => {
      const entry: any = { bulan: `${MONTH_NAMES[i]}${yearLabel}` };
      allNames.forEach(name => {
        entry[name] = monthMap[String(i + 1)]?.[name] || 0;
      });
      return entry;
    });

    return { stackedData: data, topSatkerNames: allNames };
  }, [filteredRows]);

  // --- HEATMAP INTENSITAS TRANSAKSI ---
  const heatmapData = useMemo(() => {
    const map: Record<string, number> = {};
    filteredRows.forEach((r) => {
      const raw = r.tanggal;
      if (!raw || raw === '-') return;

      let parsed: Date | null = new Date(raw);

      // Validasi tanggal
      if (parsed && !isNaN(parsed.getTime())) {
        // Format ke YYYY-MM-DD
        const key = `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}-${String(parsed.getDate()).padStart(2, '0')}`;
        map[key] = (map[key] || 0) + r.debet;
      }
    });
    return map;
  }, [filteredRows]);

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: Icons.dashboard },
    { id: "belanja", label: "Belanja", icon: Icons.belanja },
    { id: "satker", label: "Satuan Kerja", icon: Icons.satker },
  ];

  const reportItems = [
    { id: "laporan", label: "Laporan Detail", icon: Icons.laporan },
    { id: "deskripsi", label: "Deskripsi", icon: Icons.deskripsi },
  ];

  const pageTitle = {
    dashboard: "Dashboard Overview",
    belanja: "Belanja per Akun",
    satker: "Satuan Kerja",
    laporan: "Laporan Detail",
    deskripsi: "Deskripsi Transaksi",
  }[page] || "Dashboard";

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-blue-50">
      {/* ====== SIDEBAR ====== */}
      <aside
        className={`${sidebarCollapsed ? 'w-20' : 'w-[272px]'} flex-shrink-0 flex flex-col bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 shadow-2xl relative overflow-hidden`}
      >
        <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-20 -left-10 w-32 h-32 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 p-5 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-500/25">
              <img
                src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQz1-NDeFW4BHa471bualUk704QIQv-BfAvtw&s"
                alt="Logo BPK"
                className="w-7 h-7 object-contain rounded-lg"
              />
            </div>
            {!sidebarCollapsed && (
              <div className="min-w-0">
                <h1 className="font-bold text-sm text-white leading-tight tracking-tight">Dashboard</h1>
                <h1 className="font-bold text-sm text-indigo-300 leading-tight tracking-tight">Analytics BPK</h1>
              </div>
            )}
          </div>
        </div>

        <div className="mx-5 mb-3">
          <div className="h-px bg-gradient-to-r from-transparent via-slate-600 to-transparent" />
        </div>

        <nav className="relative z-10 flex-1 px-3 space-y-6 overflow-y-auto">
          <MenuGroup title={sidebarCollapsed ? "" : "MENU UTAMA"}>
            {menuItems.map((item) => (
              <SidebarItem
                key={item.id}
                active={page === item.id}
                onClick={() => setPage(item.id)}
                icon={item.icon}
                collapsed={sidebarCollapsed}
              >
                {item.label}
              </SidebarItem>
            ))}
          </MenuGroup>
          <MenuGroup title={sidebarCollapsed ? "" : "LAPORAN"}>
            {reportItems.map((item) => (
              <SidebarItem
                key={item.id}
                active={page === item.id}
                onClick={() => setPage(item.id)}
                icon={item.icon}
                collapsed={sidebarCollapsed}
              >
                {item.label}
              </SidebarItem>
            ))}
          </MenuGroup>
        </nav>

        <div className="relative z-10 flex justify-center my-2">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:text-white hover:bg-white/10"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points={sidebarCollapsed ? "9 18 15 12 9 6" : "15 18 9 12 15 6"} />
            </svg>
          </button>
        </div>

        <div className="relative z-10 p-3 pt-0">
          <div className="h-px bg-gradient-to-r from-transparent via-slate-600 to-transparent mb-3" />
          <div className={`flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 cursor-pointer ${sidebarCollapsed ? 'justify-center' : ''}`}>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center flex-shrink-0 shadow-md shadow-indigo-500/20">
              <span className="text-white font-bold text-sm">A</span>
            </div>
            {!sidebarCollapsed && (
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-white truncate">Admin BPK</p>
                <p className="text-[11px] text-slate-400 truncate">admin@bpk.go.id</p>
              </div>
            )}
            {!sidebarCollapsed && (
              <div className="text-slate-400 hover:text-red-400">
                {Icons.logout}
              </div>
            )}
          </div>
          {!sidebarCollapsed && <p className="text-[10px] text-slate-600 mt-3 text-center">© 2025 BPK RI · v1.0</p>}
        </div>
      </aside>

      {/* ====== MAIN ====== */}
      <main className="flex-1 p-6 lg:p-8 space-y-6 overflow-auto">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">{pageTitle}</h2>
            <p className="text-sm text-slate-500 mt-0.5">
              {filteredRows.length > 0
                ? `Menampilkan ${filteredRows.length.toLocaleString()} data transaksi`
                : "Memuat data..."}
            </p>
          </div>
          <div className="flex flex-col gap-3 w-full lg:w-auto">
            <AutocompleteSearch value={search} onChange={setSearch} rows={rows} />
            <div className="flex flex-wrap items-center gap-3">
              <AutocompleteFilterSelect value={year} onChange={setYear} options={years} placeholder="Tahun" />
              <AutocompleteFilterSelect value={month} onChange={setMonth} options={months} placeholder="Bulan" />
              <AutocompleteFilterSelect value={satkerFilter} onChange={setSatkerFilter} options={satkers} placeholder="Semua Satker" />
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl text-sm flex items-center gap-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
            {error}
          </div>
        )}

        {page === "dashboard" && (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
              <KpiCard
                title="TOTAL SP2D"
                value={formatShort(totalDebet)}
                subtitle={formatCurrency(totalDebet)}
                gradient="from-indigo-500 to-purple-600"
                bgGlow="bg-indigo-500/10"
                iconPath="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
              <KpiCard
                title="TRANSAKSI"
                value={filteredRows.length.toLocaleString()}
                subtitle={`${filteredRows.length} transaksi tercatat`}
                gradient="from-cyan-500 to-blue-600"
                bgGlow="bg-cyan-500/10"
                iconPath="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
              />
              <KpiCard
                title="RATA-RATA"
                value={formatShort(avgDebet)}
                subtitle={`Rata-rata per transaksi`}
                gradient="from-rose-500 to-pink-600"
                bgGlow="bg-rose-500/10"
                iconPath="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
              <KpiCard
                title="SATKER AKTIF"
                value={bySatker.length.toLocaleString()}
                subtitle={`${bySatker.length} satuan kerja`}
                gradient="from-amber-500 to-orange-600"
                bgGlow="bg-amber-500/10"
                iconPath="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
              <KpiCard
                title="SUMBER DANA"
                value={bySumberDana.length.toLocaleString()}
                subtitle={`${bySumberDana.length} sumber dana`}
                gradient="from-emerald-500 to-teal-600"
                bgGlow="bg-emerald-500/10"
                iconPath="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"
              />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-base font-semibold text-slate-800">Distribusi Sumber Dana</h3>
                  <span className="text-xs bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-full font-medium">{bySumberDana.length} sumber</span>
                </div>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={bySumberDana}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={2}
                      activeIndex={activePieIndex}
                      activeShape={renderActiveShape}
                      onMouseEnter={(_: any, index: number) => setActivePieIndex(index)}
                      onMouseLeave={() => setActivePieIndex(-1)}
                    >
                      {bySumberDana.map((_: any, i: number) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-4 space-y-2.5">
                  {bySumberDana.slice(0, 5).map((item: any, i: number) => (
                    <div key={i} className="flex justify-between items-center group">
                      <div className="flex items-center gap-2.5">
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        <span className="text-sm text-slate-600 group-hover:text-slate-800 transition-colors">{item.name}</span>
                      </div>
                      <span className="text-sm font-semibold text-slate-700 tabular-nums">{formatShort(item.value)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 overflow-hidden flex flex-col">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-base font-semibold text-slate-800">Top Belanja Akun</h3>
                  <span className="text-xs bg-purple-50 text-purple-600 px-2.5 py-1 rounded-full font-medium">Top 10</span>
                </div>
                <div className="flex-1" style={{ minHeight: 280, overflow: 'hidden' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={byAkun.slice(0, 10)} margin={{ top: 10, right: 10, left: 20, bottom: 10 }}>
                      <XAxis dataKey="name" hide />
                      <YAxis tickFormatter={formatShort} width={100} tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                      <Tooltip formatter={(v: any) => formatCurrency(v)} contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '13px' }} wrapperStyle={{ zIndex: 10, pointerEvents: 'none' }} />
                      <Bar dataKey="value" radius={[8, 8, 0, 0]} maxBarSize={48}>
                        {byAkun.slice(0, 10).map((_: any, i: number) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Monthly Trend */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-base font-semibold text-slate-800">Tren Belanja Bulanan</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Pengeluaran per bulan {year !== 'all' ? `tahun ${year}` : 'semua tahun'}</p>
                </div>
                <span className="text-xs bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-full font-medium">12 Bulan</span>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={monthlyTrend} margin={{ top: 10, right: 30, left: 20, bottom: 10 }}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="bulan" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={formatShort} width={100} tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    formatter={(v: any) => [formatCurrency(v), 'Total Belanja']}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '13px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                    labelStyle={{ fontWeight: 600, marginBottom: 4 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="total"
                    stroke="#818cf8"
                    strokeWidth={2.5}
                    fill="url(#colorTotal)"
                    dot={{ r: 4, fill: '#818cf8', stroke: '#fff', strokeWidth: 2 }}
                    activeDot={{ r: 6, fill: '#6366f1', stroke: '#fff', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Stacked Bar Chart per Satker */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-base font-semibold text-slate-800">Belanja per Satker (Bulanan)</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Perbandingan antar satuan kerja per bulan {year !== 'all' ? `tahun ${year}` : 'semua tahun'}</p>
                </div>
                <span className="text-xs bg-cyan-50 text-cyan-600 px-2.5 py-1 rounded-full font-medium">Top {topSatkerNames.length} Satker</span>
              </div>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={stackedData} margin={{ top: 10, right: 10, left: 20, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="bulan" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={formatShort} width={100} tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    formatter={(v: any, name: string) => [formatCurrency(v), name]}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                    labelStyle={{ fontWeight: 600, marginBottom: 4 }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: '11px', paddingTop: '12px' }}
                    iconType="circle"
                    iconSize={8}
                  />
                  {topSatkerNames.map((name, i) => (
                    <Bar key={name} dataKey={name} stackId="satker" fill={STACKED_COLORS[i % STACKED_COLORS.length]} radius={i === topSatkerNames.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Calendar Heatmap */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-base font-semibold text-slate-800">Heatmap Intensitas Transaksi</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Aktivitas belanja harian {year !== 'all' ? `tahun ${year}` : `tahun ${new Date().getFullYear()}`}</p>
                </div>
                <span className="text-xs bg-green-50 text-green-600 px-2.5 py-1 rounded-full font-medium">365 Hari</span>
              </div>
              <CalendarHeatmap data={heatmapData} year={year} />
            </div>
          </>
        )}

        {page === "belanja" && <DataTable title="Belanja per Akun" data={byAkun} />}
        {page === "satker" && <SatkerPieSection data={filteredRows} />}
        {page === "laporan" && <DetailTable data={filteredRows} />}
        {page === "deskripsi" && <DataTable title="Deskripsi Transaksi (Gabungan)" data={byDeskripsi} />}
      </main>
    </div>
  );
}

/* ================== SIDEBAR COMPONENTS ================== */

function MenuGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      {title && (
        <div className="text-[10px] font-semibold text-slate-500 mb-2 px-3 tracking-[0.12em] uppercase">
          {title}
        </div>
      )}
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function SidebarItem({
  children,
  active,
  onClick,
  icon,
  collapsed,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  collapsed: boolean;
}) {
  return (
    <div
      onClick={onClick}
      className={`
        relative flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer
        text-[13px] font-medium group
        ${collapsed ? 'justify-center' : ''}
        ${active
          ? 'bg-gradient-to-r from-indigo-500/20 to-purple-500/10 text-white shadow-lg shadow-indigo-500/5'
          : 'text-slate-400 hover:text-white hover:bg-white/5'
        }
      `}
    >
      {active && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-gradient-to-b from-indigo-400 to-purple-500" />
      )}

      <div className={`flex-shrink-0 ${active ? 'text-indigo-400' : ''}`}>
        {icon}
      </div>
      {!collapsed && <span>{children}</span>}
    </div>
  );
}

/* FilterSelect replaced by AutocompleteFilterSelect above */

/* ================== KPI CARD ================== */
function KpiCard({ title, value, subtitle, gradient, bgGlow, iconPath }: {
  title: string;
  value: string;
  subtitle: string;
  gradient: string;
  bgGlow: string;
  iconPath: string;
}) {
  return (
    <div className="relative bg-white rounded-2xl shadow-sm border border-slate-100 p-5 overflow-hidden group hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
      <div className={`absolute -top-8 -right-8 w-24 h-24 rounded-full ${bgGlow} blur-2xl opacity-60 group-hover:opacity-100 transition-opacity duration-300`} />

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-3">
          <p className="text-[10px] font-bold tracking-[0.1em] text-slate-400 uppercase">{title}</p>
          <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg`}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d={iconPath} />
            </svg>
          </div>
        </div>
        <p className="text-2xl font-bold text-slate-800 tracking-tight leading-none mb-1">{value}</p>
        <p className="text-xs text-slate-500 truncate">{subtitle}</p>
      </div>
    </div>
  );
}

/* ================== DATA TABLE ================== */
function DataTable({ title, data }: { title: string; data: any[] }) {
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const totalPages = Math.ceil(data.length / pageSize);
  const paginatedData = data.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
      <h3 className="font-semibold text-base text-slate-800 mb-5">{title}</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b border-slate-100">
              <th className="py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Nama</th>
              <th className="py-3 px-4 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Total</th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((r: any, i: number) => (
              <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors duration-150">
                <td className="py-3 px-4 pr-6 break-words text-slate-700">{r.name}</td>
                <td className="py-3 px-4 text-right whitespace-nowrap font-semibold text-slate-800 tabular-nums">{formatCurrency(r.value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex justify-between items-center mt-5 text-sm">
        <span className="text-slate-500">Halaman {currentPage} dari {totalPages || 1}</span>
        <div className="flex gap-2">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => p - 1)}
            className="px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 text-sm font-medium"
          >
            Prev
          </button>
          <button
            disabled={currentPage === totalPages || totalPages === 0}
            onClick={() => setCurrentPage((p) => p + 1)}
            className="px-4 py-2 rounded-xl bg-indigo-500 text-white hover:bg-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 text-sm font-medium shadow-sm"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

/* ================== SATKER PIE SECTION ================== */
function SatkerPieSection({ data }: { data: any[] }) {
  const satkerList = [...new Set(data.map((d) => d.satker))];

  const groupByAkun = (rows: any[]) =>
    Object.values(
      rows.reduce((acc: any, r: any) => {
        acc[r.akun] = acc[r.akun] || { name: r.akun, value: 0 };
        acc[r.akun].value += r.debet;
        return acc;
      }, {})
    ).sort((a: any, b: any) => b.value - a.value);

  return (
    <div className="space-y-6">
      {satkerList.map((satker, idx) => {
        const satkerRows = data.filter((d) => d.satker === satker);
        const akunData = groupByAkun(satkerRows);
        const maxValue = (akunData[0] as any)?.value || 1;

        return (
          <div key={idx} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <span className="text-white font-bold text-xs">{idx + 1}</span>
              </div>
              <h3 className="text-base font-semibold text-slate-800">{satker}</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="py-3 px-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Akun</th>
                    <th className="py-3 px-4 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Belanja</th>
                  </tr>
                </thead>
                <tbody>
                  {akunData.map((item: any, i: number) => {
                    const percentage = (item.value / maxValue) * 100;
                    return (
                      <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors duration-150">
                        <td className="py-3 px-4">{item.name}</td>
                        <td className="py-3 px-4 text-right relative">
                          <div
                            className="absolute left-0 top-1/2 -translate-y-1/2 h-8 rounded-lg opacity-20"
                            style={{
                              width: `${percentage}%`,
                              background: `linear-gradient(90deg, ${COLORS[i % COLORS.length]}, ${COLORS[(i + 1) % COLORS.length]})`,
                            }}
                          />
                          <span className="relative z-10 font-semibold text-slate-800 tabular-nums">{formatCurrency(item.value)}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ================== DETAIL TABLE ================== */
function DetailTable({ data }: { data: any[] }) {
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const totalPages = Math.ceil(data.length / pageSize);
  const paginatedData = data.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
      <h3 className="font-semibold text-base text-slate-800 mb-5">Detail Transaksi</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="py-3 px-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Tanggal</th>
              <th className="py-3 px-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Kode Periode</th>
              <th className="py-3 px-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Deskripsi</th>
              <th className="py-3 px-4 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Debet</th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((r, i) => (
              <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors duration-150">
                <td className="py-3 px-4 whitespace-nowrap text-slate-600">{r.tanggal}</td>
                <td className="py-3 px-4 whitespace-nowrap">
                  <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md text-xs font-mono">{r.kodePeriode}</span>
                </td>
                <td className="py-3 px-4 break-words text-slate-700 max-w-md">{r.deskripsi}</td>
                <td className="py-3 px-4 text-right whitespace-nowrap font-semibold text-slate-800 tabular-nums">{formatCurrency(r.debet)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex justify-between items-center mt-5 text-sm">
        <span className="text-slate-500">Halaman {currentPage} dari {totalPages || 1}</span>
        <div className="flex gap-2">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => p - 1)}
            className="px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 text-sm font-medium"
          >
            Prev
          </button>
          <button
            disabled={currentPage === totalPages || totalPages === 0}
            onClick={() => setCurrentPage((p) => p + 1)}
            className="px-4 py-2 rounded-xl bg-indigo-500 text-white hover:bg-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 text-sm font-medium shadow-sm"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
