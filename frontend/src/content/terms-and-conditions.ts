export type TermsSection = {
  title: string;
  paragraphs: string[];
  bullets?: string[];
};

export type TermsContent = {
  pageTitle: string;
  brandSubtitle: string;
  introTitle: string;
  intro: string;
  sections: TermsSection[];
  declarations: string[];
  legalNotice: string;
  checkboxRequired: string;
};

export const termsAndConditions: Record<"id" | "en", TermsContent> = {
  id: {
    pageTitle: "Syarat dan Ketentuan Layanan",
    brandSubtitle: "Santara Pips — Trading Education & Community",
    introTitle: "Persetujuan Pengguna & Penolakan Tuntutan Hukum (Disclaimer)",
    intro:
      "Dokumen Syarat dan Ketentuan ini merupakan perjanjian hukum yang mengikat antara Anda (Calon Member/Pengguna) dengan Santara Pips. Dengan mencentang kotak persetujuan, mendaftarkan diri, atau mengakses materi yang disediakan oleh Santara Pips, Anda menyatakan telah membaca, memahami, dan menyetujui seluruh ketentuan di bawah ini secara sadar dan tanpa paksaan dari pihak manapun.",
    sections: [
      {
        title: "1. Sifat Layanan: Hanya Edukasi",
        paragraphs: [],
        bullets: [
          "Pusat Edukasi: Santara Pips murni beroperasi sebagai komunitas dan platform edukasi/pembelajaran mengenai analisis teknikal pasar keuangan.",
          "Bukan Pialang/Penasihat: Pihak Santara Pips TIDAK menyediakan layanan penasihat keuangan, pengelola dana, pialang, maupun penyedia sinyal trading yang menjanjikan keuntungan.",
          "Tujuan Materi: Seluruh materi, video, diskusi, dan perangkat AI yang dibagikan bertujuan semata-mata untuk meningkatkan pengetahuan literasi finansial dan kemampuan teknikal mandiri.",
        ],
      },
      {
        title: "2. Risiko Tinggi dalam Trading Keuangan (XAUUSD/CFD)",
        paragraphs: [],
        bullets: [
          "Risiko Finansial: Perdagangan instrumen keuangan derivatif, CFD, dan XAUUSD melalui broker pihak ketiga memiliki risiko kerugian finansial yang sangat tinggi.",
          "Dampak Leverage: Penggunaan leverage dapat bekerja untuk atau melawan Anda, yang berpotensi mengakibatkan hilangnya seluruh modal awal bahkan kerugian melebihi setoran awal.",
          "Tanpa Jaminan: Member menyatakan memahami sepenuhnya bahwa tidak ada jaminan keberhasilan, profit konsisten, atau kebal terhadap kerugian dalam aktivitas trading.",
        ],
      },
      {
        title: "3. Pelepasan Tanggung Jawab Hukum (Disclaimer of Liability)",
        paragraphs: [
          "Dengan menyetujui ketentuan ini, Anda sepakat untuk melepaskan Santara Pips, pendiri, mentor, pengelola, staf, maupun sesama anggota komunitas dari segala bentuk tuntutan hukum, gugatan perdata, laporan pidana, maupun klaim ganti rugi dalam bentuk apapun atas:",
        ],
        bullets: [
          "Kerugian Trading: Segala bentuk kerugian finansial, penurunan modal, atau kebangkrutan akibat keputusan transaksi yang dilakukan secara mandiri maupun berdasarkan analisis dari komunitas.",
          "Gangguan Sistem: Kesalahan teknis, gangguan sistem, keterlambatan data, atau ketidakakuratan informasi dari platform eksternal, broker, atau pihak ketiga.",
          "Kesalahan Interpretasi: Tindakan atau interpretasi yang salah dalam menerapkan strategi teknikal, manajemen risiko, atau penggunaan alat bantu AI.",
        ],
      },
      {
        title: "Peringatan Krusial",
        paragraphs: [
          "Setiap keputusan untuk membuka, mengelola, atau menutup posisi transaksi di pasar keuangan sepenuhnya berada di tangan dan tanggung jawab mutlak masing-masing member.",
        ],
      },
      {
        title: "4. Kewajiban dan Kode Etik Member",
        paragraphs: [],
        bullets: [
          "Kerahasiaan Materi: Member wajib menjaga kerahasiaan materi edukasi eksklusif dan dilarang menyebarluaskan, memperjualbelikan, atau menduplikasi tanpa izin tertulis.",
          "Etika Komunitas: Member wajib menjunjung etika diskusi, saling menghormati, dan dilarang promosi titip dana, broker ilegal, atau penipuan finansial.",
          "Sanksi Pelanggaran: Santara Pips berhak mencabut akses membership tanpa pengembalian dana apabila member terbukti melanggar aturan.",
        ],
      },
      {
        title: "5. Kebijakan Pengembalian Dana (Refund Policy)",
        paragraphs: [
          "Biaya keanggotaan atau kontribusi akses edukasi yang telah dibayarkan bersifat final dan tidak dapat dikembalikan (non-refundable) dengan alasan apapun, termasuk apabila member merasa tidak cocok atau mengalami kerugian dalam aktivitas trading pribadi.",
        ],
      },
      {
        title: "6. Perubahan Syarat dan Ketentuan",
        paragraphs: [
          "Santara Pips berhak sewaktu-waktu mengubah, menambah, atau memperbarui Syarat dan Ketentuan ini. Perubahan berlaku efektif setelah dipublikasikan melalui media resmi komunitas. Penggunaan berkelanjutan setelah perubahan dianggap sebagai persetujuan atas ketentuan yang diperbarui.",
        ],
      },
    ],
    declarations: [
      "Saya telah membaca, mengerti, dan menyetujui seluruh isi Syarat dan Ketentuan serta Disclaimer di atas.",
      "Saya berusia minimal 17 tahun dan memiliki kapasitas hukum yang sah.",
      "Saya menyadari sepenuhnya bahwa trading instrumen XAUUSD/CFD berisiko tinggi dan saya melepaskan Santara Pips dari segala tuntutan hukum di kemudian hari atas kerugian finansial yang saya alami.",
    ],
    legalNotice:
      "Dokumen ini dirancang untuk melindungi penyelenggara komunitas dari risiko hukum berdasarkan asas kebebasan berkontrak. Centang persetujuan wajib sebelum formulir pendaftaran dapat disubmit.",
    checkboxRequired: "Anda harus menyetujui semua pernyataan sebelum mendaftar.",
  },
  en: {
    pageTitle: "Terms & Conditions",
    brandSubtitle: "Santara Pips — Trading Education & Community",
    introTitle: "User Agreement & Legal Disclaimer",
    intro:
      "These Terms & Conditions are a binding legal agreement between you (Prospective Member/User) and Santara Pips. By checking the consent box, registering, or accessing materials provided by Santara Pips, you confirm that you have read, understood, and agreed to all terms below freely and without coercion.",
    sections: [
      {
        title: "1. Nature of Service: Education Only",
        paragraphs: [],
        bullets: [
          "Education Hub: Santara Pips operates purely as a community and education platform for technical analysis of financial markets.",
          "Not a Broker/Advisor: Santara Pips does NOT provide financial advisory, fund management, brokerage, or profit-promising signal services.",
          "Purpose of Materials: All materials, videos, discussions, and AI tools are solely to improve financial literacy and independent technical ability.",
        ],
      },
      {
        title: "2. High Risk in Financial Trading (XAUUSD/CFD)",
        paragraphs: [],
        bullets: [
          "Financial Risk: Trading derivatives, CFDs, and XAUUSD through third-party brokers carries very high loss risk.",
          "Leverage Impact: Leverage can work for or against you, potentially causing total loss of capital or losses exceeding initial deposit.",
          "No Guarantee: Members acknowledge there is no guarantee of success, consistent profit, or immunity from losses.",
        ],
      },
      {
        title: "3. Disclaimer of Liability",
        paragraphs: [
          "By agreeing, you release Santara Pips, founders, mentors, staff, and community members from any legal claims, civil suits, criminal reports, or compensation claims regarding:",
        ],
        bullets: [
          "Trading Losses: Any financial loss, capital decline, or bankruptcy from independent trading decisions or community-learned analysis.",
          "System Issues: Technical errors, downtime, delayed data, or inaccurate third-party/broker information.",
          "Misinterpretation: Incorrect application of technical strategy, risk management, or AI tools.",
        ],
      },
      {
        title: "Critical Warning",
        paragraphs: [
          "Every decision to open, manage, or close a market position is entirely your own responsibility as a member.",
        ],
      },
      {
        title: "4. Member Obligations & Code of Conduct",
        paragraphs: [],
        bullets: [
          "Material Confidentiality: Exclusive education content must not be shared, sold, or duplicated without written permission.",
          "Community Ethics: Respectful discussion is required; promotion of managed accounts, illegal brokers, or scams is prohibited.",
          "Violations: Santara Pips may revoke membership without refund if rules are breached.",
        ],
      },
      {
        title: "5. Refund Policy",
        paragraphs: [
          "Membership or education access fees paid are final and non-refundable for any reason, including personal trading losses or dissatisfaction.",
        ],
      },
      {
        title: "6. Changes to Terms",
        paragraphs: [
          "Santara Pips may update these Terms at any time. Changes take effect when published through official community channels. Continued use constitutes acceptance.",
        ],
      },
    ],
    declarations: [
      "I have read, understood, and agree to all Terms & Conditions and the Disclaimer above.",
      "I am at least 17 years old and have legal capacity to enter this agreement.",
      "I fully understand that XAUUSD/CFD trading is high risk and I release Santara Pips from future legal claims regarding financial losses I may incur.",
    ],
    legalNotice:
      "This document protects the community operator under freedom of contract principles. Consent checkboxes are mandatory before registration can be submitted.",
    checkboxRequired: "You must agree to all declarations before registering.",
  },
};
