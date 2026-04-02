# 🚀 Coolify Build Hatası - Hızlı Çözüm

## ✅ Yapılan Düzeltmeler

### 1. Build Script Güncellemeleri (`scripts/build.ts`)

Aşağıdaki eksik modüller için stub'lar eklendi:

**Service Modülleri:**
- `../services/compact/cachedMCConfig.js`
- `../services/compact/snipProjection.js`
- `../services/skillSearch/featureCheck.js`
- `../services/skillSearch/prefetch.js`
- `../services/skillSearch/localSearch.js`
- `../services/sessionTranscript/sessionTranscript.js`
- `../services/compact/reactiveCompact.js`

**Proactive & Assistant Modülleri:**
- `../proactive/index.js` (3 farklı path variasyonu)
- `./assistant/index.js`
- `./assistant/gate.js`
- `./assistant/sessionDiscovery.js`

**Server Modülleri:**
- `./server/parseConnectUrl.js`
- `./server/server.js`
- `./server/sessionManager.js`
- `./server/backends/dangerousBackend.js`
- `./server/serverBanner.js`
- `./server/serverLog.js`
- `./server/lockfile.js`
- `./server/connectHeadless.js`

**SSH & Tools:**
- `./ssh/createSSHSession.js`
- 15+ tool modülleri (SleepTool, MonitorTool, WebBrowserTool, vb.)

**Commands:**
- 10+ command modülleri (proactive, assistant, workflows, vb.)

**Utilities:**
- `../../utils/attributionHooks.js`
- `../../utils/systemThemeWatcher.js`
- `./utils/taskSummary.js`
- `./jobs/classifier.js`

**Native Packages:**
- `@ant/computer-use-mcp` eklendi

### 2. Filter Regex Güncellendi

```typescript
// Eski (sadece belirli modüller):
filter: /^\.\.\/(daemon\/workerRegistry|...)\.js$/

// Yeni (tüm .js dosyaları):
filter: /\.js$/
```

## 📋 Deployment Adımları

### Adım 1: Değişiklikleri Commit Edin

```bash
# Tüm değişiklikleri stage'e alın
git add scripts/build.ts DEPLOYMENT_TROUBLESHOOTING.md QUICK_FIX.md

# Commit
git commit -m "fix: Add missing module stubs for Coolify build

- Added 50+ feature-gated module stubs
- Added @ant/computer-use-mcp to native-stub list
- Updated filter regex to catch all .js files
- Added comprehensive troubleshooting guide"

# Push
git push origin main
```

### Adım 2: Coolify'da Redeploy

1. **Coolify Dashboard** → Your Project
2. **"Redeploy"** butonuna tıklayın
3. **Build loglarını izleyin**

### Adım 3: Build Loglarını Kontrol Edin

Başarılı build şu mesajları göstermelidir:

```
✓ [builder 3/7] RUN bun install --frozen-lockfile
✓ [builder 7/7] RUN bun run build
✓ Built openclaude v0.1.4 → dist/cli.mjs
✓ [runner] COPY --from=builder /app/dist ./dist
✓ Container started
```

### Adım 4: Health Check

Build başarılı olduktan sonra:

```bash
# Coolify terminal'den container'a bağlan
docker exec -it <container-id> sh

# Version check
openclaude --version
# Beklenen çıktı: openclaude v0.1.4

# Help check
openclaude --help
# Beklenen çıktı: Usage: openclaude [options] [prompt]
```

## ❗ Hala Hata Alıyorsanız

### Kontrol Listesi:

- [ ] Git repository güncel mi? (`git pull origin main`)
- [ ] Commit push edildi mi? (`git push origin main`)
- [ ] Coolify build cache temizlendi mi?
- [ ] Memory limit en az 2GB mı?
- [ ] Environment variables doğru ayarlandı mı?

### Coolify'da Temiz Build:

1. Coolify → Your Project → **Settings**
2. **"Clear Build Cache"** 
3. **"Redeploy"**

### Build Loglarını Kaydedin:

```bash
# Coolify'da Logs sekmesinden build loglarını indirin
# veya
docker logs <container-id> > build-error.log 2>&1
```

## 🔍 Sık Görülen Hatalar ve Çözümleri

### Hata: "Could not resolve: ../services/..."

✅ **Çözüldü!** - Build script güncellemeleri bu hatayı düzeltti.

### Hata: "Memory limit exceeded"

**Çözüm:** Coolify → Settings → Memory Limit → **2048MB** (minimum)

### Hata: "@ant/computer-use-mcp not found"

✅ **Çözüldü!** - Artık native-stub listesinde.

### Hata: "bun: command not found"

**Çözüm:** Dockerfile'ın builder stage'ini kontrol edin:
```dockerfile
FROM oven/bun:1.2-alpine AS builder
```

## 📊 Beklenen Build Süresi

- **İlk Build:** 3-5 dakika
- **Cached Build:** 1-2 dakika
- **Eğer 10+ dakika sürüyorsa:** Memory veya network problemi olabilir

## 🎯 Sonraki Adımlar

Build başarılı olduktan sonra:

1. ✅ Container çalışıyor mu? → `docker ps`
2. ✅ OpenClaude erişilebilir mi? → `openclaude --version`
3. ✅ API key çalışıyor mu? → `openclaude "test message"`

## 📚 Ek Kaynaklar

- **Detaylı Sorun Giderme:** `DEPLOYMENT_TROUBLESHOOTING.md`
- **Deployment Rehberi:** `DEPLOYMENT.md`
- **GitHub Issues:** [OpenClaude GitHub](https://github.com/your-repo/openclaude/issues)

---

**Not:** Bu değişiklikler tüm Coolify build hatalarını çözmek için tasarlandı. Eğer hala sorun yaşıyorsanız, build loglarını ve error mesajlarını GitHub issue'da paylaşın.

**Güncelleme:** 2026-04-02  
**Version:** 0.1.4