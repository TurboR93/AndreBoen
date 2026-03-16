# Andrea Boen Wine Relations

Webapp CRM per il settore vinicolo. Due esperienze distinte: una **landing page elegante** per i clienti con form di contatto multi-step, e una **dashboard admin** con mappa interattiva e gestione contatti.

## Tech Stack

| Tecnologia | Versione | Utilizzo |
|---|---|---|
| React | 18.3 | UI framework |
| Vite | 6.x | Bundler e dev server |
| Leaflet | 1.9 | Mappe interattive |
| react-leaflet | 4.2 | Binding React per Leaflet |
| CSS puro | - | Stile e animazioni |
| localStorage | - | Persistenza dati (no backend) |

## Funzionalita'

### Esperienza Cliente (pubblica)

- **Landing page** con sfondo vigneto, overlay gradiente, logo SVG
- **Animazione zoom** al primo caricamento: mappa dark mondiale con Italia evidenziata in HD (GeoJSON reale) che zooma dal mondo all'Italia con flyTo Leaflet. Si vede solo alla prima visita (sessionStorage)
- **Form di contatto a 4 step:**
  1. **Settore** - Scelta tra Wine e Spirits
  2. **Azienda** - Nome dell'azienda rappresentata
  3. **Mappa paese** - Mappa mondiale cliccabile con reverse geocoding automatico (Nominatim)
  4. **Dati contatto** - Nome, cognome, telefono, email, ruolo. Almeno uno tra telefono e email obbligatorio
- Messaggio di conferma post-invio
- Link discreto "Area Riservata" per l'admin

### Dashboard Admin (privata)

- **Login**: username `andrea`, password `admin2025`
- **Sidebar filtrabile** a sinistra:
  - Ricerca libera (nome, azienda, email, citta', ruolo)
  - Filtro per paese (dropdown dinamico)
  - Filtro per citta' (si aggiorna in base al paese)
  - Contatori: filtrati / totali + nuove richieste
  - Sidebar collassabile
  - Click su contatto → mappa vola alla posizione
- **Mappa Leaflet** con tiles CartoDB Positron:
  - 67 contatti pre-caricati (marker blu)
  - Contatti da form clienti (marker colorato diverso)
  - Click marker → popup con tutti i dettagli
  - Auto-zoom sui risultati filtrati
- **Logout** → torna alla landing

## Struttura Progetto

```
├── index.html                  # Entry point HTML
├── package.json                # Dipendenze e script
├── vite.config.js              # Configurazione Vite
├── CLAUDE.md                   # Istruzioni per Claude Code
└── src/
    ├── main.jsx                # Bootstrap React + import Leaflet CSS
    ├── App.jsx                 # Router principale (client vs admin)
    ├── App.css                 # Tutti gli stili (~900 righe)
    ├── components/
    │   ├── Logo.jsx            # Logo SVG "ANDREA BOEN Wine Relations"
    │   ├── ClientLanding.jsx   # Landing page pubblica
    │   ├── ZoomAnimation.jsx   # Animazione zoom mondo → Italia
    │   ├── ContactForm.jsx     # Form contatto 4 step con mappa
    │   ├── Login.jsx           # Form login admin
    │   ├── AdminMap.jsx        # Dashboard admin con sidebar + mappa
    │   └── MarkerPopup.jsx     # Popup dettagli contatto
    └── data/
        ├── points.js           # 67 contatti iniziali fake
        └── italy-geo.json      # Confini Italia HD (GeoJSON)
```

## Setup e Installazione

```bash
# Clona il repository
git clone https://github.com/TurboR93/AndreBoen.git
cd AndreBoen

# Installa dipendenze
npm install

# Avvia dev server
npm run dev

# Build produzione
npm run build

# Preview build
npm run preview
```

## Modello Dati

Ogni contatto ha questa struttura:

```javascript
{
  id:        number,      // 1-67 per iniziali, Date.now() per nuovi
  lat:       number,      // Latitudine
  lng:       number,      // Longitudine
  country:   string,      // "Italia", "Slovenia", "Francia"...
  city:      string,      // "Venezia", "Trieste", "Verona"...
  company:   string,      // Nome azienda
  firstName: string,
  lastName:  string,
  phone:     string,      // Formato internazionale
  email:     string,
  role:      string,      // "Export Manager", "Enologo"...
  sector:    string,      // "Wine" o "Spirits" (solo da form)
  source:    string,      // "client-form" (solo nuovi contatti)
  date:      string       // ISO date (solo nuovi contatti)
}
```

### Copertura Dati Iniziali

| Regione | Contatti | Zone |
|---|---|---|
| Veneto | 12 | Verona, Venezia, Treviso, Vicenza, Soave, Conegliano, Valdobbiadene |
| Friuli Venezia Giulia | 8 | Trieste, Udine, Gorizia, Cormons, Cividale |
| Slovenia | 9 | Ljubljana, Maribor, Nova Gorica, Koper, Ptuj |
| Italia (altro) | 8 | Firenze, Bologna, Parma, L'Aquila, Bardolino, Lazise |
| Internazionali | 30 | Francia, Germania, UK, USA, Canada, Giappone, Cina, Australia... |

## Design System

### Palette Colori

| Colore | Hex | Utilizzo |
|---|---|---|
| Bordeaux | `#722F37` | Colore primario, titoli, accenti |
| Bordeaux scuro | `#5a1f26` | Hover, varianti scure |
| Oro | `#C5A572` | Accenti luxury, CTA, bordi decorativi |
| Oro chiaro | `#d4bb8a` | Hover oro |
| Panna | `#FFF8F0` | Sfondi chiari, card |
| Nero | `#1a1a1a` | Background base |

### Tipografia

- **Playfair Display** (serif) — Logo, titoli, nomi azienda. Peso 400/600/700
- **Inter** (sans-serif) — Body, UI, form. Peso 300/400/500/600

## Servizi Esterni

| Servizio | Utilizzo | Note |
|---|---|---|
| [Nominatim](https://nominatim.openstreetmap.org) | Reverse geocoding nel form (step 3) | Gratuito, no API key |
| [CARTO](https://carto.com) | Tile server mappe (light + dark) | Gratuito |
| [Unsplash](https://unsplash.com) | Immagine sfondo landing (vigneto) | Gratuito, hotlink diretto |
| [Google Fonts](https://fonts.google.com) | Playfair Display + Inter | Gratuito |
| [Leaflet CDN](https://cdnjs.cloudflare.com) | Icone marker mappa | Gratuito |

## Note Sicurezza

> **Questo e' un prototipo.** Non usare in produzione senza le seguenti modifiche:

- Le credenziali admin (`andrea` / `admin2025`) sono **hardcoded nel frontend**. Servira' un backend con autenticazione sicura
- I dati sono salvati in **localStorage** del browser. Si perderanno pulendo i dati del browser
- La sessione admin e' in **React state** — si perde al refresh della pagina
- L'API Nominatim ha **rate limiting** — per uso intensivo servira' un servizio geocoding dedicato

## Roadmap

- [ ] Backend con database (PostgreSQL/Supabase)
- [ ] Autenticazione sicura (JWT/OAuth)
- [ ] CRUD contatti da admin (modifica, elimina)
- [ ] Modifica coordinate contatto da admin
- [ ] Import/export CSV contatti
- [ ] Filtri avanzati (per settore Wine/Spirits, per data)
- [ ] Notifiche nuovi contatti
- [ ] Multi-utente con ruoli
- [ ] Deploy su Vercel/Netlify

## Licenza

Progetto privato — Andrea Boen Wine Relations
