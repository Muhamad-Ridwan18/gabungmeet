export type XauusdCompareRow = {
  trading: string;
  gambling: string;
};

export type XauusdStep = {
  num: string;
  title: string;
  body: string;
};

export type XauusdCurriculumItem = {
  title: string;
  body: string;
};

export type XauusdEducationContent = {
  kicker: string;
  title: string;
  subtitle: string;
  intro: {
    kicker: string;
    paragraphs: string[];
  };
  whatIs: {
    kicker: string;
    title: string;
    paragraphs: string[];
    buyLabel: string;
    buyText: string;
    sellLabel: string;
    sellText: string;
    noteLabel: string;
    noteText: string;
  };
  compare: {
    kicker: string;
    title: string;
    colTrading: string;
    colGambling: string;
    rows: XauusdCompareRow[];
  };
  binary: {
    kicker: string;
    title: string;
    paragraphs: string[];
    flow: string;
    closing: string;
  };
  mindset: {
    kicker: string;
    title: string;
    paragraphs: string[];
    paramsLabel: string;
    paramsText: string;
  };
  process: {
    kicker: string;
    title: string;
    steps: XauusdStep[];
  };
  curriculum: {
    kicker: string;
    title: string;
    items: XauusdCurriculumItem[];
  };
  closing: {
    title: string;
    body: string;
    disclaimerLabel: string;
    disclaimerBody: string;
  };
};

