"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Calendar, CheckCircle, Clock, User, Briefcase, FileText, CheckCircle2, Settings, LogOut, Loader2, Sparkles, LineChart as LineChartIcon, BarChart2, XCircle, ThumbsUp } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { supabase } from "../lib/supabase"; 

export default function Dashboard() {
  const pathname = usePathname();
  const router = useRouter();
  
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [userName, setUserName] = useState("");
  const [userHeadline, setUserHeadline] = useState("");

  const [stats, setStats] = useState({ total: 0, applied: 0, onProgress: 0, accepted: 0, rejected: 0 });
  const [chartData, setChartData] = useState<any[]>([]);
  const [upcomingInterviews, setUpcomingInterviews] = useState<any[]>([]);
  const [lolosAdmin, setLolosAdmin] = useState<any[]>([]);
  
  const [chartType, setChartType] = useState<'bar' | 'line'>('line');

  useEffect(() => {
    const fetchDashboardData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("name, headline")
        .eq("user_id", session.user.id)
        .single(); 

      if (profileError || !profile || !profile.name) {
        router.push("/profil");
        return;
      } 
      
      setUserName(profile.name);
      setUserHeadline(profile.headline);

      const { data: apps, error: appsError } = await supabase
        .from("applications")
        .select("*")
        .eq("user_id", session.user.id);

      if (apps && !appsError) {
        let applied = 0, onProgress = 0, accepted = 0, rejected = 0;
        
        apps.forEach(app => {
          const stat = app.status || "";
          if (stat === "Applied") {
            applied++;
          } else if (["Lolos Administrasi", "Online Test", "Psikotest", "Interview 1", "Interview 2", "Interview HR", "Interview User", "Offer"].includes(stat)) {
            onProgress++;
          } else if (stat === "Accepted") {
            accepted++;
          } else if (["Rejected", "Ghosted"].includes(stat)) {
            rejected++;
          }
        });
        setStats({ total: apps.length, applied, onProgress, accepted, rejected });

        setLolosAdmin(apps.filter(a => a.status === "Lolos Administrasi"));

        const today = new Date().toISOString().split("T")[0];
        const upcoming = apps
          .filter(a => a.interview_date && a.interview_date >= today)
          .sort((a, b) => a.interview_date.localeCompare(b.interview_date))
          .slice(0, 3);
        setUpcomingInterviews(upcoming);

        // LOGIKA DINAMIS: Cari bulan terakhir berdasarkan data lamaran paling baru
        let anchorDate = new Date();
        if (apps.length > 0) {
          const validDates = apps.filter(a => a.applied_date).map(a => new Date(a.applied_date).getTime());
          if (validDates.length > 0) {
            anchorDate = new Date(Math.max(...validDates)); // Ambil tanggal terbesar (terbaru)
          }
        }

        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
        const currentMonth = anchorDate.getMonth();
        const chartMap: Record<string, any> = {};
        
        // Buat cetakan 6 bulan ke belakang dari anchorDate
        for (let i = 5; i >= 0; i--) {
          let m = currentMonth - i;
          if (m < 0) m += 12;
          chartMap[monthNames[m]] = { name: monthNames[m], Applied: 0, OnProgress: 0, Accepted: 0, Reject: 0 };
        }

        // Isi Data
        apps.forEach(app => {
          if (app.applied_date) {
            const appMonth = monthNames[new Date(app.applied_date).getMonth()];
            if (chartMap[appMonth]) {
              const stat = app.status || "";
              if (stat === "Applied") {
                chartMap[appMonth].Applied++;
              } else if (["Lolos Administrasi", "Online Test", "Psikotest", "Interview 1", "Interview 2", "Interview HR", "Interview User", "Offer"].includes(stat)) {
                chartMap[appMonth].OnProgress++;
              } else if (stat === "Accepted") {
                chartMap[appMonth].Accepted++;
              } else if (["Rejected", "Ghosted"].includes(stat)) {
                chartMap[appMonth].Reject++;
              }
            }
          }
        });
        setChartData(Object.values(chartMap));
      }

      setIsCheckingAuth(false);
    };
    
    fetchDashboardData();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (isCheckingAuth) return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><Loader2 className="w-8 h-8 text-blue-600 animate-spin" /></div>;

  const isHired = stats.accepted > 0;
  const isRejectedNeedsMotivation = stats.rejected > 0 && !isHired;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-700 font-sans overflow-x-hidden">
      <header className="bg-white border-b border-slate-200 px-8 py-3 flex items-center justify-between sticky top-0 z-20">
        <div className="w-1/4 flex justify-start items-center gap-2 font-bold text-xl text-blue-600 tracking-tight">JobTracker</div>
        <nav className="w-2/4 flex justify-center gap-2">
          <Link href="/" className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${pathname === "/" ? "bg-blue-500 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"}`}>Dashboard</Link>
          <Link href="/list" className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${pathname === "/list" ? "bg-blue-500 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"}`}>Daftar Lamaran</Link>
        </nav>
        <div className="w-1/4 flex justify-end items-center relative">
          <button onClick={() => setIsProfileOpen(!isProfileOpen)} className="flex items-center gap-3 hover:bg-slate-50 p-1.5 rounded-lg transition-colors cursor-pointer text-left">
            <div className="text-right hidden md:block">
              <div className="text-xs font-bold text-slate-700 uppercase tracking-wide">Hi, {userName || "Pengguna Baru"}</div>
              <div className="text-[11px] text-slate-500">{userHeadline ? (userHeadline.length > 30 ? userHeadline.substring(0, 30) + '...' : userHeadline) : "Silakan lengkapi profil"}</div>
            </div>
            <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden"><User className="w-5 h-5 text-slate-400" /></div>
          </button>
          
          {isProfileOpen && (
            <div className="absolute top-14 right-0 w-48 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-50 animate-in fade-in slide-in-from-top-2">
              <Link href="/profil" className="px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"><Settings className="w-4 h-4 text-slate-400" /> Pengaturan Profil</Link>
              <div className="border-t border-slate-100 my-1"></div>
              <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"><LogOut className="w-4 h-4 text-red-400" /> Keluar</button>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-8 py-8 pb-20 animate-in fade-in slide-in-from-bottom-8 duration-700">
        {isHired && (
          <div className="mb-6 p-5 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-xl shadow-lg text-white flex items-center justify-between animate-in slide-in-from-top-4 duration-700">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-full animate-bounce"><Sparkles className="w-8 h-8 text-white" /></div>
              <div>
                <h2 className="font-bold text-xl tracking-wide">Selamat! Pencapaian Luar Biasa! 🎉</h2>
                <p className="text-sm text-emerald-50 mt-0.5">Satu atau lebih lamaran Anda telah berhasil menembus garis finishing. Lihat garis hijau tebal di grafik Anda!</p>
              </div>
            </div>
          </div>
        )}

        {isRejectedNeedsMotivation && (
          <div className="mb-6 p-5 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-xl shadow-lg text-white flex items-center justify-between animate-in slide-in-from-top-4 duration-700">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="p-3 bg-white/20 rounded-full animate-bounce shadow-inner"><ThumbsUp className="w-8 h-8 text-white drop-shadow-md" /></div>
                <div className="absolute inset-0 bg-white/30 rounded-full animate-ping opacity-75"></div>
              </div>
              <div>
                <h2 className="font-bold text-xl tracking-wide">It's Okay, You Still Got It! 💪</h2>
                <p className="text-sm text-indigo-50 mt-0.5">Ditolak {stats.rejected} kali itu biasa! Istirahat sejenak, perbaiki strategi, dan gas lagi. Pintu yang lebih baik sedang menunggumu.</p>
              </div>
            </div>
          </div>
        )}

        <div className="mb-8 mt-2">
          <h1 className="text-2xl font-semibold text-slate-800">Dashboard</h1>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm relative overflow-hidden">
            <div className="text-slate-500 text-xs font-medium mb-2">Total Lamaran</div>
            <div className="text-3xl font-bold text-slate-800">{stats.total}</div>
            <div className="absolute top-4 right-4 w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center"><Briefcase className="w-4 h-4 text-slate-500"/></div>
          </div>
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm relative overflow-hidden">
            <div className="text-slate-500 text-xs font-medium mb-2">Di Lamar / Applied</div>
            <div className="text-3xl font-bold text-slate-800">{stats.applied}</div>
            <div className="absolute top-4 right-4 w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center"><FileText className="w-4 h-4 text-blue-500"/></div>
          </div>
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm relative overflow-hidden">
            <div className="text-slate-500 text-xs font-medium mb-2">On Progress</div>
            <div className="text-3xl font-bold text-slate-800">{stats.onProgress}</div>
            <div className="absolute top-4 right-4 w-8 h-8 bg-amber-50 rounded-full flex items-center justify-center"><Clock className="w-4 h-4 text-amber-500"/></div>
          </div>
          <div className={`bg-white border ${isHired ? 'border-emerald-400 ring-2 ring-emerald-100' : 'border-slate-200'} rounded-lg p-5 shadow-sm relative overflow-hidden transition-all duration-500`}>
            <div className={`${isHired ? 'text-emerald-600' : 'text-slate-500'} text-xs font-bold mb-2 uppercase tracking-wide`}>Keterima 🎉</div>
            <div className="text-3xl font-bold text-slate-800">{stats.accepted}</div>
            <div className={`absolute top-4 right-4 w-8 h-8 ${isHired ? 'bg-emerald-500 text-white animate-pulse' : 'bg-emerald-50 text-emerald-500'} rounded-full flex items-center justify-center`}><CheckCircle2 className="w-4 h-4"/></div>
          </div>
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm relative overflow-hidden">
            <div className="text-slate-500 text-xs font-medium mb-2">Reject / Ghosted</div>
            <div className="text-3xl font-bold text-slate-800">{stats.rejected}</div>
            <div className="absolute top-4 right-4 w-8 h-8 bg-red-50 rounded-full flex items-center justify-center"><XCircle className="w-4 h-4 text-red-500"/></div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-6">
          <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm flex flex-col h-[420px]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-sm font-semibold text-slate-700">Tren Aplikasi Bulanan</h2>
              <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
                <button onClick={() => setChartType('line')} className={`p-1.5 rounded-md text-xs flex items-center transition-all ${chartType === 'line' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`} title="Line Chart"><LineChartIcon className="w-4 h-4" /></button>
                <button onClick={() => setChartType('bar')} className={`p-1.5 rounded-md text-xs flex items-center transition-all ${chartType === 'bar' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`} title="Bar Chart"><BarChart2 className="w-4 h-4" /></button>
              </div>
            </div>
            
            <div className="flex-1 w-full min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                {chartType === 'bar' ? (
                  <BarChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="4 4" stroke="#e2e8f0" strokeWidth={2} vertical={false} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} allowDecimals={false} domain={[0, stats.total === 0 ? 4 : 'auto']} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '13px' }} cursor={{fill: '#f8fafc'}} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '15px' }} />
                    
                    {stats.applied > 0 && <Bar dataKey="Applied" name="Di Lamar" fill="#94a3b8" radius={[4, 4, 0, 0]} />}
                    {stats.onProgress > 0 && <Bar dataKey="OnProgress" name="On Progress" fill="#3b82f6" radius={[4, 4, 0, 0]} />}
                    {stats.rejected > 0 && <Bar dataKey="Reject" name="Reject" fill="#ef4444" radius={[4, 4, 0, 0]} />}
                    {stats.accepted > 0 && <Bar dataKey="Accepted" name="Keterima 🎉" fill="#10b981" radius={[4, 4, 0, 0]} />}
                  </BarChart>
                ) : (
                  <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="4 4" stroke="#e2e8f0" strokeWidth={2} vertical={false} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} allowDecimals={false} domain={[0, stats.total === 0 ? 4 : 'auto']} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '13px' }} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '15px' }} />
                    
                    {stats.applied > 0 && <Line type="monotone" dataKey="Applied" name="Di Lamar" stroke="#94a3b8" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />}
                    {stats.onProgress > 0 && <Line type="monotone" dataKey="OnProgress" name="On Progress" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />}
                    {stats.rejected > 0 && <Line type="monotone" dataKey="Reject" name="Reject" stroke="#ef4444" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />}
                    {stats.accepted > 0 && <Line type="monotone" dataKey="Accepted" name="Keterima 🎉" stroke="#10b981" strokeWidth={isHired ? 7 : 3} dot={{ r: isHired ? 7 : 4, fill: "#10b981", stroke: "#fff", strokeWidth: 2 }} activeDot={{ r: 10 }} />}
                  </LineChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="flex flex-col gap-6 h-[420px]">
            <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm flex-1 flex flex-col">
              <h2 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2"><Calendar className="w-4 h-4 text-blue-500" /> Jadwal Seleksi Mendatang</h2>
              {upcomingInterviews.length > 0 ? (
                <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                  {upcomingInterviews.map((app) => (
                    <div key={app.id} className="p-3 bg-blue-50/50 border border-blue-100 rounded-md">
                      <div className="flex justify-between items-start">
                        <div className="font-semibold text-sm text-slate-800">{app.company}</div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-700">{app.status}</span>
                      </div>
                      <div className="text-xs text-slate-500 mt-1">{new Date(app.interview_date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })} - {app.interview_time || 'Waktu belum ditentukan'}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex-1 text-xs text-slate-400 font-medium border border-dashed border-slate-200 rounded-md flex items-center justify-center">Belum ada jadwal terdekat</div>
              )}
            </div>

            <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm flex-1 flex flex-col">
              <h2 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2"><Clock className="w-4 h-4 text-amber-500" /> Status Applied (Belum direspon)</h2>
              <div className="flex-1 text-xs text-slate-400 font-medium border border-dashed border-slate-200 rounded-md flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-slate-700 mb-1">{stats.applied}</span> Lamaran Menunggu
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}