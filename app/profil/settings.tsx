"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UploadCloud, User, FileText, Sparkles, Save, CheckCircle2 } from "lucide-react";
import { useState } from "react";

export default function SettingsPage() {
  const pathname = usePathname();
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzed, setIsAnalyzed] = useState(false);

  // Simulasi proses upload CV dan analisis AI (Loading 2 detik)
  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setIsUploading(true);
      setTimeout(() => {
        setIsUploading(false);
        setIsAnalyzed(true);
      }, 2000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Topbar Navigasi */}
      <header className="bg-slate-900 text-white px-8 py-4 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3 font-bold text-lg tracking-tight">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500 ring-4 ring-amber-500/20"></div>
          Job Tracker
        </div>
        <nav className="flex gap-2">
          <Link href="/" className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${pathname === "/" ? "bg-white/10 text-white" : "text-white/70 hover:bg-white/5 hover:text-white"}`}>
            Dashboard
          </Link>
          <Link href="/list" className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${pathname === "/list" ? "bg-white/10 text-white" : "text-white/70 hover:bg-white/5 hover:text-white"}`}>
            Daftar Lamaran
          </Link>
          <Link href="/settings" className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${pathname === "/settings" ? "bg-white/10 text-white" : "text-white/70 hover:bg-white/5 hover:text-white"}`}>
            Pengaturan
          </Link>
        </nav>
      </header>

      <main className="max-w-5xl mx-auto px-8 py-8 pb-20">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight">Pengaturan & Profil</h1>
          <p className="text-slate-500 mt-2 text-sm">Kelola profil dan unggah CV kamu agar AI bisa menganalisis peluang kerja.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_1.2fr] gap-8">
          
          {/* ========================================= */}
          {/* KOLOM KIRI: Profil Dasar Pengguna         */}
          {/* ========================================= */}
          <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm h-fit">
            <h2 className="text-base font-bold mb-6 flex items-center gap-2">
              <User className="w-5 h-5 text-teal-600"/> Informasi Pribadi
            </h2>
            
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Nama Lengkap</label>
                <input 
                  type="text" 
                  defaultValue="Muhamad Fa'iq Awaludin Syiam" 
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/50" 
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Headline Profesi</label>
                <input 
                  type="text" 
                  defaultValue="Versatile Jack of All Trades (Code & Business Architecture)" 
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/50" 
                />
              </div>
              <button className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2.5 px-4 rounded-lg flex justify-center items-center gap-2 transition-colors">
                <Save className="w-4 h-4"/> Simpan Profil
              </button>
            </div>
          </div>

          {/* ========================================= */}
          {/* KOLOM KANAN: Upload CV & Analisis AI      */}
          {/* ========================================= */}
          <div className="space-y-6">
            
            {/* Box Upload */}
            <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
              <h2 className="text-base font-bold mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-500"/> Upload CV (PDF)
              </h2>
              <div className="border-2 border-dashed border-slate-300 bg-slate-50 rounded-xl p-8 text-center relative hover:bg-slate-100 transition-colors">
                <input 
                  type="file" 
                  accept=".pdf" 
                  onChange={handleUpload} 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                />
                <div className="flex flex-col items-center pointer-events-none">
                  {isUploading ? (
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600 mb-3"></div>
                  ) : (
                    <UploadCloud className="w-10 h-10 text-slate-400 mb-3" />
                  )}
                  <p className="text-sm font-semibold text-slate-700">
                    {isUploading ? "Memproses Dokumen..." : "Klik atau seret file CV PDF ke sini"}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">Maksimal 5MB. AI akan mengekstrak data otomatis.</p>
                </div>
              </div>
            </div>

            {/* Hasil Ekstraksi AI (Hanya Muncul Setelah Selesai Upload) */}
            {isAnalyzed && (
              <div className="bg-gradient-to-br from-teal-50 to-emerald-50 border border-teal-200 rounded-2xl p-8 shadow-sm animate-in fade-in slide-in-from-bottom-4">
                <h2 className="text-base font-bold text-teal-900 mb-4 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-teal-600"/> Hasil Analisis CV oleh AI
                </h2>
                <div className="space-y-4">
                  <div>
                    <div className="text-xs font-bold text-teal-700 uppercase tracking-wider mb-2">Keahlian (Skills) Terdeteksi</div>
                    <div className="flex flex-wrap gap-2">
                      {["Python", "SQL", "Apache Airflow", "Data Engineering", "GCP", "Scrum", "AppSheet"].map(skill => (
                        <span key={skill} className="px-3 py-1 bg-white border border-teal-200 text-teal-800 rounded-full text-xs font-semibold">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="bg-white/60 rounded-lg p-4 text-sm text-teal-900 border border-teal-100">
                    <div className="font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4 text-teal-600"/> Ringkasan AI:
                    </div>
                    <p className="mt-1">Kandidat memiliki kemampuan serba bisa yang kuat dalam menjembatani kode teknis (seperti pipeline Airflow) dengan arsitektur bisnis, sangat cocok untuk peran Data Engineer atau System Analyst.</p>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </main>
    </div>
  );
}