export const xauusdEducation: Record<"id" | "en", XauusdEducationContent> = {
  id: {
    kicker: "Edukasi Publik",
    title: "Memahami Trading XAUUSD",
    subtitle: "Memanfaatkan pergerakan emas global dengan pendekatan 100% teknikal terukur",
    intro: {
      kicker: "Pendahuluan",
      paragraphs: [
        "Pasar keuangan memberikan berbagai instrumen untuk mengelola dan memperdagangkan pergerakan harga aset. Salah satunya adalah XAUUSD, yaitu instrumen yang merepresentasikan harga emas terhadap dolar Amerika Serikat.",
        "Berbeda dengan sekadar menebak apakah harga akan naik atau turun, trading XAUUSD dengan pendekatan teknikal melibatkan proses analisis grafik, pembacaan struktur harga, pengambilan keputusan, eksekusi, serta pengelolaan risiko yang ketat.",
        "Tujuannya bukan mencari kepastian keuntungan, melainkan membangun proses pengambilan keputusan yang terukur di tengah ketidakpastian pasar berdasarkan data historis harga.",
      ],
    },
    whatIs: {
      kicker: "Konsep",
      title: "Apa itu XAUUSD dalam perspektif teknikal?",
      paragraphs: [
        "Secara sederhana, XAUUSD menunjukkan harga emas dalam denominasi dolar AS pada grafik real-time. Dalam pendekatan 100% teknikal, seluruh faktor eksternal (seperti berita ekonomi, suku bunga, maupun geopolitik) dianggap telah tercermin sepenuhnya di dalam pergerakan harga pada grafik (Price Discounts Everything).",
        "Trader mengambil posisi murni berdasarkan pola dan struktur pergerakan harga:",
      ],
      buyLabel: "BUY",
      buyText:
        "Ketika analisis struktur pasar, tren, atau pola pantulan (support) menunjukkan indikasi harga berpotensi naik.",
      sellLabel: "SELL",
      sellText:
        "Ketika analisis struktur pasar menunjukkan pelemahan, tren turun, atau penembusan batas bawah (resistance/support broken) yang mengindikasikan potensi penurunan.",
      noteLabel: "Catatan penting",
      noteText:
        "Tidak ada analisis teknikal yang mampu memprediksi pasar dengan kepastian 100%. Oleh karena itu, pengelolaan risiko melalui penempatan batasan kerugian (Stop Loss) merupakan bagian mutlak dari sistem trading.",
    },
    compare: {
      kicker: "Perbandingan",
      title: "Trading vs perjudian",
      colTrading: "Trading XAUUSD (Teknikal)",
      colGambling: "Perjudian Online",
      rows: [
        {
          trading: "Berbasis pergerakan grafik harga instrumen keuangan",
          gambling: "Berbasis hasil permainan atau taruhan acak",
        },
        {
          trading: "Menggunakan analisis teknikal dan data historis chart",
          gambling: "Mengandalkan hasil untung-untungan permainan",
        },
        {
          trading: "Posisi terencana dengan parameter entry, stop loss, dan target",
          gambling: "Hasil sepenuhnya ditentukan oleh sistem rumah taruhan",
        },
        {
          trading: "Risiko dapat dihitung presisi melalui manajemen lot dan modal",
          gambling: "Pemain cenderung terus meningkatkan taruhan mengejar hasil",
        },
        {
          trading: "Membutuhkan keahlian membaca grafik, disiplin, dan strategi",
          gambling: "Tidak membutuhkan kemampuan analisis pasar",
        },
      ],
    },
    binary: {
      kicker: "Klarifikasi",
      title: "Lalu, bagaimana dengan binary option?",
      paragraphs: [
        "Binary option juga menggunakan grafik harga sehingga secara visual dapat terlihat seperti aktivitas trading. Namun mekanismenya sangat berbeda.",
        "Pada model binary option, pengguna umumnya menentukan apakah harga akan berada di atas atau di bawah level tertentu pada batas waktu yang kaku. Sementara dalam trading XAUUSD murni, trader memiliki fleksibilitas penuh dalam mengelola posisi melalui kerangka kerja teknikal:",
      ],
      flow: "Entry → Stop Loss → Take Profit → Position Size → Risk per Trade",
      closing:
        "Dengan demikian, keputusan trading tidak hanya berkaitan dengan benar atau salahnya arah harga, tetapi juga seberapa terukur risiko yang diambil pada setiap level grafik yang valid.",
    },
    mindset: {
      kicker: "Mindset",
      title: "Trading bukan tentang selalu benar",
      paragraphs: [
        "Salah satu kesalahpahaman terbesar mengenai trading adalah anggapan bahwa trader sukses harus selalu menghasilkan transaksi yang menguntungkan tanpa pernah salah.",
        "Faktanya, kerugian (Loss) adalah bagian yang lumrah dari aktivitas trading. Trader teknikal yang disiplin tidak berusaha menghilangkan seluruh kemungkinan kerugian, melainkan memastikan bahwa ketika struktur harga melenceng dari rencana, dampaknya tetap terkontrol dalam batas risiko yang sudah dihitung sebelumnya.",
      ],
      paramsLabel: "Parameter kunci keberhasilan",
      paramsText:
        "Profit bukan satu-satunya ukuran. Trader yang baik memantau risk management, rasio risk-to-reward, tingkat akurasi strategi (win rate), disiplin psikologi, serta konsistensi penerapan sistem dalam jangka panjang.",
    },
    process: {
      kicker: "Proses",
      title: "Dari spekulasi menuju proses teknikal yang terukur",
      steps: [
        {
          num: "01",
          title: "Analisis teknikal",
          body: "Membaca struktur market, tren utama, level support & resistance, price action, serta pola grafik historis.",
        },
        {
          num: "02",
          title: "Skenario harga",
          body: "Menentukan skenario posisi berdasarkan area valid dan titik harga yang membatalkan skenario (invalidasi teknikal).",
        },
        {
          num: "03",
          title: "Risk management",
          body: "Menghitung ukuran posisi (lot size) dan menempatkan batas kerugian (stop loss) secara pasti sebelum membuka order.",
        },
        {
          num: "04",
          title: "Eksekusi disiplin",
          body: "Melakukan eksekusi order sesuai rencana tanpa intervensi emosional atau perubahan aturan mendadak.",
        },
        {
          num: "05",
          title: "Evaluasi jurnal",
          body: "Menganalisis kembali hasil eksekusi berdasarkan data historis jurnal trading untuk perbaikan performa berkelanjutan.",
        },
      ],
    },
    curriculum: {
      kicker: "Kurikulum",
      title: "Apa yang akan Anda pelajari dalam kurikulum teknikal?",
      items: [
        {
          title: "Technical Analysis",
          body: "Penguasaan chart patterns, candlestick price action, support & resistance, multi-timeframe analysis, serta indikator teknikal penunjang.",
        },
        {
          title: "Trading Psychology",
          body: "Membangun mentalitas disiplin, mengatasi emosi fear, greed, dan FOMO saat menghadapi fluktuasi grafik.",
        },
        {
          title: "Risk Management",
          body: "Perhitungan matematis ukuran posisi, pengaturan leverage sehat, rasio risk-to-reward, dan manajemen ekuitas modal.",
        },
        {
          title: "AI & Trading Technology",
          body: "Memanfaatkan teknologi otomatisasi dan AI untuk backtesting strategi teknikal dan pemindaian pola chart.",
        },
        {
          title: "Trading Community",
          body: "Ruang diskusi antar trader untuk bertukar perspektif objektif berdasarkan pembacaan grafik.",
        },
      ],
    },
    closing: {
      title: "Tidak ada janji profit. Yang ada adalah proses belajar.",
      body: "Pasar tidak dapat dikendalikan. Yang sepenuhnya berada di dalam kendali Anda adalah pengetahuan teknikal, strategi terukur, manajemen risiko, dan disiplin eksekusi.",
      disclaimerLabel: "Pernyataan risiko",
      disclaimerBody:
        "Trading XAUUSD menggunakan produk derivatif/CFD melalui broker memiliki tingkat risiko tinggi dan tidak sesuai untuk semua kalangan investor. Nilai modal dapat berfluktuasi naik maupun turun secara signifikan, dan kerugian dapat melebihi margin awal apabila penggunaan leverage tidak diatur dengan bijak. Seluruh materi edukasi ini murni disusun untuk tujuan pembelajaran analisis teknikal dan bukan merupakan jaminan keuntungan, rekomendasi investasi personal, maupun bentuk ajakan untuk melakukan transaksi instrumen finansial tertentu.",
    },
  },
  en: {
    kicker: "Public Education",
    title: "Understanding XAUUSD Trading",
    subtitle: "Using global gold price movement with a fully measured, technical approach",
    intro: {
      kicker: "Introduction",
      paragraphs: [
        "Financial markets offer many instruments to manage and trade price movement. One of them is XAUUSD — gold priced against the US dollar.",
        "Unlike simply guessing whether price will rise or fall, technical XAUUSD trading involves chart analysis, reading price structure, decision-making, execution, and strict risk management.",
        "The goal is not guaranteed profit, but building a measured decision process amid market uncertainty using historical price data.",
      ],
    },
    whatIs: {
      kicker: "Concept",
      title: "What is XAUUSD from a technical perspective?",
      paragraphs: [
        "In simple terms, XAUUSD shows gold priced in USD on a real-time chart. In a 100% technical approach, external factors (economic news, rates, geopolitics) are assumed to be fully reflected in price (Price Discounts Everything).",
        "Traders take positions purely from price patterns and structure:",
      ],
      buyLabel: "BUY",
      buyText:
        "When market structure, trend, or bounce patterns (support) suggest price may move higher.",
      sellLabel: "SELL",
      sellText:
        "When structure weakens, downtrend forms, or a break below key levels suggests further decline.",
      noteLabel: "Important note",
      noteText:
        "No technical analysis predicts the market with 100% certainty. Stop Loss placement is therefore a non‑negotiable part of any trading system.",
    },
    compare: {
      kicker: "Comparison",
      title: "Trading vs gambling",
      colTrading: "XAUUSD trading (technical)",
      colGambling: "Online gambling",
      rows: [
        {
          trading: "Based on financial instrument price charts",
          gambling: "Based on game outcomes or random bets",
        },
        {
          trading: "Uses technical analysis and historical chart data",
          gambling: "Relies on chance within the game system",
        },
        {
          trading: "Planned positions with entry, stop loss, and target",
          gambling: "Outcomes fully determined by the house system",
        },
        {
          trading: "Risk can be calculated via lot size and capital management",
          gambling: "Players often chase losses with larger bets",
        },
        {
          trading: "Requires chart skill, discipline, and strategy",
          gambling: "Does not require market analysis ability",
        },
      ],
    },
    binary: {
      kicker: "Clarification",
      title: "What about binary options?",
      paragraphs: [
        "Binary options also use price charts and can look like trading visually. The mechanics are very different.",
        "In binary options, users typically bet whether price will be above or below a level at a fixed expiry. In pure XAUUSD trading, traders manage positions with full technical flexibility:",
      ],
      flow: "Entry → Stop Loss → Take Profit → Position Size → Risk per Trade",
      closing:
        "Trading decisions are not only about direction being right or wrong, but how measured risk is at each valid chart level.",
    },
    mindset: {
      kicker: "Mindset",
      title: "Trading is not about always being right",
      paragraphs: [
        "A common misconception is that successful traders must win every trade.",
        "Losses are a normal part of trading. Disciplined technical traders do not try to eliminate all losses — they ensure that when price invalidates the plan, impact stays within pre-calculated risk limits.",
      ],
      paramsLabel: "Key success parameters",
      paramsText:
        "Profit is not the only metric. Strong traders track risk management, risk-to-reward ratio, win rate, psychology, and long-term system consistency.",
    },
    process: {
      kicker: "Process",
      title: "From speculation to a measured technical process",
      steps: [
        {
          num: "01",
          title: "Technical analysis",
          body: "Read market structure, main trend, support & resistance, price action, and historical chart patterns.",
        },
        {
          num: "02",
          title: "Price scenario",
          body: "Define position scenarios from valid zones and invalidation levels that cancel the setup.",
        },
        {
          num: "03",
          title: "Risk management",
          body: "Calculate position size (lot) and place stop loss before opening any order.",
        },
        {
          num: "04",
          title: "Disciplined execution",
          body: "Execute the plan without emotional overrides or sudden rule changes.",
        },
        {
          num: "05",
          title: "Journal review",
          body: "Review execution history in a trading journal for continuous improvement.",
        },
      ],
    },
    curriculum: {
      kicker: "Curriculum",
      title: "What you will learn in the technical curriculum",
      items: [
        {
          title: "Technical Analysis",
          body: "Chart patterns, candlestick price action, support & resistance, multi-timeframe analysis, and supporting indicators.",
        },
        {
          title: "Trading Psychology",
          body: "Build discipline and manage fear, greed, and FOMO during chart volatility.",
        },
        {
          title: "Risk Management",
          body: "Position sizing math, healthy leverage, risk-to-reward ratios, and equity management.",
        },
        {
          title: "AI & Trading Technology",
          body: "Use automation and AI for technical strategy backtesting and chart pattern scanning.",
        },
        {
          title: "Trading Community",
          body: "Discuss objective chart perspectives with other traders in a structured community.",
        },
      ],
    },
    closing: {
      title: "No profit promises. There is a learning process.",
      body: "Markets cannot be controlled. What you can control is technical knowledge, measured strategy, risk management, and execution discipline.",
      disclaimerLabel: "Risk disclosure",
      disclaimerBody:
        "XAUUSD trading via derivatives/CFD through a broker carries high risk and is not suitable for all investors. Capital can fluctuate significantly and losses may exceed initial margin if leverage is misused. All educational material here is for technical learning only — not a guarantee of profit, personal investment recommendation, or solicitation to trade any financial instrument.",
    },
  },
};
