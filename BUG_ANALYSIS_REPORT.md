# StreamFlow - Analisis Potensi Bug & Kerentanan

**Tanggal Analisis:** 2025-11-22
**Versi Project:** 2.1.0
**Fokus Analisis:** Upload video berukuran besar (5GB+) dan bug umum lainnya

---

## 🔴 CRITICAL BUGS

### 1. **TIDAK ADA FILE SIZE LIMIT DI MULTER CONFIGURATION**
**Lokasi:** `middleware/uploadMiddleware.js:47-50`

**Masalah:**
```javascript
const uploadVideo = multer({
  storage: videoStorage,
  fileFilter: videoFilter
  // MISSING: limits configuration!
});
```

Konfigurasi multer tidak memiliki properti `limits`, padahal di `app.js:1194-1198` ada error handling untuk `LIMIT_FILE_SIZE`:
```javascript
if (err.code === 'LIMIT_FILE_SIZE') {
  return res.status(413).json({
    success: false,
    error: 'File too large. Maximum size is 10GB.'
  });
}
```

**Dampak:**
- Upload bisa menerima file dengan ukuran unlimited (hanya dibatasi body parser 10GB)
- Error handling untuk file size tidak akan pernah terpicu
- Potensi disk exhaustion

**Solusi:**
```javascript
const uploadVideo = multer({
  storage: videoStorage,
  fileFilter: videoFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 * 1024 // 10GB in bytes
  }
});
```

---

### 2. **TIDAK ADA VALIDASI DISK SPACE SEBELUM UPLOAD**
**Lokasi:** `app.js:1191-1290` (endpoint `/api/videos/upload`)

**Masalah:**
- System monitoring ada di `services/systemMonitor.js` tapi tidak digunakan untuk validasi pre-upload
- Upload bisa dimulai meskipun disk space tidak cukup
- Akan gagal di tengah proses, meninggalkan file partial/corrupt

**Dampak:**
- Upload 5GB video bisa gagal setelah 90% selesai jika disk penuh
- Waste bandwidth dan waktu user
- File partial tidak di-cleanup otomatis

**Solusi:**
Tambahkan check disk space sebelum menerima upload:
```javascript
const { getSystemStats } = require('../services/systemMonitor');

app.post('/api/videos/upload', isAuthenticated, async (req, res, next) => {
  // Check disk space first
  const stats = await getSystemStats();
  const requiredSpace = 10 * 1024 * 1024 * 1024; // 10GB buffer

  if (stats.disk.usagePercent > 90) {
    return res.status(507).json({
      success: false,
      error: 'Insufficient disk space'
    });
  }

  // Then proceed with upload...
});
```

---

### 3. **THUMBNAIL GENERATION BISA HANG INDEFINITELY**
**Lokasi:** `app.js:1250-1286`

**Masalah:**
```javascript
ffmpeg(fullFilePath)
  .screenshots({
    timestamps: ['10%'],
    filename: thumbnailFilename,
    folder: path.join(__dirname, 'public', 'uploads', 'thumbnails'),
    size: '854x480'
  })
  .on('end', async () => { /* ... */ })
  .on('error', (err) => { /* ... */ });
```

Tidak ada timeout untuk FFmpeg thumbnail generation. Video corrupt atau sangat besar bisa hang.

**Dampak:**
- Upload 5GB video dengan codec corrupt bisa stuck selamanya
- Request tidak pernah complete (meskipun ada 30 min server timeout)
- Memory leak jika banyak request stuck

**Solusi:**
```javascript
ffmpeg(fullFilePath)
  .screenshots({
    timestamps: ['10%'],
    filename: thumbnailFilename,
    folder: path.join(__dirname, 'public', 'uploads', 'thumbnails'),
    size: '854x480'
  })
  .timeout(120) // 2 minutes timeout
  .on('end', async () => { /* ... */ })
  .on('error', (err) => { /* ... */ });
```

---

### 4. **TUS RESUMABLE UPLOAD TIDAK DIIMPLEMENTASI**
**Lokasi:** `package.json:13-14, 35`

**Masalah:**
Dependencies untuk resumable upload sudah ada:
```json
"@tus/file-store": "^2.0.0",
"@tus/server": "^2.3.0",
"tus-js-client": "^4.3.1"
```

Tapi tidak ada implementasi di codebase! Upload menggunakan standard multer.

**Dampak untuk 5GB upload:**
- Jika koneksi terputus saat upload 90%, harus restart dari awal
- Tidak user-friendly untuk file besar
- Waste bandwidth sangat besar

