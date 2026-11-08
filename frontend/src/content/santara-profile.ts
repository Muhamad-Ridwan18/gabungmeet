export type ProfileListItem = {
  title: string;
  body: string;
};

export type ProfileStep = {
  num: string;
  title: string;
  body: string;
};

export type SantaraProfileContent = {
  brandLine: string;
  tagline: string;
  badges: string[];
  whatIs: {
    kicker: string;
    title: string;
    paragraphs: string[];
  };
  notJustEntry: {
    kicker: string;
    title: string;
    paragraphs: string[];
    principle: string;
  };
  technical: {
    kicker: string;
    title: string;
    items: ProfileListItem[];
  };
  risk: {
    kicker: string;
    title: string;
    intro: string;
    items: ProfileListItem[];
    philosophy: string;
  };
  independence: {
    kicker: string;
    title: string;
    steps: ProfileStep[];
    goal: string;
  };
  experience: {
    kicker: string;
    title: string;
    paragraphs: string[];
  };
  community: {
    kicker: string;
    title: string;
    body: string;
    flow: string;
    closing: string;
  };
  ai: {
    kicker: string;
    title: string;
    paragraphs: string[];
  };
  philosophy: {
    kicker: string;
    title: string;
    body: string;
    credo: string;
    credoId?: string;
    closing: string;
  };
  motto: string;
  disclaimer: string;
};

