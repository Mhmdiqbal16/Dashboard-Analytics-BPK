import { useEffect, useMemo, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#06b6d4", "#8b5cf6"];

/* ================== HELPERS ================== */
function parseGvizResponse(text) {
  const match = text.match(/google\.visualization\.Query\.setResponse\((.*)\);/s);
  if (!match || !match[1]) throw new Error("Invalid Google Sheets response format");
  return JSON.parse(match[1]);
}

function buildColIndexMap(cols) {
  const map = {};
  cols.forEach((c, i) => {
    if (c.label) map[c.label.trim()] = i;
  });
  return map;
}

function formatCurrency(v) {
  return v.toLocaleString("id-ID", { style: "currency", currency: "IDR" });
}

function formatShort(v) {
  if (v >= 1e12) return `Rp ${(v / 1e12).toFixed(2)} T`;
  if (v >= 1e9) return `Rp ${(v / 1e9).toFixed(2)} M`;
  if (v >= 1e6) return `Rp ${(v / 1e6).toFixed(2)} Jt`;
  return `Rp ${v.toLocaleString("id-ID")}`;
}

/* ================== MAIN ================== */
export default function DashboardAnalytics() {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState(null);
  const [page, setPage] = useState("dashboard");

  const [year, setYear] = useState("all");
  const [month, setMonth] = useState("all");
  const [satkerFilter, setSatkerFilter] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const SHEET_ID = "1L2_ZN32Nc59zPSIMqdSvYuUZZ3moqIJ30p8tdjabGds";
    const SHEET_NAME = "Sheet1";

    fetch(`https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${SHEET_NAME}`)
      .then((r) => r.text())
      .then((text) => {
        const json = parseGvizResponse(text);
        const col = buildColIndexMap(json.table.cols);

        const data = json.table.rows.map((r) => ({
          tanggal: r.c[col.TGL_DOK]?.f || r.c[col.TGL_DOK]?.v || "-",
          tahun: r.c[col.TAHUN]?.v,
          bulan: r.c[col.BULAN]?.v,
          akun: r.c[col.NAMA_AKUN]?.v || "-",
          satker: r.c[col.NAMA_SATKER]?.v || "-",
          sumberDana: r.c[col.NAMA_SUMBER_DANA]?.v || "-",
          debet: Number(r.c[col.DEBET]?.v || 0),
          deskripsi: r.c[col.DESKRIPSI]?.v || "-",
          kodePeriode: r.c[col.KODE_PERIODE]?.v || "-",
        }));

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

  const groupBy = (key) =>
    Object.values(
      filteredRows.reduce((acc, r) => {
        acc[r[key]] = acc[r[key]] || { name: r[key], value: 0 };
        acc[r[key]].value += r.debet;
        return acc;
      }, {})
    ).sort((a, b) => b.value - a.value);

  const byAkun = groupBy("akun");
  const bySumberDana = groupBy("sumberDana");
  const bySatker = groupBy("satker");
  const byDeskripsi = groupBy("deskripsi");

  const years = [...new Set(rows.map((r) => r.tahun).filter(Boolean))];
  const months = [...new Set(rows.map((r) => r.bulan).filter(Boolean))];
  const satkers = [...new Set(rows.map((r) => r.satker).filter(Boolean))];

  return (
    <div className="flex min-h-screen bg-slate-100">
      {/* SIDEBAR */}
      <aside className="w-72 bg-white shadow-xl rounded-r-3xl m-4 p-6 flex flex-col">
        <div className="flex items-center gap-3 mb-6">
          <img
            src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQz1-NDeFW4BHa471bualUk704QIQv-BfAvtw&s"
            alt="Logo BPK"
            className="w-10 h-10 object-contain"
          />
          <h1 className="font-semibold text-sm leading-tight">Dashboard Analytics BPK</h1>
        </div>

        <MenuGroup title="MENU UTAMA">
          <SidebarItem active={page === "dashboard"} onClick={() => setPage("dashboard")}>Dashboard</SidebarItem>
          <SidebarItem active={page === "belanja"} onClick={() => setPage("belanja")}>Belanja</SidebarItem>
          <SidebarItem active={page === "satker"} onClick={() => setPage("satker")}>Satuan Kerja</SidebarItem>
        </MenuGroup>

        <MenuGroup title="LAPORAN">
          <SidebarItem active={page === "laporan"} onClick={() => setPage("laporan")}>Laporan Detail</SidebarItem>
          <SidebarItem active={page === "deskripsi"} onClick={() => setPage("deskripsi")}>Deskripsi (Gabungan)</SidebarItem>
        </MenuGroup>

        <div className="mt-auto space-y-4">
          <div className="p-4 rounded-2xl bg-slate-50 border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center font-semibold text-indigo-600">
                A
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">Admin BPK</p>
                <p className="text-xs text-gray-500 truncate">admin@bpk.go.id</p>
              </div>
            </div>
          </div>
          <div className="text-xs text-gray-400">© BPK RI</div>
        </div>
      </aside>

      {/* MAIN */}
      <main className="flex-1 p-8 space-y-8">
        <div className="bg-white rounded-2xl shadow p-4 flex flex-wrap gap-3 justify-between items-center">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari data…"
            className="px-4 py-2 border rounded-xl text-sm w-full sm:w-64"
          />
          <div className="flex flex-wrap gap-2">
            <Select value={year} onChange={setYear} options={years} placeholder="Tahun" />
            <Select value={month} onChange={setMonth} options={months} placeholder="Bulan" />
            <Select value={satkerFilter} onChange={setSatkerFilter} options={satkers} placeholder="Seluruh Satuan Kerja" />
          </div>
        </div>

        {error && <div className="bg-red-100 text-red-700 p-4 rounded">{error}</div>}

        {page === "dashboard" && (
          <>
            {/* KPI */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Kpi title="Total SP2D" value={formatShort(totalDebet)} fullValue={formatCurrency(totalDebet)} color="indigo" />
              <Kpi title="Transaksi" value={filteredRows.length.toLocaleString()} fullValue={filteredRows.length + " transaksi"} color="green" />
              <Kpi title="Satker" value={bySatker.length.toLocaleString()} fullValue={bySatker.length + " satker aktif"} color="orange" />
              <Kpi title="Sumber Dana" value={bySumberDana.length.toLocaleString()} fullValue={bySumberDana.length + " sumber dana"} color="cyan" />
            </div>

            {/* CHARTS + DESKRIPSI - DIGANTI GRID-COLS AGAR VERTIKAL */}
            <div className="grid grid-cols-1 gap-6">
              <div className="bg-white rounded-2xl shadow p-8">
                <h3 className="text-lg font-semibold mb-6">Distribusi Sumber Dana</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={bySumberDana} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90}>
                      {bySumberDana.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => formatCurrency(v)} />
                  </PieChart>
                </ResponsiveContainer>

                {/* DESKRIPSI LIST */}
                <div className="mt-6 space-y-3 text-base">
                  {bySumberDana.slice(0, 5).map((item, i) => (
                    <div key={i} className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        <span className="text-gray-600">{item.name}</span>
                      </div>
                      <span className="font-medium">{formatCurrency(item.value)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow p-8">
                <h3 className="text-lg font-semibold mb-6">Top Belanja Akun</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={byAkun.slice(0, 10)} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <XAxis dataKey="name" hide />
                    <YAxis tickFormatter={formatShort} width={90} />
                    <Tooltip formatter={(v) => formatCurrency(v)} />
                    <Bar dataKey="value" fill="#6366f1" radius={[8, 8, 0, 0]} maxBarSize={60} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}

        {page === "belanja" && <DataTable title="Belanja per Akun" data={byAkun} />}
        {page === "satker" && (
          <SatkerPieSection data={filteredRows} />
        )}
        {page === "laporan" && <DetailTable data={filteredRows} />}
        {page === "deskripsi" && <DataTable title="Deskripsi Transaksi (Gabungan)" data={byDeskripsi} />}
      </main>
    </div>
  );
}

/* ================== UI COMPONENTS ================== */
function MenuGroup({ title, children }) {
  return (
    <div className="mb-6">
      <div className="text-[11px] font-semibold text-gray-400 mb-2 tracking-wide">{title}</div>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function SidebarItem({ children, active, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`px-4 py-2 rounded-xl cursor-pointer text-sm ${
        active ? "bg-indigo-100 text-indigo-600 font-medium" : "text-gray-600 hover:bg-gray-100"
      }`}
    >
      {children}
    </div>
  );
}

function Select({ value, onChange, options, placeholder }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className="px-3 py-2 border rounded-xl text-sm">
      <option value="all">{placeholder}</option>
      {options.map((o) => (
        <option key={o} value={o}>{o}</option>
      ))}
    </select>
  );
}

function Kpi({ title, value, fullValue, color = "indigo" }) {
  const colorMap = {
    indigo: "bg-indigo-500",
    green: "bg-emerald-500",
    orange: "bg-orange-500",
    cyan: "bg-cyan-500",
  };

  return (
    <div className={`group relative p-5 rounded-2xl shadow text-white ${colorMap[color]}`}>
      <p className="text-xs opacity-90">{title}</p>
      <p className="text-lg font-bold mt-1">{value}</p>
      <div className="absolute left-1/2 -translate-x-1/2 top-16 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
        <div className="bg-black/70 backdrop-blur-sm text-white text-xs px-3 py-2 rounded-lg shadow-lg whitespace-nowrap">
          {fullValue}
        </div>
      </div>
    </div>
  );
}

function DataTable({ title, data }) {
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const totalPages = Math.ceil(data.length / pageSize);
  const paginatedData = data.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="bg-white rounded-2xl shadow p-6">
      <h3 className="font-semibold text-sm mb-4">{title}</h3>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-gray-500 border-b">
            <th className="py-2">Nama</th>
            <th className="py-2 text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          {paginatedData.map((r, i) => (
            <tr key={i} className="border-t">
              <td className="py-2 pr-4 break-words">{r.name}</td>
              <td className="py-2 text-right whitespace-nowrap">{formatCurrency(r.value)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex justify-between items-center mt-4 text-sm">
        <span>Page {currentPage} of {totalPages || 1}</span>
        <div className="flex gap-2">
          <button disabled={currentPage === 1} onClick={() => setCurrentPage((p) => p - 1)} className="px-3 py-1 rounded-lg border disabled:opacity-50">Prev</button>
          <button disabled={currentPage === totalPages || totalPages === 0} onClick={() => setCurrentPage((p) => p + 1)} className="px-3 py-1 rounded-lg border disabled:opacity-50">Next</button>
        </div>
      </div>
    </div>
  );
}

function SatkerPieSection({ data }) {
  const satkerList = [...new Set(data.map(d => d.satker))];

  const groupByAkun = (rows) =>
    Object.values(
      rows.reduce((acc, r) => {
        acc[r.akun] = acc[r.akun] || { name: r.akun, value: 0 };
        acc[r.akun].value += r.debet;
        return acc;
      }, {})
    ).sort((a, b) => b.value - a.value);

  return (
    <div className="space-y-8">
      {satkerList.map((satker, idx) => {
        const satkerRows = data.filter(d => d.satker === satker);
        const akunData = groupByAkun(satkerRows);
        const maxValue = akunData[0]?.value || 1;

        return (
          <div key={idx} className="bg-white rounded-2xl shadow p-8">
            <h3 className="text-lg font-semibold mb-6">{satker}</h3>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b">
                    <th className="py-2">Akun</th>
                    <th className="py-2 text-right">Total Belanja</th>
                  </tr>
                </thead>
                <tbody>
                  {akunData.map((item, i) => {
                    const percentage = (item.value / maxValue) * 100;
                    return (
                      <tr key={i} className="border-t">
                        <td className="py-3 pr-4">{item.name}</td>
                        <td className="py-3 text-right relative">
                          <div
                            className="absolute left-0 top-1/2 -translate-y-1/2 h-8 bg-blue-100 rounded-lg"
                            style={{ width: `${percentage}%` }}
                          />
                          <span className="relative z-10 font-medium">
                            {formatCurrency(item.value)}
                          </span>
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

function DetailTable({ data }) {
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const totalPages = Math.ceil(data.length / pageSize);
  const paginatedData = data.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="bg-white rounded-2xl shadow p-6">
      <h3 className="font-semibold text-sm mb-4">Detail Transaksi</h3>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-gray-500 border-b">
            <th className="py-2">Tanggal</th>
            <th className="py-2">Kode Periode</th>
            <th className="py-2">Deskripsi</th>
            <th className="py-2 text-right">Debet</th>
          </tr>
        </thead>
        <tbody>
          {paginatedData.map((r, i) => (
            <tr key={i} className="border-t">
              <td className="py-2 whitespace-nowrap">{r.tanggal}</td>
              <td className="py-2 whitespace-nowrap">{r.kodePeriode}</td>
              <td className="py-2 pr-4 break-words">{r.deskripsi}</td>
              <td className="py-2 text-right whitespace-nowrap">{formatCurrency(r.debet)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex justify-between items-center mt-4 text-sm">
        <span>Page {currentPage} of {totalPages || 1}</span>
        <div className="flex gap-2">
          <button disabled={currentPage === 1} onClick={() => setCurrentPage((p) => p - 1)} className="px-3 py-1 rounded-lg border disabled:opacity-50">Prev</button>
          <button disabled={currentPage === totalPages || totalPages === 0} onClick={() => setCurrentPage((p) => p + 1)} className="px-3 py-1 rounded-lg border disabled:opacity-50">Next</button>
        </div>
      </div>
    </div>
  );
}