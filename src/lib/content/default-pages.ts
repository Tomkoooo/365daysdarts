import { ContentBlockType, getDefaultPayload } from "@/lib/content/types";

type SeedBlock = {
  blockId: string;
  type: ContentBlockType;
  order: number;
  payload: Record<string, unknown>;
};

type SeedPage = {
  slug: string;
  title: string;
  blocks: SeedBlock[];
};

function block(
  blockId: string,
  type: ContentBlockType,
  order: number,
  payload: Record<string, unknown>
): SeedBlock {
  return { blockId, type, order, payload };
}

export const MARKETING_PAGE_SEEDS: SeedPage[] = [
  /* ------------------------------------------------------------------ */
  /*  HOMEPAGE                                                          */
  /* ------------------------------------------------------------------ */
  {
    slug: "home",
    title: "Főoldal",
    blocks: [
      block("home-hero-1", "hero", 0, {
        ...getDefaultPayload("hero"),
        title: "A Darts Sport Jövője Itt Kezdődik",
        description:
          "A Magyar Darts Akadémia Alapítvány célja, hogy mindenki számára elérhetővé tegye a profi darts oktatást. Csatlakozz közösségünkhöz, fejlődj instruktorainkkal, vagy válj te is oktatóvá!",
        links: [
          { label: "Kezdés Ingyenesen", href: "/dartsosoknak/kezdoknek" },
          { label: "Instruktor Képzés", href: "/instruktoroknak" },
          { label: "Ismerj meg minket", href: "/alapitvanyrol/magunkrol" },
        ],
      }),
      block("home-features-1", "featureCards", 1, {
        ...getDefaultPayload("featureCards"),
        title: "Miért válassz minket?",
        description:
          "Szakmai alapokon nyugvó képzési rendszer, amely a kezdőktől a versenyzői szintig kísér végig.",
        cards: [
          {
            title: "Strukturált Tananyag",
            description:
              "Lépésről lépésre felépített videós és szöveges leckék, amelyekkel biztos alapokat szerezhetsz.",
            buttonLabel: "",
            buttonHref: "",
          },
          {
            title: "Instruktor Képzés",
            description:
              "Szeretnéd átadni a tudást? Hivatalos instruktor képzésünkkel elismert oktatóvá válhatsz.",
            buttonLabel: "",
            buttonHref: "",
          },
          {
            title: "Közösség & Versenyek",
            description:
              "Légy része egy támogató közösségnek, és mérettesd meg magad a Diamonds Cup versenysorozaton.",
            buttonLabel: "",
            buttonHref: "",
          },
        ],
      }),
      block("home-segments-1", "featureCards", 2, {
        ...getDefaultPayload("featureCards"),
        title: "",
        description: "",
        cards: [
          {
            title: "Játékosoknak – Fejlődj a saját tempódban",
            description:
              "Kezdő dobástechnika alapok, haladó kiszálló stratégiák, mentális felkészülés. Akár most kezded, akár már versenyzel, nálunk megtalálod a szintednek megfelelő képzést.",
            buttonLabel: "Részletek játékosoknak",
            buttonHref: "/dartsosoknak",
          },
          {
            title: "Instruktoroknak – Építs karriert oktatóként",
            description:
              "Hivatalos minősítés, hozzáférés a tananyaghoz, szakmai támogatás. Válj elismert darts oktatóvá képzési programunkkal.",
            buttonLabel: "Instruktor program",
            buttonHref: "/instruktoroknak",
          },
        ],
      }),
      block("home-cta-1", "cta", 3, {
        ...getDefaultPayload("cta"),
        title: "Diamonds Cup",
        description:
          "Hamarosan indul Magyarország legújabb darts versenysorozata! Ne maradj le a részletekről.",
        buttonLabel: "Részletek hamarosan",
        buttonHref: "/diamonds-cup",
      }),
    ],
  },

  /* ------------------------------------------------------------------ */
  /*  DARTSOSOKNAK                                                      */
  /* ------------------------------------------------------------------ */
  {
    slug: "dartsosoknak",
    title: "Dartsosoknak",
    blocks: [
      block("players-hero", "hero", 0, {
        ...getDefaultPayload("hero"),
        title: "Dartsosoknak",
        description:
          "Akár most fogtál először nyilat, akár már versenyekre jársz, nálunk megtalálod a szintednek megfelelő képzést.",
        links: [
          {
            label: "Facebook oldal",
            href: "https://www.facebook.com/magyardartsakademia",
          },
        ],
      }),
      block("players-cards", "featureCards", 1, {
        ...getDefaultPayload("featureCards"),
        title: "Válassz képzési szintet",
        description: "",
        cards: [
          {
            title: "Kezdőknek",
            description:
              "Alapozd meg a tudásod! Ismerd meg a felszerelést, a helyes beállást és a dobómozdulat alapjait. Videós leckék és gyakorlatok várnak.",
            buttonLabel: "Kezdő anyagok",
            buttonHref: "/dartsosoknak/kezdoknek",
          },
          {
            title: "Haladóknak",
            description:
              "Lépj a következő szintre! Ismerj meg haladó kiszálló stratégiákat, mentális tréning technikákat és versenyfelkészülési módszereket.",
            buttonLabel: "Haladó tréning",
            buttonHref: "/dartsosoknak/haladoknak",
          },
        ],
      }),
    ],
  },

  /* ------------------------------------------------------------------ */
  /*  DARTSOSOKNAK / KEZDŐKNEK                                         */
  /* ------------------------------------------------------------------ */
  {
    slug: "dartsosoknak/kezdoknek",
    title: "Alapozó Tréning",
    blocks: [
      block("beginner-hero", "hero", 0, {
        ...getDefaultPayload("hero"),
        badge: "Ingyenes Kurzus",
        title: "Alapozó Tréning",
        description:
          "Minden, amit tudnod kell az első nyíl eldobása előtt. Regisztrálj és férj hozzá azonnal!",
      }),
      block("beginner-cta", "cta", 1, {
        ...getDefaultPayload("cta"),
        title: "Csatlakozz és kezd el a tanulást!",
        description:
          "A teljes videótár és a gyakorló feladatok eléréséhez ingyenes regisztráció szükséges.",
        buttonLabel: "Kurzus Elkezdése",
        buttonHref: "/courses",
      }),
      block("beginner-accordion", "accordion", 2, {
        ...getDefaultPayload("accordion"),
        title: "Kezdő témakörök",
        items: [
          { title: "A tábla és a pálya méretei", content: "Alap ismeretek a játéktérről és a szabványos méretekről." },
          { title: "A nyilak típusai és kiválasztása", content: "Milyen nyilat érdemes választani kezdőként és haladóként." },
          { title: "Alapállás és egyensúly", content: "A helyes beállás és egyensúly kialakítása." },
          { title: "A fogás technikája", content: "Hogyan tartsd a nyilat stabilan és kényelmesen." },
          { title: "A dobás fázisai", content: "A dobómozdulat lépésről lépésre: célzás, húzás, kioldás, utánnyúlás." },
        ],
      }),
    ],
  },

  /* ------------------------------------------------------------------ */
  /*  DARTSOSOKNAK / HALADÓKNAK                                        */
  /* ------------------------------------------------------------------ */
  {
    slug: "dartsosoknak/haladoknak",
    title: "Mesterkurzus",
    blocks: [
      block("advanced-hero", "hero", 0, {
        ...getDefaultPayload("hero"),
        badge: "Haladó Szint",
        title: "Mesterkurzus",
        description:
          "Finomhangolás, mentális felkészülés és verseny-szintű stratégiák.",
      }),
      block("advanced-richtext", "richText", 1, {
        ...getDefaultPayload("richText"),
        title: "Emeld a szintet!",
        html: '<p>Videóink egy része jelenleg a <a href="https://www.facebook.com/magyardartsakademia" target="_blank" rel="noopener noreferrer">Facebook oldalunkon</a> érhető el, de hamarosan itt is megtalálhatóak lesznek.</p><p>A haladó anyagok megtekintéséhez bejelentkezés szükséges.</p>',
      }),
      block("advanced-accordion", "accordion", 2, {
        ...getDefaultPayload("accordion"),
        title: "Haladó témakörök",
        items: [
          { title: "Kiszálló kombinációk (61-100)", content: "Hatékony kiszálló útvonalak és döntéshozatal nyomás alatt." },
          { title: "Bull-ra játszás stratégiája", content: "Mikor és hogyan érdemes bullra célozni a különböző játékhelyzetekben." },
          { title: "Mentális tréning: Nyomás kezelése", content: "Koncentráció, rutinok és stresszkezelés versenyhelyzetben." },
          { title: "Versenyfelkészülési rutin", content: "Hogyan készülj fel optimálisan egy versenyre fizikailag és mentálisan." },
          { title: "Videóelemzés haladóknak", content: "Saját dobásmechanikád elemzése videófelvételek segítségével." },
        ],
      }),
      block("advanced-cta", "cta", 3, {
        ...getDefaultPayload("cta"),
        title: "Haladó anyagokhoz belépés",
        description:
          "A haladó anyagok megtekintéséhez bejelentkezés szükséges.",
        buttonLabel: "Bejelentkezés / Regisztráció",
        buttonHref: "/courses",
      }),
    ],
  },

  /* ------------------------------------------------------------------ */
  /*  INSTRUKTOROKNAK                                                   */
  /* ------------------------------------------------------------------ */
  {
    slug: "instruktoroknak",
    title: "Instruktor Képzési Program",
    blocks: [
      block("inst-hero", "hero", 0, {
        ...getDefaultPayload("hero"),
        title: "Instruktor Képzési Program",
        description:
          "Válj hivatalos 365daysdarts instruktorrá! Átfogó képzési rendszerünk, online vizsgák és gyakorlati tréningek biztosítják, hogy magas szintű tudást adhass át tanítványaidnak.",
        links: [
          { label: "Regisztráció a képzésre", href: "/register" },
          { label: "Már van fiókom: Belépés", href: "/login" },
        ],
      }),
      block("inst-steps", "featureCards", 1, {
        ...getDefaultPayload("featureCards"),
        title: "A Minősítés Lépései",
        description: "",
        cards: [
          {
            title: "1. Tananyag Elsajátítás",
            description:
              "Hozzáférés a teljes instruktori tudásbázishoz és videós anyagokhoz a regisztráció után.",
            buttonLabel: "",
            buttonHref: "",
          },
          {
            title: "2. Online Vizsga",
            description:
              "400-500 kérdéses elméleti vizsga (szabályok, technika, oktatásmódszertan) teljesítése.",
            buttonLabel: "",
            buttonHref: "",
          },
          {
            title: "3. Gyakorlati Tréning",
            description:
              "Részvétel a gyakorlati oktatásokon tapasztalt trénerek vezetésével.",
            buttonLabel: "",
            buttonHref: "",
          },
          {
            title: "4. Minősítés",
            description:
              "Sikeres vizsgák után megkapod a hivatalos instruktori oklevelet és bekerülsz a regiszterbe.",
            buttonLabel: "",
            buttonHref: "",
          },
        ],
      }),
      block("inst-exam-info", "richText", 2, {
        ...getDefaultPayload("richText"),
        title: "Online Vizsgaközpont & Dashboard",
        html: "<p>A 365daysdarts platformon minden egy helyen elérhető. Regisztráció után azonnali hozzáférést kapsz a tanulói felülethez.</p><ul><li><strong>Átfogó Kérdésbank</strong> – Több száz kérdéses adatbázis, amely lefedi a szabályismeretet és az edzéselméletet.</li><li><strong>Azonnali Kiértékelés</strong> – A vizsgák eredményét azonnal megkapod, részletes elemzéssel.</li><li><strong>Instruktor Regiszter</strong> – A sikeres vizsgázók automatikusan bekerülnek a hivatalos oktatói adatbázisba.</li></ul>",
      }),
      block("inst-accordion", "accordion", 3, {
        ...getDefaultPayload("accordion"),
        title: "Tananyag Témakörök",
        items: [
          {
            title: "Alapok és Szabályismeret",
            content:
              "A darts története, eszközismeret, játékszabályok (501, Cricket, stb.), versenyelmélet alapjai.",
          },
          {
            title: "Dobástechnika és Biomechanika",
            content:
              "A helyes beállás, fogás, dobás fázisai, hibaelemzés, videóelemzési alapok.",
          },
          {
            title: "Edzéstervezés és Pszichológia",
            content:
              "Edzéstervek összeállítása kezdőknek és haladóknak, mentális felkészülés, versenyzők menedzselése.",
          },
        ],
      }),
      block("inst-sample", "cta", 4, {
        ...getDefaultPayload("cta"),
        title: "Betekintés a tananyagba",
        description:
          "Töltsd le mintaanyagunkat PDF formátumban, hogy lásd, mire számíthatsz.",
        buttonLabel: "Minta Tananyag Letöltése (PDF)",
        buttonHref: "/courses",
      }),
      block("inst-buttons", "buttonRow", 5, {
        ...getDefaultPayload("buttonRow"),
        title: "Gyors linkek",
        buttons: [
          { label: "Irányítópult", href: "/dashboard" },
          { label: "Minta tananyag", href: "/courses" },
        ],
      }),
    ],
  },

  /* ------------------------------------------------------------------ */
  /*  DIAMONDS CUP                                                      */
  /* ------------------------------------------------------------------ */
  {
    slug: "diamonds-cup",
    title: "Diamonds Cup",
    blocks: [
      block("dc-hero", "hero", 0, {
        ...getDefaultPayload("hero"),
        title: "DIAMONDS CUP",
        description:
          "Magyarország legújabb pénzdíjas darts versenysorozata. Készülj fel, mert a 365daysdarts Alapítvány valami különlegessel készül!",
      }),
      block("dc-buttons", "buttonRow", 1, {
        ...getDefaultPayload("buttonRow"),
        title: "",
        buttons: [{ label: "Vissza a főoldalra", href: "/" }],
      }),
    ],
  },

  /* ------------------------------------------------------------------ */
  /*  ALAPÍTVÁNYRÓL / MAGUNKRÓL                                         */
  /* ------------------------------------------------------------------ */
  {
    slug: "alapitvanyrol/magunkrol",
    title: "Rólunk",
    blocks: [
      block("about-hero", "hero", 0, {
        ...getDefaultPayload("hero"),
        title: "Rólunk",
        description:
          "A Magyar Darts Akadémia Alapítvány története és küldetése.",
      }),
      block("about-richtext", "richText", 1, {
        ...getDefaultPayload("richText"),
        title: "Bemutatkozás",
        html: "<p>A Magyar Darts Akadémia Alapítványt alapítóink – <strong>Balázs Gábor</strong> és <strong>Tekauer Norbert</strong> – 2021-ben azzal a céllal hozták létre, hogy a darts sportot Magyarországon minél szélesebb körben megismertesse és népszerűsítse, valamint hogy a sportág iránt érdeklődő és elhivatott játékosok számára folyamatos játék- és versenyzési lehetőségeket biztosítson.</p><p>Az alapítvány szakmai munkáját szoros együttműködésben végzi a <strong>Magyar Darts Szövetséggel</strong>, mint sportszakmai irányító szervezettel, valamint a hazai darts egyesületekkel. Ennek az együttműködésnek köszönhetően tevékenységünk stabil szakmai alapokon nyugszik, és hosszú távon is fenntartható fejlődést biztosít a sportág számára.</p><p>Éves szinten kiemelt figyelmet fordítunk arra, hogy minél több eseményt és versenyt szervezzünk amatőr, fiatal, valamint sérült játékosok számára is, lehetőséget adva számukra a fejlődésre és akár a versenyzői szintre való továbblépésre.</p><p>Elsődleges célcsoportunk a fiatal utánpótlás korosztály, valamint az aktív versenyzéstől már visszavonult, de a sportág iránt továbbra is elkötelezett játékosok. Ugyanakkor amatőr versenyeink széles korosztályt szólítanak meg, amely jelentős közösségépítő erőt képvisel.</p><p>A Magyar Darts Szövetséggel együttműködve, állandó klubhelyszínünkön a <strong>Remiz Event</strong> rendezvénytermében éves szinten közel 60 darts versenyt és eseményt valósítunk meg. Emellett az elmúlt években sikeresen elindítottuk amatőr versenysorozatunkat, a <strong>Diamonds Cup</strong>-ot, amelyre minden darts iránt érdeklődőt szeretettel vár a Magyar Darts Akadémia Alapítvány.</p>",
      }),
      block("about-mission", "richText", 2, {
        ...getDefaultPayload("richText"),
        title: "Alapítói Küldetés Nyilatkozat – Balázs Gábor & Tekauer Norbert",
        html: '<p><em>"A Magyar Darts Akadémia Alapítvány küldetése, hogy a darts sportot nyitott, befogadó és közösségformáló tevékenységként képviselje Magyarországon."</em></p><p>Célunk, hogy minden korosztály és képesség számára elérhetővé tegyük a darts nyújtotta sportolási és közösségi élményt, különös hangsúlyt fektetve az utánpótlás-nevelésre, az amatőr sport támogatására, valamint a hátrányos helyzetű és sérült játékosok bevonására.</p><p>Hiszünk abban, hogy a darts nem csupán versenysport, hanem egy olyan közösségépítő eszköz, amely fejleszti a koncentrációt, az önfegyelmet és a sportszerűséget, miközben baráti és támogató közeget teremt a résztvevők számára.</p><p>Küldetésünk megvalósítása érdekében hosszú távú, szakmailag megalapozott együttműködésre törekszünk a <strong>Magyar Darts Szövetséggel</strong>, az egyesületekkel és minden olyan partnerrel, aki osztja értékeinket, és tenni kíván a magyar darts jövőjéért.</p>',
      }),
    ],
  },

  /* ------------------------------------------------------------------ */
  /*  ALAPÍTVÁNYRÓL / KURATÓRIUM                                        */
  /* ------------------------------------------------------------------ */
  {
    slug: "alapitvanyrol/kuratorium",
    title: "Kuratórium",
    blocks: [
      block("board-hero", "hero", 0, {
        ...getDefaultPayload("hero"),
        title: "Kuratórium",
        description:
          "Ismerd meg az alapítvány vezetőit, akik a stratégiai irányokért felelnek.",
      }),
      block("board-people", "peopleGrid", 1, {
        ...getDefaultPayload("peopleGrid"),
        title: "Kuratóriumi tagok",
        description: "",
        columns: "3",
        people: [
          {
            name: "Lukács Kovács Henriette",
            role: "Elnök",
            bio: "A Pannon Egyetemen folytatott tanulmányaim után Exeterben DMBA szakon másod-diplomáztam, ahol elsősorban szervezet menedzsmenttel, marketinggel és stratégia fejlesztéssel foglalkoztam. Az alapítvány elnökeként célom, hogy a dartson keresztül - amely fegyelemre, kitartásra és célkitűzésre tanít - minél több fiatal találjon lehetőséget a sportolásra.",
            imageUrl: "/instrukturok/Kovacs Heni.JPG",
            buttonLabel: "",
            buttonHref: "",
          },
          {
            name: "Marti György",
            role: "Kuratóriumi Tag",
            bio: "Építőipari diplomáim mellett kezdtem el sportszervezéssel, és vezetéssel foglalkozni. 40 éve vezetek szakosztályt, 15 éve klubelnök vagyok. Dolgoztam két országos szakszövetségben, a Magyar Sakkszövetségben 15 évig voltam Szervezési igazgató, a Magyar Darts Szövetségben voltam Operatív igazgató, és Főtitkár is.",
            imageUrl: "/instrukturok/Marti Gyorgy.jpg",
            buttonLabel: "",
            buttonHref: "",
          },
          {
            name: "Tekauer Norbert",
            role: "Kuratóriumi Tag",
            bio: "Sportmenedzseri végzettséggel rendelkező sportvezető és sportszakember. Közel három évtizedes tapasztalattal rendelkezem a sport világában. Jelenleg a Magyar Darts Szövetség alelnöke vagyok, ahol célom a sportág strukturált fejlesztése, az utánpótlás-nevelés erősítése.",
            imageUrl: "",
            buttonLabel: "",
            buttonHref: "",
          },
        ],
      }),
    ],
  },

  /* ------------------------------------------------------------------ */
  /*  ALAPÍTVÁNYRÓL / OKTATÓK (STÁB)                                    */
  /* ------------------------------------------------------------------ */
  {
    slug: "alapitvanyrol/oktatok",
    title: "Stáb",
    blocks: [
      block("staff-hero", "hero", 0, {
        ...getDefaultPayload("hero"),
        title: "Stáb",
        description:
          "Ismerd meg a 365daysdarts csapatát, akik a képzésekért, versenyekért és a tartalomért felelnek.",
      }),
      block("staff-people", "peopleGrid", 1, {
        ...getDefaultPayload("peopleGrid"),
        title: "Csapat",
        description: "",
        columns: "3",
        people: [
          {
            name: "Balázs-Treszner Tímea",
            role: "Instruktor képzés",
            bio: "Pedagógiai diplomával rendelkező egészségügyi és fitness szakember. Szakmai alapjaimat a Pécsi Tudományegyetemen, a Semmelweis Egyetemen és a Kodolányi János Főiskolán szereztem. Jelenleg meditációs coachként a légzésterápia eszközeivel nyújtok segítséget a stressz kezelésben.",
            imageUrl: "/instrukturok/BalazsTresznerTimeaoktato.jpg",
            buttonLabel: "",
            buttonHref: "",
          },
          {
            name: "Bodó Balázs",
            role: "Instruktor képzés",
            bio: "Az alapképzést a Budapesti Gazdasági Egyetem Nemzetközi Kapcsolatok szakán, a mesterképzést a Testnevelési Egyetem Sportmenedzser szakán végezte. Jelenleg is utóbbi intézmény Rekreáció mesterképzés szak hallgatója. Az elmúlt 3 évben a sportirányításban dolgozott, jelenleg a Magyar Darts Szövetség főtitkára",
            imageUrl: "/instrukturok/BB.jpg",
            buttonLabel: "",
            buttonHref: "",
          },
          {
            name: "Balázs Gábor",
            role: "MDSZ Elnök, Alapító",
            bio: "Közgazdász, sportmenedzser, a Magyar Darts Szövetség elnöke. A Magyar Darts Akadémia Alapítvány társalapítója. Célom a tudás alapú sportágfejlesztés és egy magas szintű szakmai központ működtetése.",
            imageUrl:
              "/instrukturok/602977677_33335356592745099_2402076347139985134_n.jpg",
            buttonLabel: "",
            buttonHref: "",
          },
          {
            name: "Rucska József",
            role: "Instruktor képzés és edző",
            bio: "2022 óta főállású darts versenyzőként és edzőként tevékenykedem. 28-szoros válogatott, magyar bajnok, Magyar Kupa győztes. Ihász Veronika felkészítésében 15 éve veszek részt edzőként.",
            imageUrl: "/instrukturok/Rucska Jozsef.jpg",
            buttonLabel: "",
            buttonHref: "",
          },
          {
            name: "Kovács István",
            role: "Instruktor képzés és edző",
            bio: "Testnevelő tanár, középfokú atlétika edző. A Szolnoki Baglyok Darts Klub alapítója. 2017 óta foglalkozom utánpótlás korú versenyzőkkel, többek között Kovács Tamara Európa-bajnok felkészítője.",
            imageUrl: "/instrukturok/isu.jpg",
            buttonLabel: "",
            buttonHref: "",
          },
          {
            name: "Veress Gréta",
            role: "Versenyszervező, digitális tartalomkészítő",
            bio: "Több mint 10 éve része az életemnek a darts. Dolgoztam a Magyar Darts Szövetségnél versenyszervezésben. Jelenleg a csapatot social média oldalon erősítem.",
            imageUrl: "/instrukturok/greta.jpeg",
            buttonLabel: "",
            buttonHref: "",
          },
          {
            name: "Szilágyi Szonja",
            role: "Digitális tartalomkészítő",
            bio: "ELTE PPK sportszervező szakos, jelenleg utolsó féléves hallgatója. A sport iránti elköteleződésem a digitális világban is megmutatkozik: ezen a platformon elsősorban a tananyagok fejlesztéséért és a tartalmi struktúra kialakításáért feleltem. Célom, hogy a sportszakmai tudásomat a digitális tartalomgyártással ötvözve segítsem a darts közösség fejlődését.",
            imageUrl: "",
            buttonLabel: "",
            buttonHref: "",
          },
          {
            name: "Neumajer Kitti",
            role: "Instruktor képzés, digitális tartalomkészítő",
            bio: "Háromszoros ifjúsági Európa-bajnok és világbajnoki bronzérmes. Jelenleg a Magyar Darts Szövetség operatív igazgatója. Célom, hogy a megszerzett tapasztalataimat az oktatásban és mentorálásban is továbbadjam.",
            imageUrl: "/instrukturok/Kitti Neumajer - Girls manager.jpg",
            buttonLabel: "",
            buttonHref: "",
          },
        ],
      }),
    ],
  },
];

export const defaultHomeDraftBlocks =
  MARKETING_PAGE_SEEDS.find((p) => p.slug === "home")?.blocks || [];