**Solusi:**
Implementasikan tus protocol atau hapus dependencies yang tidak dipakai.

---

## 🟡 HIGH PRIORITY BUGS

### 5. **FFMPEG PROBE TIDAK ADA TIMEOUT**
**Lokasi:** `app.js:1226-1246`

**Masalah:**
```javascript
ffmpeg.ffprobe(fullFilePath, (err, metadata) => {
  // No timeout set
});
```

**Dampak:**
- Video 5GB corrupt bisa membuat ffprobe hang
- Blocking request thread

**Solusi:**
Wrap dalam Promise dengan timeout atau gunakan child_process dengan timeout.

---

### 6. **PLAYLIST CONCAT FILE GENERATION TIDAK EFISIEN**
**Lokasi:** `services/streamingService.js:74-85`

**Masalah:**
```javascript
let concatContent = '';
if (stream.loop_video) {
  for (let i = 0; i < 1000; i++) {  // 1000 iterations!
    videoPaths.forEach(videoPath => {
      concatContent += `file '${videoPath.replace(/\\/g, '/')}'\n`;
    });
  }
}
fs.writeFileSync(concatFile, concatContent);
```

**Dampak:**
- Jika playlist punya 10 video @ 5GB, ini akan generate string dengan 10,000 entries
- Memory spike saat build string
- Untuk playlist besar, bisa OOM

**Solusi:**
Gunakan stream write atau batasi loop iterations.

---

### 7. **TEMP FILE CLEANUP TIDAK RELIABLE**
**Lokasi:** `services/streamingService.js:415-423`

**Masalah:**
Temp concat files hanya di-cleanup saat stream stop:
```javascript
const tempConcatFile = path.join(__dirname, '..', 'temp', `playlist_${streamId}.txt`);
try {
  if (fs.existsSync(tempConcatFile)) {
    fs.unlinkSync(tempConcatFile);
  }
}
```

**Dampak:**
- Jika app crash, temp files tidak di-cleanup
- Bisa akumulasi di `/temp` directory
- Disk space leak

**Solusi:**
Implementasi cleanup on startup atau periodic cleanup job.

---

### 8. **TIDAK ADA RATE LIMITING UNTUK UPLOAD**
**Lokasi:** `app.js:1191`

**Masalah:**
Rate limiting hanya ada untuk login endpoint:
```javascript
// Line 234-248: Only for /login
```

Upload endpoint tidak ada rate limiting.

**Dampak:**
- Multiple users bisa upload 5GB videos secara bersamaan
- Server memory/disk/bandwidth exhaustion
- Potential DoS attack

**Solusi:**
```javascript
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // max 5 uploads per hour per IP
  message: 'Too many uploads from this IP'
});

app.post('/api/videos/upload', uploadLimiter, isAuthenticated, ...);
```

---

### 9. **TIDAK ADA VALIDASI VIDEO CODEC**
**Lokasi:** `middleware/uploadMiddleware.js:25-34`

**Masalah:**
Hanya validasi file extension dan MIME type:
```javascript
const allowedFormats = ['video/mp4', 'video/avi', 'video/quicktime'];
const allowedExts = ['.mp4', '.avi', '.mov'];
```

**Dampak:**
- User bisa upload file .mp4 tapi dengan codec yang tidak kompatibel
- FFmpeg streaming akan gagal saat live
- File 5GB sudah ter-upload tapi tidak bisa digunakan

**Solusi:**
Validasi codec saat ffprobe di upload handler.

---

## 🟢 MEDIUM PRIORITY BUGS

### 10. **SQLITE INTEGER OVERFLOW UNTUK BITRATE**
**Lokasi:** `db/database.js:42`, `app.js:1235-1237`

**Masalah:**
```javascript
// In database
bitrate INTEGER,

// In upload handler
const bitrate = metadata.format.bit_rate ?
  Math.round(parseInt(metadata.format.bit_rate) / 1000) :
  null;
```

Video 5GB dengan bitrate tinggi bisa overflow jika bit_rate sudah dalam kbps.

**Dampak:**
- Bitrate salah disimpan di database
- Streaming setting tidak akurat

---

### 11. **NO CONCURRENT UPLOAD LIMIT PER USER**
**Lokasi:** `app.js:1191`

**Masalah:**
Tidak ada batasan berapa banyak upload concurrent per user.

**Dampak:**
- Satu user bisa upload 10 video 5GB sekaligus
- Memory exhaustion

**Solusi:**
Track active uploads per user, limit to 2-3 concurrent uploads.

---

### 12. **VIDEO DELETE TIDAK ATOMIC**
**Lokasi:** `models/Video.js:77-113`

