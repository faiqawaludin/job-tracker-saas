"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { UploadCloud, User, FileText, Sparkles, Save, Briefcase, Code, Plus, Trash2, Settings, LogOut, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { supabase } from "../../lib/supabase";

export default function ProfilPage() {
  const pathname = usePathname();
  const router = useRouter();
  
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  
  // State Notifikasi (Toast)
  const [toast, setToast] = useState<{ show: boolean; message: string; type: "success" | "error" } | null>(null);

  // State Form Manual
  const [name, setName] = useState("");
  const [headline, setHeadline] = useState("");
  const [location, setLocation] = useState("");
  const [skills, setSkills] = useState("");
  const [experiences, setExperiences] = useState<any[]>([
    { id: 1, company: "", role: "", period: "" }
  ]);

  // State AI Simulation
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzed, setIsAnalyzed] = useState(false);

  // Fungsi Pemanggil Notifikasi
  const showToast = (message: string, type: "success" | "error") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // 1. FUNGSI LOAD DATA SAAT HALAMAN DIBUKA
  useEffect(() => {
    const loadProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push("/login");
        return;
      }

      // Ambil data profil dari Supabase
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", session.user.id)
        .single(); // Ambil 1 baris saja

      if (data) {
        // Jika data sudah ada, isi formnya
        setName(data.name || "");
        setHeadline(data.headline || "");
        setLocation(data.location || "");
        setSkills(data.skills || "");
        if (data.experiences && data.experiences.length > 0) {
          setExperiences(data.experiences);
        }
      }
      setIsCheckingAuth(false);
    };

    loadProfile();
  }, [router]);

  // 2. FUNGSI SIMPAN PROFIL
  const handleSaveProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const payload = {
      user_id: user.id,
      name,
      headline,
      location,
      skills,
      experiences,
    };

    // Cek apakah user sudah punya data profil sebelumnya
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", user.id)
      .single();

    let serverError = null;

    if (existingProfile) {
      // Jika sudah ada -> UPDATE
      const { error } = await supabase.from("profiles").update(payload).eq("user_id", user.id);
      serverError = error;
    } else {
      // Jika belum ada (User Baru) -> INSERT
      const { error } = await supabase.from("profiles").insert([payload]);
      serverError = error;
    }

    if (serverError) {
      showToast(`Gagal menyimpan: ${serverError.message}`, "error");
    } else {
      showToast("Data profil berhasil disimpan!", "success");
      
      // Jika ini user baru yang baru mengisi profil, arahkan ke Dashboard setelah 1.5 detik
      if (!existingProfile) {
        setTimeout(() => {
          router.push("/");
        }, 1500);
      }
    }
  };

  // Fungsi Logout
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  // Fungsi Simulasi Tarik Data dari CV (Auto-fill)
  const handleUploadCV = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setIsUploading(true);
      setTimeout(() => {
        setIsUploading(false);
        setIsAnalyzed(true);
        // Autofill Data
        setSkills("Python, SQL, Apache Airflow, Docker, GCP, AppSheet, Scrum");
        setExperiences([
          { id: 1, company: "PT United Tractors Pandu Engineering", role: "Business Information System Intern", period: "Mei 2026 - Sekarang" },
          { id: 2, company: "Badan Pusat Statistik (BPS) Bekasi", role: "Data Processing Intern", period: "Feb 2026" },
          { id: 3, company: "Desa Srijaya (Project KKN)", role: "Developer SI-DUKCAPIL", period: "Agu 2025 - Feb 2026" }
        ]);
        showToast("Data berhasil diekstrak dari CV! Jangan lupa klik Simpan.", "success");
      }, 2500);
    }
  };

  // Handler untuk baris pengalaman
  const addExperience = () => setExperiences([...experiences, { id: Date.now(), company: "", role: "", period: "" }]);
  const removeExperience = (id: number) => setExperiences(experiences.filter(exp => exp.id !== id));

  // Tampilan Loading
  if (isCheckingAuth) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><Loader2 className="w-8 h-8 text-blue-600 animate-spin" /></div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-700 font-sans overflow-x-hidden relative">
      
      {/* TOAST NOTIFICATION */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-[100] px-5 py-3.5 rounded-lg shadow-xl flex items-center gap-3 animate-in slide-in-from-bottom-5 fade-in duration-300 ${toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white'}`}>
          {toast.type === 'error' ? <AlertCircle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
          <p className="text-sm font-medium">{toast.message}</p>
        </div>
      )}

      {/* Topbar Gaya Enterprise */}
      <header className="bg-white border-b border-slate-200 px-8 py-3 flex items-center justify-between sticky top-0 z-20">
        <div className="w-1/4 flex justify-start items-center gap-2 font-bold text-xl text-blue-600 tracking-tight">JobTracker</div>
        <nav className="w-2/4 flex justify-center gap-2">
          <Link href="/" className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${pathname === "/" ? "bg-blue-500 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"}`}>Dashboard</Link>
          <Link href="/list" className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${pathname === "/list" ? "bg-blue-500 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"}`}>Daftar Lamaran</Link>
        </nav>
        <div className="w-1/4 flex justify-end items-center relative">
          <button onClick={() => setIsProfileOpen(!isProfileOpen)} className="flex items-center gap-3 hover:bg-slate-50 p-1.5 rounded-lg transition-colors cursor-pointer text-left">
            <div className="text-right hidden md:block">
              {/* Nama yang ditampilkan akan menyesuaikan data dari database */}
              <div className="text-xs font-bold text-slate-700 uppercase tracking-wide">{name || "Pengguna Baru"}</div>
              <div className="text-[11px] text-slate-500">{headline ? headline.substring(0, 30) + '...' : "Silakan lengkapi profil"}</div>
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

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-8 py-8 pb-20 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-slate-800">Profil Karier</h1>
          <p className="text-slate-500 mt-1 text-sm">Lengkapi profil Anda secara manual, atau biarkan AI kami mengekstrak data dari CV Anda.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8">
          
          {/* KOLOM KIRI: FORM MANUAL */}
          <div className="space-y-6">
            
            {/* Bagian 1: Data Diri Dasar */}
            <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
              <h2 className="text-sm font-semibold text-slate-800 mb-5 flex items-center gap-2 border-b border-slate-100 pb-3"><User className="w-4 h-4 text-blue-500"/> Informasi Dasar</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Nama Lengkap</label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-md focus:ring-1 focus:ring-blue-500 outline-none" placeholder="Cth: Budi Santoso" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Headline Profesi (Fokus Karir)</label>
                  <input type="text" value={headline} onChange={(e) => setHeadline(e.target.value)} className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-md focus:ring-1 focus:ring-blue-500 outline-none" placeholder="Cth: Frontend Developer" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Lokasi / Domisili</label>
                  <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-md focus:ring-1 focus:ring-blue-500 outline-none" placeholder="Cth: Jakarta, Indonesia" />
                </div>
              </div>
            </div>

            {/* Bagian 2: Pengalaman Kerja */}
            <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-5">
                <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2"><Briefcase className="w-4 h-4 text-emerald-500"/> Pengalaman Kerja</h2>
                <button onClick={addExperience} className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"><Plus className="w-3 h-3"/> Tambah Manual</button>
              </div>
              <div className="space-y-6">
                {experiences.map((exp, index) => (
                  <div key={exp.id} className="relative group">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5">Perusahaan</label>
                        <input type="text" value={exp.company} onChange={(e) => { const newExp = [...experiences]; newExp[index].company = e.target.value; setExperiences(newExp); }} placeholder="Cth: PT GoTo" className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-md focus:ring-1 focus:ring-blue-500 outline-none" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5">Posisi / Peran</label>
                        <input type="text" value={exp.role} onChange={(e) => { const newExp = [...experiences]; newExp[index].role = e.target.value; setExperiences(newExp); }} placeholder="Cth: Data Engineer" className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-md focus:ring-1 focus:ring-blue-500 outline-none" />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5">Periode Waktu</label>
                        <input type="text" value={exp.period} onChange={(e) => { const newExp = [...experiences]; newExp[index].period = e.target.value; setExperiences(newExp); }} placeholder="Cth: Jan 2024 - Sekarang" className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-md focus:ring-1 focus:ring-blue-500 outline-none" />
                      </div>
                    </div>
                    {experiences.length > 1 && (
                      <button onClick={() => removeExperience(exp.id)} className="absolute -right-2 top-8 p-1.5 bg-white border border-slate-200 text-red-500 hover:bg-red-50 rounded-md shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-3.5 h-3.5" /></button>
                    )}
                    {index < experiences.length - 1 && <hr className="mt-6 border-slate-100 border-dashed" />}
                  </div>
                ))}
              </div>
            </div>

            {/* Bagian 3: Keahlian (Skills) */}
            <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
              <h2 className="text-sm font-semibold text-slate-800 mb-5 flex items-center gap-2 border-b border-slate-100 pb-3"><Code className="w-4 h-4 text-amber-500"/> Keahlian & Tools</h2>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Daftar Keahlian (Pisahkan dengan koma)</label>
                <textarea rows={3} value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="Cth: Python, SQL, Tableau, Agile Scrum..." className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-md focus:ring-1 focus:ring-blue-500 outline-none leading-relaxed"></textarea>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button onClick={handleSaveProfile} className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2.5 px-6 rounded-md flex items-center gap-2 shadow-sm transition-colors">
                <Save className="w-4 h-4"/> Simpan Data Master
              </button>
            </div>
          </div>

          {/* KOLOM KANAN: WIDGET AI CV PARSER */}
          <div className="space-y-6">
            <div className="bg-indigo-50/50 border border-indigo-100 rounded-lg p-6 shadow-sm sticky top-24">
              <h2 className="text-sm font-semibold text-indigo-900 mb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600"/> Tarik Data dari CV (AI)
              </h2>
              <p className="text-xs text-slate-500 mb-5 leading-relaxed">
                Males ketik satu-satu? Unggah CV kamu, biarkan AI yang mengisi semua form di sebelah kiri secara otomatis!
              </p>

              <div className="border-2 border-dashed border-indigo-200 bg-white rounded-lg p-6 text-center relative hover:bg-indigo-50/50 transition-colors cursor-pointer group">
                <input type="file" accept=".pdf" onChange={handleUploadCV} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                <div className="flex flex-col items-center pointer-events-none">
                  {isUploading ? (
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-3"></div>
                  ) : (
                    <UploadCloud className="w-8 h-8 text-indigo-400 group-hover:text-indigo-600 transition-colors mb-3" />
                  )}
                  <p className="text-sm font-medium text-slate-700">
                    {isUploading ? "AI Sedang Membaca CV..." : "Pilih atau Seret File PDF"}
                  </p>
                </div>
              </div>

              {isAnalyzed && (
                <div className="mt-5 bg-white rounded-md p-3 text-xs border border-emerald-100 shadow-sm animate-in zoom-in-95 duration-500">
                  <div className="font-bold text-emerald-700 mb-1 flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5"/> Berhasil Diekstrak!</div>
                  <p className="text-slate-600">Sistem berhasil menemukan 3 pengalaman kerja dan 7 keahlian dari CV Anda. Form di sebelah kiri telah diperbarui.</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}