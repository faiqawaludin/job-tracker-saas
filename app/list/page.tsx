"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation"; 
import { Briefcase, Calendar, Save, Plus, Edit2, Sparkles, FileText, User, Settings, LogOut, Loader2, X, Trash2, CheckCircle2, AlertCircle, CalendarPlus } from "lucide-react";
import { supabase } from "../../lib/supabase";

export default function ListPage() {
  const pathname = usePathname();
  const router = useRouter(); 
  
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [userName, setUserName] = useState("");
  const [userHeadline, setUserHeadline] = useState("");
  
  const [applications, setApplications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{ show: boolean; message: string; type: "success" | "error" } | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [company, setCompany] = useState("");
  const [position, setPosition] = useState("");
  const [appliedDate, setAppliedDate] = useState("");
  const [status, setStatus] = useState("Applied");
  const [priority, setPriority] = useState("Medium");
  const [jobDescription, setJobDescription] = useState("");
  const [interviewDate, setInterviewDate] = useState("");
  const [interviewTime, setInterviewTime] = useState("");
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [matchScore, setMatchScore] = useState<number | null>(null);

  // LOGIKA STATUS TAHAPAN SELEKSI YANG LEBIH LENGKAP
  const isScheduleStage = ["Lolos Administrasi", "Online Test", "Psikotest", "Interview 1", "Interview 2", "Interview HR", "Interview User"].includes(status);
  
  // Dapatkan string tanggal hari ini (YYYY-MM-DD) untuk membatasi input
  const todayString = new Date().toISOString().split("T")[0];

  useEffect(() => {
    const checkUserAndProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("name, headline")
        .eq("user_id", session.user.id)
        .single();

      if (error || !profile || !profile.name) {
        router.push("/profil");
      } else {
        setUserName(profile.name);
        setUserHeadline(profile.headline);
        setIsCheckingAuth(false);
        fetchApplications(); 
      }
    };
    checkUserAndProfile();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast(null), 4000); 
  };

  const fetchApplications = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("applications")
      .select("*")
      .order("applied_date", { ascending: false });

    if (error) {
      showToast(`Gagal mengambil data: ${error.message}`, "error");
    } else {
      setApplications(data || []);
    }
    setIsLoading(false);
  };

  const handleAddNew = () => {
    setEditingId(null);
    setCompany("");
    setPosition("");
    setAppliedDate(todayString); // Otomatis terisi hari ini
    setStatus("Applied");
    setPriority("Medium");
    setJobDescription("");
    setInterviewDate("");
    setInterviewTime("");
    setMatchScore(null);
    setIsModalOpen(true);
  };

  const handleEdit = (app: any) => {
    setEditingId(app.id);
    setCompany(app.company);
    setPosition(app.position);
    setAppliedDate(app.applied_date || "");
    setStatus(app.status);
    setPriority(app.priority || "Medium");
    setJobDescription(app.job_description || "");
    setInterviewDate(app.interview_date || "");
    setInterviewTime(app.interview_time || "");
    setMatchScore(app.match_score);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();

    const payload = {
      company,
      position,
      status,
      applied_date: appliedDate || null,
      priority,
      job_description: jobDescription,
      interview_date: interviewDate || null,
      interview_time: interviewTime || null,
      match_score: matchScore,
      user_id: user?.id, 
    };

    let serverError = null;
    if (editingId) {
      const { error } = await supabase.from("applications").update(payload).eq("id", editingId);
      serverError = error;
    } else {
      const { error } = await supabase.from("applications").insert([payload]);
      serverError = error;
    }

    if (serverError) {
      showToast(`Gagal menyimpan: ${serverError.message}`, "error");
    } else {
      showToast(editingId ? "Data berhasil diperbarui!" : "Lamaran baru berhasil ditambahkan!", "success");
      setIsModalOpen(false);
      fetchApplications();
    }
  };

  const handleDelete = async () => {
    const confirmDelete = window.confirm("Apakah Anda yakin ingin menghapus lamaran ini?");
    if (!confirmDelete || !editingId) return;

    const { error } = await supabase.from("applications").delete().eq("id", editingId);
    if (error) {
      showToast(`Gagal menghapus: ${error.message}`, "error");
    } else {
      showToast("Data lamaran berhasil dihapus!", "success");
      setIsModalOpen(false);
      fetchApplications();
    }
  };

  const handleAnalyze = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
      setMatchScore(Math.floor(Math.random() * (95 - 60 + 1)) + 60); 
    }, 2000);
  };

  // FUNGSI AJAIB: MEMBUAT LINK GOOGLE CALENDAR (Tanpa Backend!)
  const handleAddToCalendar = () => {
    if (!interviewDate || !interviewTime) {
      showToast("Mohon lengkapi tanggal dan jam seleksi terlebih dahulu!", "error");
      return;
    }

    // Gabungkan tanggal & jam
    const startDateTime = new Date(`${interviewDate}T${interviewTime}`);
    // Anggap durasi standar adalah 1 Jam
    const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000);

    // Format waktu menjadi standar UTC yang dibaca Google (YYYYMMDDTHHmmssZ)
    const formatToUTC = (date: Date) => date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

    const eventTitle = encodeURIComponent(`Jadwal ${status}: ${company} - ${position}`);
    const eventDetails = encodeURIComponent(`Posisi: ${position}\nPerusahaan: ${company}\nStatus Saat Ini: ${status}\n\nPersiapkan dirimu sebaik mungkin!`);
    
    // URL ajaib dari Google Calendar Template
    const googleCalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${eventTitle}&dates=${formatToUTC(startDateTime)}/${formatToUTC(endDateTime)}&details=${eventDetails}`;
    
    // Buka tab baru langsung ke Google Calendar
    window.open(googleCalUrl, '_blank');
  };

  if (isCheckingAuth) return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><Loader2 className="w-8 h-8 text-blue-600 animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-700 font-sans overflow-x-hidden relative">
      
      {toast && (
        <div className={`fixed bottom-6 right-6 z-[100] px-5 py-3.5 rounded-lg shadow-xl flex items-center gap-3 animate-in slide-in-from-bottom-5 fade-in duration-300 ${toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white'}`}>
          {toast.type === 'error' ? <AlertCircle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
          <p className="text-sm font-medium">{toast.message}</p>
        </div>
      )}

      <header className="bg-white border-b border-slate-200 px-8 py-3 flex items-center justify-between sticky top-0 z-10">
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

      <main className="max-w-7xl mx-auto px-8 py-8 pb-20 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-800">Daftar Lamaran</h1>
            <p className="text-slate-500 mt-1 text-sm">Kelola proses rekrutmen Anda di sini.</p>
          </div>
          <button onClick={handleAddNew} className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-md text-sm font-medium flex items-center justify-center gap-2 shadow-sm transition-colors">
            <Plus className="w-4 h-4" /> Tambah Lamaran
          </button>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm min-h-[300px]">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="p-4">Perusahaan / Posisi</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Tgl Apply</th>
                  <th className="p-4 text-center">Match Score (AI)</th>
                  <th className="p-4">Priority</th>
                  <th className="p-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="p-12 text-center">
                      <Loader2 className="w-6 h-6 text-blue-500 animate-spin mx-auto mb-2" />
                      <span className="text-slate-500 text-sm">Memuat data dari database...</span>
                    </td>
                  </tr>
                ) : applications.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-slate-500">
                      Belum ada data lamaran. Silakan klik "Tambah Lamaran" di kanan atas.
                    </td>
                  </tr>
                ) : (
                  applications.map((app) => (
                    <tr key={app.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4">
                        <div className="font-semibold text-slate-800">{app.company}</div>
                        <div className="text-slate-500 text-xs mt-0.5">{app.position}</div>
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                          app.status === 'Applied' ? 'bg-slate-100 text-slate-600' : 
                          app.status === 'Accepted' ? 'bg-emerald-100 text-emerald-700' :
                          ['Rejected', 'Ghosted'].includes(app.status) ? 'bg-red-50 text-red-600' : 
                          'bg-blue-50 text-blue-600'
                        }`}>
                          {app.status}
                        </span>
                      </td>
                      <td className="p-4 text-xs text-slate-600">
                        {app.applied_date ? new Date(app.applied_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                      </td>
                      <td className="p-4 text-center">
                        {app.match_score ? (
                          <div className={`inline-flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-md font-mono text-xs font-bold ${app.match_score >= 80 ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : app.match_score >= 60 ? 'bg-amber-50 text-amber-700 border border-amber-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                            <Sparkles className="w-3 h-3" /> {app.match_score}%
                          </div>
                        ) : <span className="text-slate-300">-</span>}
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${app.priority === 'High' ? 'bg-red-50 text-red-600' : app.priority === 'Medium' ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-500'}`}>
                          {app.priority || '-'}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button onClick={() => handleEdit(app)} className="p-2 text-slate-400 hover:bg-blue-50 hover:text-blue-600 rounded-md transition-colors"><Edit2 className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* MODAL POP-UP FORM */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setIsModalOpen(false)}></div>
          
          <div className="relative w-full max-w-5xl bg-slate-50 rounded-xl shadow-2xl flex flex-col max-h-[95vh] animate-in zoom-in-95 duration-300 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200">
              <h2 className="text-lg font-bold text-slate-800">{editingId ? "Ubah Data Lamaran" : "Tambah Lamaran Baru"}</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 rounded-full transition-colors"><X className="w-5 h-5" /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-6">
                
                <form id="app-form" onSubmit={handleSave} className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2"><Briefcase className="w-4 h-4 text-blue-600" /> Informasi Dasar</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div><label className="block text-xs font-semibold text-slate-600 mb-1.5">Perusahaan <span className="text-red-500">*</span></label><input required type="text" value={company} onChange={(e) => setCompany(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md focus:ring-1 focus:ring-blue-500 text-sm" placeholder="Contoh: PT GoTo" /></div>
                      <div><label className="block text-xs font-semibold text-slate-600 mb-1.5">Posisi <span className="text-red-500">*</span></label><input required type="text" value={position} onChange={(e) => setPosition(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md focus:ring-1 focus:ring-blue-500 text-sm" placeholder="Contoh: Data Engineer" /></div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5">Tanggal Apply</label>
                        {/* Batasan MAX agar tidak bisa milih hari esok */}
                        <input type="date" max={todayString} value={appliedDate} onChange={(e) => setAppliedDate(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md focus:ring-1 focus:ring-blue-500 text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5">Status</label>
                        <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md focus:ring-1 focus:ring-blue-500 text-sm">
                          <option value="Applied">Applied</option>
                          <option value="Lolos Administrasi">Lolos Administrasi</option>
                          <option value="Online Test">Online Test</option>
                          <option value="Psikotest">Psikotest</option>
                          <option value="Interview HR">Interview HR</option>
                          <option value="Interview User">Interview User</option>
                          <option value="Offer">Offer</option>
                          <option value="Accepted">Accepted</option>
                          <option value="Rejected">Rejected</option>
                          <option value="Ghosted">Ghosted</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5">Prioritas</label>
                        <select value={priority} onChange={(e) => setPriority(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md focus:ring-1 focus:ring-blue-500 text-sm">
                          <option value="Low">Low</option>
                          <option value="Medium">Medium</option>
                          <option value="High">High</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2"><FileText className="w-4 h-4 text-indigo-600" /> Job Description (Opsional)</h3>
                    <textarea rows={4} value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md focus:ring-1 focus:ring-indigo-500 text-sm leading-relaxed" placeholder="Salin kualifikasi pekerjaan di sini agar AI bisa menganalisis peluangmu..."></textarea>
                  </div>

                  {/* FORM JADWAL MUNCUL JIKA STATUS ADA DI TAHAP SELEKSI */}
                  {isScheduleStage && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-top-2 bg-amber-50/30 p-4 rounded-lg border border-amber-100">
                      <div className="flex items-center justify-between border-b border-amber-200/50 pb-2">
                        <h3 className="text-sm font-semibold text-amber-900 flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-amber-600" /> Jadwal Seleksi ({status})
                        </h3>
                        {/* TOMBOL PENGINGAT GOOGLE CALENDAR */}
                        {(interviewDate && interviewTime) && (
                          <button type="button" onClick={handleAddToCalendar} className="text-xs font-bold text-amber-700 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors">
                            <CalendarPlus className="w-3.5 h-3.5" /> Ingatkan Saya
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div><label className="block text-xs font-semibold text-slate-600 mb-1.5">Tanggal</label><input type="date" value={interviewDate} onChange={(e) => setInterviewDate(e.target.value)} className="w-full px-3 py-2 bg-white border border-amber-200 rounded-md focus:ring-1 focus:ring-amber-500 text-sm" /></div>
                        <div><label className="block text-xs font-semibold text-slate-600 mb-1.5">Jam</label><input type="time" value={interviewTime} onChange={(e) => setInterviewTime(e.target.value)} className="w-full px-3 py-2 bg-white border border-amber-200 rounded-md focus:ring-1 focus:ring-amber-500 text-sm" /></div>
                      </div>
                    </div>
                  )}
                </form>

                <div className="bg-indigo-50/50 border border-indigo-100 rounded-lg p-6 flex flex-col h-fit">
                  <div className="flex items-center gap-2 mb-4 text-indigo-800">
                    <Sparkles className="w-4 h-4" />
                    <h3 className="font-bold text-sm">AI Job Matcher</h3>
                  </div>
                  {matchScore ? (
                    <div className="animate-in zoom-in-95 duration-300">
                      <div className="flex items-center justify-center mb-6">
                        <div className="w-24 h-24 rounded-full border-[6px] border-emerald-100 flex items-center justify-center bg-white relative shadow-inner">
                          <svg className="absolute w-full h-full -rotate-90 text-emerald-500" viewBox="0 0 36 36"><path strokeDasharray={`${matchScore}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" /></svg>
                          <span className="text-xl font-black text-slate-800">{matchScore}%</span>
                        </div>
                      </div>
                      <button onClick={handleAnalyze} disabled={isAnalyzing} className="w-full py-2 text-indigo-600 bg-white border border-indigo-200 text-xs font-semibold hover:bg-indigo-50 rounded-md transition-colors shadow-sm disabled:opacity-70">
                        {isAnalyzing ? "Menghitung..." : "Analisis Ulang"}
                      </button>
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center mx-auto mb-3 text-indigo-500"><FileText className="w-5 h-5" /></div>
                      <p className="text-xs text-slate-600 mb-4 px-2">Ketahui seberapa besar peluang CV-mu lolos kualifikasi ini.</p>
                      <button onClick={handleAnalyze} disabled={isAnalyzing || !jobDescription} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium py-2 px-4 rounded-md flex justify-center items-center gap-2 disabled:opacity-50 transition-colors shadow-sm">
                        {isAnalyzing ? <span className="animate-pulse">Menganalisis...</span> : <><Sparkles className="w-3.5 h-3.5" /> Hitung Peluang</>}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-white border-t border-slate-200 flex justify-between items-center rounded-b-xl">
              <div>
                {editingId && (
                  <button onClick={handleDelete} className="text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-2 rounded-md transition-colors flex items-center gap-2"><Trash2 className="w-4 h-4" /> Hapus Lamaran</button>
                )}
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-md transition-colors">Batal</button>
                <button type="submit" form="app-form" className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-5 rounded-md flex items-center gap-2 transition-colors shadow-sm"><Save className="w-4 h-4" /> Simpan</button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}