export const santaraProfile: Record<"id" | "en", SantaraProfileContent> = {
  id: {
    brandLine: "Santara Pips",
    tagline: "Trading Education & Community",
    badges: ["Risk Management First", "100% Technical Trading"],
    whatIs: {
      kicker: "Profil",
      title: "Apa itu Santara Pips?",
      paragraphs: [
        "Membangun trader yang memahami pasar, mengelola risiko, dan mampu berdiri secara mandiri.",
        "Santara Pips adalah komunitas edukasi trading yang dibangun berdasarkan pengalaman praktis trader dengan pengalaman lebih dari 5 tahun di pasar keuangan. Kami memahami bahwa tantangan terbesar trader pemula bukanlah kurangnya informasi, tetapi terlalu banyak informasi yang tidak terstruktur.",
        "Karena itu, Santara Pips menyederhanakan pengalaman trading menjadi sistem pembelajaran yang terstruktur, praktis, dan berfokus pada hal-hal yang benar-benar dibutuhkan seorang trader untuk berkembang. Pendekatan Santara Pips berfokus 100% pada technical trading, dengan risk management sebagai fondasi utama dalam setiap proses pengambilan keputusan.",
      ],
    },
    notJustEntry: {
      kicker: "Prinsip",
      title: "Bukan sekadar mencari entry",
      paragraphs: [
        "Banyak trader menghabiskan waktu mencari \"Di mana entry terbaik?\". Namun kami percaya pertanyaan yang lebih penting adalah \"Berapa besar risiko yang saya ambil jika analisis saya salah?\".",
        "Karena tidak ada strategi yang selalu benar, tidak ada indikator yang selalu menghasilkan profit, dan tidak ada trader yang selalu memenangkan setiap transaksi, maka kemampuan mengelola risiko menjadi salah satu fondasi terpenting dalam perjalanan seorang trader.",
      ],
      principle: "Entry penting. Tetapi risk management lebih penting.",
    },
    technical: {
      kicker: "Metode",
      title: "Pendekatan technical trading",
      items: [
        {
          title: "Price Action",
          body: "Memahami perilaku harga dan bagaimana pergerakannya membentuk struktur tertentu.",
        },
        {
          title: "Market Structure",
          body: "Mengenali trend, momentum, perubahan struktur, serta area penting pada pergerakan harga.",
        },
        {
          title: "Support & Resistance",
          body: "Mengidentifikasi area yang berpotensi menjadi titik reaksi harga.",
        },
        {
          title: "Indicators",
          body: "Memahami penggunaan indikator sebagai alat bantu analisis, bukan sebagai alat untuk memprediksi pasar secara pasti.",
        },
        {
          title: "Entry & Exit",
          body: "Membangun aturan yang jelas mengenai kapan membuka dan menutup posisi.",
        },
        {
          title: "Trade Management",
          body: "Memahami bagaimana posisi dikelola setelah transaksi dibuka.",
        },
      ],
    },
    risk: {
      kicker: "Fondasi",
      title: "Risk management sebagai fondasi",
      intro:
        "Kami tidak mengajarkan bagaimana menghindari kerugian, melainkan bagaimana mengendalikan kerugian. Risk management menjadi bagian dari proses sebelum sebuah transaksi dilakukan:",
      items: [
        {
          title: "Position Size",
          body: "Menentukan ukuran posisi berdasarkan modal dan risiko yang telah ditetapkan.",
        },
        {
          title: "Stop Loss",
          body: "Menentukan batas kerugian ketika skenario trading tidak berjalan sesuai analisis.",
        },
        {
          title: "Risk per Trade",
          body: "Menentukan berapa bagian dari modal yang bersedia dipertaruhkan pada satu transaksi.",
        },
        {
          title: "Risk-to-Reward",
          body: "Membandingkan potensi keuntungan dengan risiko yang diambil.",
        },
        {
          title: "Maximum Drawdown",
          body: "Memahami batas penurunan modal yang dapat ditoleransi.",
        },
        {
          title: "Capital Protection",
          body: "Memastikan keberlangsungan modal menjadi prioritas sebelum mengejar pertumbuhan.",
        },
      ],
      philosophy: "Profit adalah hasil dari proses. Risk management adalah perlindungan agar proses tersebut dapat terus berjalan.",
    },
    independence: {
      kicker: "Perjalanan",
      title: "Membangun trader yang mandiri",
      steps: [
        { num: "01", title: "Learn", body: "Memahami dasar-dasar market dan technical analysis." },
        { num: "02", title: "Understand", body: "Memahami bagaimana sebuah strategi bekerja dan kapan strategi tersebut digunakan." },
        { num: "03", title: "Manage", body: "Mempelajari risk management dan pengelolaan posisi." },
        { num: "04", title: "Practice", body: "Menerapkan sistem melalui latihan dan evaluasi." },
        { num: "05", title: "Evaluate", body: "Menganalisis hasil trading secara objektif." },
        { num: "06", title: "Independent", body: "Mampu menyusun analisis, menentukan risiko, dan mengambil keputusan trading secara mandiri." },
      ],
      goal:
        "Tujuan akhirnya bukan membuat member selalu bertanya \"BUY atau SELL?\", tetapi membuat mereka mampu menjawab: \"Mengapa saya mengambil posisi ini, berapa risiko saya, dan apa yang saya lakukan jika analisis saya salah?\"",
    },
    experience: {
      kicker: "Pengalaman",
      title: "Belajar dari pengalaman",
      paragraphs: [
        "Lebih dari lima tahun pengalaman trading memberikan satu pemahaman penting: Pasar tidak dapat dikendalikan. Yang dapat dikendalikan adalah analisis, risiko, ukuran posisi, entry & exit, disiplin, respons terhadap kerugian, serta evaluasi.",
        "Karena itu Santara Pips tidak menjanjikan bahwa setiap transaksi akan menghasilkan keuntungan. Sebaliknya, kami membangun pemahaman bahwa kerugian adalah bagian dari probabilitas trading, sementara pengelolaan risiko menentukan seberapa besar dampaknya terhadap modal.",
      ],
    },
    community: {
      kicker: "Komunitas",
      title: "Komunitas yang mendorong kemandirian",
      body: "Santara Pips bukan sekadar tempat menerima informasi trading, melainkan membangun lingkungan untuk belajar, berdiskusi, berlatih, mengevaluasi, dan berkembang.",
      flow: "Belajar → Berdiskusi → Berlatih → Mengevaluasi → Berkembang",
      closing:
        "Member dapat bertukar perspektif, mendiskusikan kondisi market, dan mempelajari berbagai pengalaman trader lainnya. Namun setiap analisis tetap perlu dipahami dan diverifikasi oleh masing-masing trader. Kami tidak ingin menciptakan pengikut; kami ingin membantu membangun trader.",
    },
    ai: {
      kicker: "Teknologi",
      title: "AI sebagai alat bantu",
      paragraphs: [
        "Santara Pips juga memanfaatkan perkembangan AI dan teknologi untuk membantu proses pembelajaran dan analisis — mengolah informasi, mempercepat proses, membantu evaluasi, serta meningkatkan efisiensi.",
        "Namun AI bukan pengganti trader. Teknologi membantu proses, sementara trader tetap bertanggung jawab penuh atas keputusan yang diambil.",
      ],
    },
    philosophy: {
      kicker: "Filosofi",
      title: "Filosofi Santara Pips",
      body: "Trader yang baik bukanlah trader yang selalu benar. Trader yang baik adalah trader yang memiliki sistem, memahami probabilitas, mengendalikan risiko, menerima kerugian, mengevaluasi kesalahan, serta tetap disiplin ketika kondisi pasar tidak sesuai harapan.",
      credo: "Protect the Capital. Master the Process. Trade Independently.",
      credoId: "Lindungi modal. Kuasai proses. Trading secara mandiri.",
      closing:
        "Santara Pips hadir untuk membantu memperpendek kurva belajar trading dengan merangkum pengalaman praktis trader berpengalaman ke dalam pembelajaran yang lebih terstruktur, sederhana, dan aplikatif. Bukan untuk menjanjikan keuntungan atau profit instan, tetapi untuk membantu Anda membangun kemampuan trading yang dapat digunakan secara mandiri dalam menghadapi pasar.",
    },
    motto: "Learn. Manage. Execute. Evaluate.",
    disclaimer:
      "Seluruh materi dan aktivitas Santara Pips bersifat edukasi. Trading XAUUSD/CFD memiliki risiko kerugian yang tinggi dan tidak terdapat jaminan keuntungan. Setiap keputusan transaksi merupakan tanggung jawab masing-masing trader.",
  },
  en: {
    brandLine: "Santara Pips",
    tagline: "Trading Education & Community",
    badges: ["Risk Management First", "100% Technical Trading"],
    whatIs: {
      kicker: "Profile",
      title: "What is Santara Pips?",
      paragraphs: [
        "Building traders who understand the market, manage risk, and can stand independently.",
        "Santara Pips is a trading education community built on practical experience from traders with more than 5 years in financial markets. We understand that the biggest challenge for beginners is not lack of information, but too much unstructured information.",
        "That is why Santara Pips simplifies the trading journey into a structured, practical learning system focused on what traders truly need to grow. Our approach is 100% technical trading, with risk management as the foundation of every decision.",
      ],
    },
    notJustEntry: {
      kicker: "Principle",
      title: "Not just hunting for entries",
      paragraphs: [
        "Many traders spend time asking \"Where is the best entry?\". We believe the more important question is \"How much risk am I taking if my analysis is wrong?\".",
        "No strategy is always right, no indicator always profits, and no trader wins every trade — so risk management is one of the most important foundations in a trader's journey.",
      ],
      principle: "Entry matters. But risk management matters more.",
    },
    technical: {
      kicker: "Method",
      title: "Technical trading approach",
      items: [
        { title: "Price Action", body: "Understanding price behavior and how movement forms structure." },
        { title: "Market Structure", body: "Recognizing trend, momentum, structure shifts, and key price areas." },
        { title: "Support & Resistance", body: "Identifying zones where price may react." },
        { title: "Indicators", body: "Using indicators as analysis aids — not as certainty tools." },
        { title: "Entry & Exit", body: "Building clear rules for opening and closing positions." },
        { title: "Trade Management", body: "Managing open positions after entry." },
      ],
    },
    risk: {
      kicker: "Foundation",
      title: "Risk management as foundation",
      intro:
        "We do not teach how to avoid losses entirely — we teach how to control them. Risk management is part of the process before any trade:",
      items: [
        { title: "Position Size", body: "Sizing positions based on capital and predefined risk." },
        { title: "Stop Loss", body: "Setting loss limits when the scenario fails." },
        { title: "Risk per Trade", body: "Defining how much capital is risked per trade." },
        { title: "Risk-to-Reward", body: "Comparing potential reward against risk taken." },
        { title: "Maximum Drawdown", body: "Understanding tolerable equity decline limits." },
        { title: "Capital Protection", body: "Prioritizing capital survival before chasing growth." },
      ],
      philosophy: "Profit is the result of process. Risk management protects the process so it can continue.",
    },
    independence: {
      kicker: "Journey",
      title: "Building independent traders",
      steps: [
        { num: "01", title: "Learn", body: "Understand market basics and technical analysis." },
        { num: "02", title: "Understand", body: "Understand how a strategy works and when to use it." },
        { num: "03", title: "Manage", body: "Learn risk management and position handling." },
        { num: "04", title: "Practice", body: "Apply the system through practice and review." },
        { num: "05", title: "Evaluate", body: "Analyze trading results objectively." },
        { num: "06", title: "Independent", body: "Analyze, size risk, and decide trades independently." },
      ],
      goal:
        "The end goal is not members always asking \"BUY or SELL?\" — but answering: \"Why am I taking this trade, what is my risk, and what will I do if I'm wrong?\"",
    },
    experience: {
      kicker: "Experience",
      title: "Learning from experience",
      paragraphs: [
        "More than five years of trading experience teaches one thing: markets cannot be controlled. What you can control is analysis, risk, position size, entry & exit, discipline, response to losses, and evaluation.",
        "Santara Pips does not promise every trade will profit. Instead, we build understanding that losses are part of trading probability — while risk management determines their impact on capital.",
      ],
    },
    community: {
      kicker: "Community",
      title: "A community that encourages independence",
      body: "Santara Pips is not just a place to receive trading information — it is an environment to learn, discuss, practice, evaluate, and grow.",
      flow: "Learn → Discuss → Practice → Evaluate → Grow",
      closing:
        "Members exchange perspectives, discuss market conditions, and learn from others — but every analysis must still be understood and verified individually. We do not want followers; we want to build traders.",
    },
    ai: {
      kicker: "Technology",
      title: "AI as a support tool",
      paragraphs: [
        "Santara Pips also uses AI and technology to support learning and analysis — processing information, speeding workflows, aiding evaluation, and improving efficiency.",
        "But AI does not replace the trader. Technology supports the process; the trader remains fully responsible for every decision.",
      ],
    },
    philosophy: {
      kicker: "Philosophy",
      title: "Santara Pips philosophy",
      body: "A good trader is not one who is always right. A good trader has a system, understands probability, controls risk, accepts losses, reviews mistakes, and stays disciplined when markets disagree.",
      credo: "Protect the Capital. Master the Process. Trade Independently.",
      closing:
        "Santara Pips exists to shorten the learning curve by packaging experienced traders' practical knowledge into structured, simple, applicable education — not instant profit promises, but independent trading ability for real markets.",
    },
    motto: "Learn. Manage. Execute. Evaluate.",
    disclaimer:
      "All Santara Pips materials and activities are educational. XAUUSD/CFD trading carries high loss risk with no profit guarantee. Every trading decision is the individual trader's responsibility.",
  },
};
