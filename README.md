# Social Media Content Tracker - Setup Guide

## Quick Start

### Step 1: Setup Google Apps Script (Backend)

1. Buka Google Sheet Anda: [Link Sheet](https://docs.google.com/spreadsheets/d/1KfXBv0tkQ3TPrLdOYat9sy1UfdFFzJ_tJXa_eaEgsWo/edit)

2. Pastikan Sheet bisa diakses:
   - Klik **Share** (pojok kanan atas)
   - Set ke **"Anyone with the link"** → **Editor**

3. Buka **Extensions → Apps Script**

4. Hapus semua kode yang ada, lalu copy-paste isi file:
   ```
   google-apps-script/Code.gs
   ```

5. Klik **Deploy → New deployment**:
   - Type: **Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
   
6. Klik **Deploy** dan **Authorize** jika diminta

7. Copy **Web App URL** yang muncul

### Step 2: Configure Frontend

1. Buka file `js/config.js`

2. Ganti `YOUR_GOOGLE_APPS_SCRIPT_URL_HERE` dengan URL dari Step 1:
   ```javascript
   API_URL: 'https://script.google.com/macros/s/xxxxx/exec',
   ```

3. Save file

### Step 3: Run Application

Buka `index.html` di browser, atau jalankan dengan live server.

## Files Structure

```
📁 ancient-disk/
├── 📄 index.html          # Main application
├── 📁 css/
│   └── 📄 style.css       # Styling
├── 📁 js/
│   ├── 📄 config.js       # Configuration
│   └── 📄 app.js          # Application logic
└── 📁 google-apps-script/
    └── 📄 Code.gs         # Backend (paste to Apps Script)
```

## Features

- ✅ **Dashboard** - View all posts with statistics
- ✅ **Form Input** - Add new post data
- ✅ **Search & Filter** - Find specific posts
- ✅ **Edit** - Modify existing data
- ✅ **Delete** - Remove posts
- ✅ **Mobile Responsive** - Works on all devices

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Data tidak muncul | Pastikan API_URL sudah diisi di config.js |
| Error CORS | Deploy ulang Apps Script, pastikan access = Anyone |
| Sheet tidak update | Pastikan sheet di-share sebagai Editor |
