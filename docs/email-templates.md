# Email Templates — Andrea Boen Wine Relations

## Panoramica

Il sito invia email di notifica quando un utente compila un form.
Lo script PHP `api/send.php` riceve i dati in JSON via POST e inoltra una email HTML formattata.

---

## Configurazione

In `api/send.php` modificare queste variabili:

```php
$TO_EMAIL = 'info@andreaboen.com';     // Email destinatario
$FROM_EMAIL = 'noreply@andreaboen.com'; // Mittente (deve essere un dominio del VPS)
```

Il VPS Hostinger deve avere PHP con `mail()` abilitato (default su tutti i piani).

---

## Template 1: Form Contatti

**Endpoint:** `POST /api/send.php`

**Payload JSON:**
```json
{
  "type": "contatti",
  "name": "Mario Rossi",
  "email": "mario@example.com",
  "message": "Vorrei informazioni sui vostri servizi..."
}
```

**Subject:** `Nuovo messaggio da Mario Rossi`

**Struttura email:**

```
+------------------------------------------+
|          HEADER (sfondo #722F37)          |
|        Andrea Boen - Wine Relations      |
+------------------------------------------+
|                                          |
|   Nuovo messaggio dal sito               |
|                                          |
|   Nome        Mario Rossi               |
|   Email       mario@example.com          |
|                                          |
|   +------------------------------------+ |
|   | Messaggio                          | |
|   | Vorrei informazioni sui vostri     | |
|   | servizi...                         | |
|   +------------------------------------+ |
|                                          |
+------------------------------------------+
|   Inviato dal form Contatti              |
+------------------------------------------+
```

**Campi obbligatori:** name, email, message
**Reply-To:** email del mittente (per rispondere direttamente)

---

## Template 2: Form Buyer

**Endpoint:** `POST /api/send.php`

**Payload JSON:**
```json
{
  "type": "buyer",
  "company": "Wine Import Co.",
  "country": "Germany",
  "types": ["Importatore", "Distributore"],
  "markets": ["USA", "UK", "Germany"],
  "categories": ["WINE", "SPIRITS"],
  "preferences": "Vini rossi italiani premium",
  "priceRange": "15-30 EUR",
  "volume": "1000-5000 bottiglie",
  "notes": "Interessati a produttori del Veneto"
}
```

**Subject:** `Nuova richiesta Buyer - Wine Import Co.`

**Struttura email:**

```
+------------------------------------------+
|          HEADER (sfondo #722F37)          |
|        Andrea Boen - Wine Relations      |
+------------------------------------------+
|                                          |
|   Nuova richiesta Buyer                  |
|                                          |
|   Azienda       Wine Import Co.         |
|   Paese         Germany                  |
|   Tipologia     Importatore, Distrib.    |
|   Mercati       USA, UK, Germany         |
|   Categorie     WINE, SPIRITS            |
|   Preferenze    Vini rossi italiani...   |
|   Fascia prezzo 15-30 EUR               |
|   Volume        1000-5000 bottiglie      |
|                                          |
|   +------------------------------------+ |
|   | Note                               | |
|   | Interessati a produttori del       | |
|   | Veneto                             | |
|   +------------------------------------+ |
|                                          |
+------------------------------------------+
|   Inviato dal form Buyer                 |
+------------------------------------------+
```

**Campi obbligatori:** company, country
**Campi opzionali:** types, markets, categories, preferences, priceRange, volume, notes

---

## Stile email

Tutte le email seguono il branding Andrea Boen:

| Elemento | Valore |
|----------|--------|
| Header background | `#722F37` (wine) |
| Titolo header | `#C5A572` (gold) |
| Body background | `#FFF8F0` (cream) |
| Testo | `#1a1a1a` (black) |
| Labels | `#888` (grey) |
| Accent border | `#C5A572` (gold, 3px left) |
| Font headings | Playfair Display |
| Font body | Inter |

---

## Deploy sul VPS

1. Fare build del frontend: `npm run build`
2. Caricare il contenuto di `dist/` nella root del web server (es. `/var/www/html/`)
3. Caricare `api/send.php` in `/var/www/html/api/send.php`
4. Verificare che PHP sia attivo: `php -v`
5. Testare: `curl -X POST https://tuodominio.com/api/send.php -H "Content-Type: application/json" -d '{"type":"contatti","name":"Test","email":"test@test.com","message":"Prova"}'`

---

## Sicurezza

- I dati vengono sanitizzati con `htmlspecialchars()` per prevenire XSS
- Gli indirizzi email sono validati con `filter_var(FILTER_VALIDATE_EMAIL)`
- Le richieste accettano solo metodo POST
- CORS abilitato per permettere chiamate dal frontend
- In produzione, restringere `Access-Control-Allow-Origin` al dominio effettivo