**Masalah:**
```javascript
db.run('DELETE FROM videos WHERE id = ?', [id], function (err) {
  // Delete from DB first
  // Then delete files
  fs.unlinkSync(fullPath);
  fs.unlinkSync(thumbnailPath);
});
```

Jika delete file gagal, record sudah hilang dari DB tapi file masih ada.

**Dampak:**
- Orphaned files di disk
- Disk space leak

---

### 13. **STREAM RETRY LOGIC BISA LOOP INFINITELY**
**Lokasi:** `services/streamingService.js:282-310`

**Masalah:**
Max retry 3 kali, tapi retry counter bisa di-reset di tempat lain.

**Dampak:**
- Failed stream bisa retry forever
- Resource waste

---

### 14. **SESSION TIMEOUT BISA INTERRUPT UPLOAD**
**Lokasi:** `app.js:109-124`

**Masalah:**
Session maxAge 24 jam, tapi upload 5GB dengan internet lambat bisa > 24 jam.

**Dampak:**
- Upload bisa gagal karena session expired
- User harus login ulang dan restart upload

**Solusi:**
Refresh session on upload activity atau gunakan token-based auth untuk uploads.

---

### 15. **GOOGLE DRIVE IMPORT TIDAK ADA PROGRESS TRACKING**
**Lokasi:** Mentioned in exploration but not deeply analyzed

**Masalah:**
Import dari Google Drive untuk file besar tidak ada real-time progress.

**Dampak:**
- User tidak tahu status download 5GB dari Drive
- Might timeout

---

## 📊 JAWABAN PERTANYAAN: "Apakah bisa upload video 5GB?"

### ✅ **SECARA TEKNIS: YA, BISA**

1. **Body Parser Limit:** 10GB ✅
2. **Server Timeout:** 30 menit (mungkin cukup dengan koneksi cepat) ⚠️
3. **Client XHR Timeout:** 30 menit ⚠️
4. **Database:** SQLite INTEGER bisa handle 5GB ✅
5. **Storage Method:** DiskStorage (streaming, bukan buffering) ✅

### ⚠️ **TAPI ADA BANYAK RISIKO:**

1. **Tidak ada resumable upload** - Jika gagal harus restart ❌
2. **Tidak ada disk space check** - Bisa gagal 90% jalan ❌
3. **FFmpeg processing bisa hang** - No timeout ❌
4. **Session bisa expired** - Untuk upload lambat ❌
5. **Tidak ada rate limiting** - Multiple upload bisa crash server ❌

### 🎯 **SKENARIO REALISTIS:**

**Upload 5GB dengan koneksi 100 Mbps:**
- Upload time: ~7 menit ✅
- FFmpeg probe: ~1-2 menit ⚠️
- Thumbnail gen: ~30 detik - 2 menit ⚠️
- **Total: ~10 menit** - **KEMUNGKINAN BERHASIL**

**Upload 5GB dengan koneksi 10 Mbps:**
- Upload time: ~70 menit ❌ (Timeout!)
- **KEMUNGKINAN GAGAL** karena exceed 30 min timeout

**Upload 5GB dengan disk hampir penuh:**
- **PASTI GAGAL** di tengah jalan

---

## 🔧 REKOMENDASI FIX PRIORITAS

### Must Fix (Critical):
1. Tambah file size limit di multer config
2. Implementasi disk space check pre-upload
3. Tambah timeout untuk FFmpeg operations
4. Implementasi resumable upload (tus) atau tingkatkan timeout

### Should Fix (High):
5. Tambah rate limiting untuk upload endpoint
6. Validasi video codec, bukan hanya extension
7. Fix playlist concat memory issue
8. Implementasi reliable temp file cleanup

### Nice to Have (Medium):
9. Atomic file deletion
10. Concurrent upload limit per user
11. Session refresh on upload activity
12. Better error messages

---

## 📝 CATATAN TAMBAHAN

### Bugs Lain yang Ditemukan:

- **CSRF Token Check:** Bisa di-bypass di beberapa endpoint
- **File Upload Race Condition:** Filename collision bisa terjadi (meski kecil probabilitasnya)
- **No Input Sanitization:** Title dan metadata tidak di-sanitize dengan baik
- **Hardcoded Loop Count:** 1000 iterations hardcoded, harusnya configurable
- **No Health Check Endpoint:** Untuk monitoring production

---

**Kesimpulan:** Project ini **bisa** handle upload 5GB dalam kondisi ideal, tapi **sangat berisiko** gagal dalam kondisi real-world. Perlu banyak improvement untuk production-ready.
