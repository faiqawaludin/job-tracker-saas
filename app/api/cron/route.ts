import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

// INISIALISASI (Anda akan butuh 2 kunci rahasia ini di file .env nanti)
const resend = new Resend(process.env.RESEND_API_KEY!);

// KITA HARUS PAKAI "SERVICE_ROLE_KEY" KARENA ROBOT HARUS BISA MEMBACA DATA SEMUA USER (Bypass RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! 
);

export async function GET() {
  try {
    console.log("🤖 [CRON] Robot Pengecek Jadwal Mulai Bekerja...");

    // 1. Cari lamaran yang punya jadwal TAPI salah satu email notifikasinya belum dikirim
    const { data: applications, error } = await supabaseAdmin
      .from("applications")
      .select("*")
      .not("interview_date", "is", null)
      .not("interview_time", "is", null)
      .or("email_h24_sent.eq.false,email_h1_sent.eq.false");

    if (error || !applications) {
      return NextResponse.json({ message: "Gagal mengambil data", error });
    }

    const now = new Date();
    let emailsSent = 0;

    // 2. Cek satu per satu
    for (const app of applications) {
      // Format tanggal jadwal menjadi objek Date
      const scheduleDate = new Date(`${app.interview_date}T${app.interview_time}`);
      
      // Hitung sisa waktu (dalam milidetik)
      const timeDiffMs = scheduleDate.getTime() - now.getTime();
      const timeDiffHours = timeDiffMs / (1000 * 60 * 60);

      // --- LOGIKA H-1 HARI (24 Jam) ---
      if (timeDiffHours <= 24 && timeDiffHours > 1 && !app.email_h24_sent) {
        await sendEmailReminder(app, "H-1 Jadwal Seleksi Besok!", supabaseAdmin);
        // Update database agar tidak dikirim ulang
        await supabaseAdmin.from("applications").update({ email_h24_sent: true }).eq("id", app.id);
        emailsSent++;
      }

      // --- LOGIKA H-1 JAM ---
      if (timeDiffHours <= 1 && timeDiffHours > 0 && !app.email_h1_sent) {
        await sendEmailReminder(app, "URGENT: 1 Jam Lagi Mulai!", supabaseAdmin);
        // Update database agar tidak dikirim ulang
        await supabaseAdmin.from("applications").update({ email_h1_sent: true }).eq("id", app.id);
        emailsSent++;
      }
    }

    return NextResponse.json({ message: "Selesai", emails_sent: emailsSent });

  } catch (err) {
    return NextResponse.json({ message: "Terjadi kesalahan sistem", error: err }, { status: 500 });
  }
}

// ============================================================================
// FUNGSI PEMBANTU: Merakit & Mengirim Email
// ============================================================================
async function sendEmailReminder(app: any, subjectPrefix: string, supabaseAdmin: any) {
  // 1. Ambil Email asli milik User tersebut dari Supabase Auth
  const { data: { user } } = await supabaseAdmin.auth.admin.getUserById(app.user_id);
  if (!user || !user.email) return;

  // 2. Ambil Namanya dari tabel profil (Opsional biar lebih personal)
  const { data: profile } = await supabaseAdmin.from("profiles").select("name").eq("user_id", app.user_id).single();
  const userName = profile?.name || "Kawan";

  // 3. Rakit Isi Email (HTML Support)
  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
      <h2 style="color: #2563eb;">Pengingat JobTracker 🚀</h2>
      <p>Halo <b>${userName}</b>,</p>
      <p>Ini adalah pengingat otomatis bahwa kamu memiliki jadwal tahapan seleksi yang sudah semakin dekat!</p>
      
      <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 5px 0;">🏢 <b>Perusahaan:</b> ${app.company}</p>
        <p style="margin: 5px 0;">💼 <b>Posisi:</b> ${app.position}</p>
        <p style="margin: 5px 0;">📌 <b>Tahapan:</b> <span style="color: #d97706; font-weight: bold;">${app.status}</span></p>
        <p style="margin: 5px 0;">📅 <b>Tanggal:</b> ${app.interview_date}</p>
        <p style="margin: 5px 0;">⏰ <b>Waktu:</b> ${app.interview_time}</p>
      </div>

      <p>Jangan lupa persiapkan dirimu sebaik mungkin. Baca ulang CV dan Portofoliomu. <i>You got this!</i></p>
      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
      <p style="font-size: 12px; color: #64748b;">Pesan ini dikirim otomatis oleh JobTracker SaaS System.</p>
    </div>
  `;

  // 4. Kirim Email pakai Resend
  await resend.emails.send({
    from: "JobTracker <onboarding@resend.dev>", // Saat masih gratis, wajib pakai email bawaan resend ini
    to: user.email,
    subject: `[JobTracker] ${subjectPrefix} - ${app.company}`,
    html: emailHtml,
  });

  console.log(`Berhasil mengirim email ke: ${user.email}`);
}