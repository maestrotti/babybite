# BabyBite 🥣

PWA za bilježenje bebinih obroka. Stack: React + TypeScript + Vite + Tailwind + Supabase (baza, prijava, RLS). Sučelje je na bosanskom.

Tri odvojene stvari: **GitHub repozitorij** (kod), **javni URL** (npr. `https://KORISNIK.github.io/babybite/`, to otvarate na telefonu) i **Supabase projekat** (baza s obrocima).

## Brzi start

1. **ZIP**: raspakujte `babybite.zip` u folder.
2. **Node.js**: instalirajte LTS verziju s https://nodejs.org (provjera: `node -v`).
3. **Supabase projekat**: na https://supabase.com napravite račun → *New project* (zapamtite lozinku baze; ona ne ide nigdje u aplikaciju).
4. **SQL**: u Supabase otvorite *SQL Editor* i redom pokrenite cijeli sadržaj `supabase/migrations/001_schema.sql`, pa `002_seed_foods.sql` (96 namirnica).
5. **Ključevi**: *Project Settings → API*: kopirajte *Project URL* i *anon / publishable key*. **Nikada** ne koristite `service_role` ključ.
6. **Env**: kopirajte `.env.example` u `.env` i upišite vrijednosti. `.env` je u `.gitignore`.
7. **Lokalno**: `npm install`, pa `npm run dev` (http://localhost:5173).
8. **GitHub repozitorij**: napravite novi repozitorij (npr. `babybite`), pa u folderu:
   `git init && git add . && git commit -m "BabyBite" && git branch -M main && git remote add origin https://github.com/KORISNIK/babybite.git && git push -u origin main`
9. **GitHub Actions**: *Settings → Secrets and variables → Actions → New repository secret*: `VITE_SUPABASE_URL` i `VITE_SUPABASE_ANON_KEY` (javni ključ, nikad service_role). *Settings → Pages → Source: GitHub Actions*.
10. **Deploy**: svaki push na `main` pokreće `.github/workflows/deploy.yml` (test + build + objava). Prva objava traje ~2 min.
11. **Routing i base path**: workflow postavlja `VITE_BASE=/<ime-repozitorija>/`. Aplikacija koristi hash rutiranje (`#/historija`), pa na GitHub Pages nije potreban SPA fallback. Ako repozitorij promijenite u `KORISNIK.github.io`, postavite `VITE_BASE=/`.
12. **Redirect URL-ovi**: Supabase *Authentication → URL Configuration*: *Site URL* = `https://KORISNIK.github.io/babybite/`; u *Redirect URLs* dodajte isti URL i `http://localhost:5173/`. Bez toga linkovi za potvrdu e-maila i reset lozinke neće raditi.

## Testiranje (ručno)
Registrujte se → potvrdite e-mail → *Dodaj obrok* → odaberite npr. Batat + Praziluk + Banana → spremite → u *Historiji* uredite (promijenite vrijeme/namirnice) → obrišite uz potvrdu.

**RLS test s dva računa**: registrujte korisnika A i B (drugi preglednik/anonimni prozor). A doda obrok. B ne smije vidjeti obrok u Historiji ni Statistici. U SQL Editoru: `select count(*) from meals;` kao service role vidi sve, a aplikacija kao B vidi samo svoje. Dodatno u konzoli kao B: `supabase.from('meals').select()` mora vratiti prazan niz.

Automatski: `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`.

## PWA instalacija
- **Android (Chrome)**: otvorite javni URL → ⋮ → *Instaliraj aplikaciju*.
- **iPhone (Safari)**: otvorite URL → *Podijeli* → *Dodaj na početni ekran*.

Offline se kešira samo „ljuska" aplikacije (HTML/JS/CSS). Obroci žive u Supabase bazi; **spremanje je onemogućeno bez interneta** i aplikacija to jasno kaže. Brisanje keša/historije/reinstalacija PWA-a ne briše obroke.

## Rješavanje problema
- *Bijeli ekran / „Nedostaje konfiguracija"*: nema `.env` (lokalno) ili GitHub secrets (deploy).
- *404 na GitHub Pages / nedostaju stilovi*: pogrešan `VITE_BASE`; mora biti `/ime-repozitorija/`.
- *Link iz e-maila vodi na localhost*: popravite *Site URL* (korak 12).
- *Lista namirnica prazna*: nije pokrenut `002_seed_foods.sql`.
- *„permission denied" / RLS greška*: nije pokrenut cijeli `001_schema.sql`.
- Nakon nove verzije stara PWA se osvježi pri sljedećem otvaranju (autoUpdate).

## Backup i reset
- Backup: Supabase *Database → Backups* (automatski dnevni backupi zavise od plana) ili `pg_dump` s connection stringom iz *Project Settings → Database*.
- Reset test okruženja: u SQL Editoru `delete from meals;` (briše obroke i stavke; katalog ostaje) ili napravite zaseban Supabase projekat za testiranje.
- Brisanje računa iz aplikacije (*Postavke*) poziva funkciju `delete_my_account()` koja briše korisnika; profil i obroci se brišu kaskadno.

## Besplatno / ograničenja / troškovi
GitHub Pages: besplatno za javne repozitorije. Supabase Free: ograničen prostor (500 MB baze), mjesečni limiti korisnika i prometa, a projekat se **pauzira nakon ~1 sedmice neaktivnosti** (potrebno ručno ponovo pokrenuti); backupi su dostupni tek na plaćenom planu. Besplatno slanje e-mailova ima strogi limit; za više korisnika podesite vlastiti SMTP. Provjerite aktuelne limite na supabase.com/pricing.

## Alternativa: Cloudflare Pages / Vercel
Uvezite GitHub repozitorij, build komanda `npm run build`, output `dist`, env varijable `VITE_SUPABASE_URL` i `VITE_SUPABASE_ANON_KEY`, a `VITE_BASE` ostavite prazno (aplikacija je tada na korijenu `/`). Redirect URL-ove u Supabase postavite na novi domen.

## Slike namirnica
Kolona `foods.image_url` je podržana (komponenta `FoodImage` ima stanja učitavanja/greške i rezervnu sliku), ali **katalog nije popunjena fotografijama**: svaka namirnica trenutno ima emoji ilustraciju. Fotografije dodajte tek kad provjerite licencu (npr. Wikimedia Commons, uz atribuciju) pa ih upišite: `update foods set image_url = '...' where normalized_name = 'banana';`

## Lista vanjskih računa koje morate sami napraviti
GitHub račun, Supabase račun (+ projekat). Opcionalno: Cloudflare ili Vercel.

## Struktura
`src/pages` (ekrani), `src/components` (FoodPicker, FoodImage, UI), `src/lib` (supabase klijent, logika obroka, store), `supabase/migrations` (SQL), `tests`.
