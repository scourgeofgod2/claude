# 🐛 OpenClaude Coolify Deployment - Sorun Giderme

Bu dosya, Coolify üzerinde OpenClaude deploy ederken karşılaşabileceğiniz yaygın sorunları ve çözümlerini içerir.

## 🔴 Build Hataları

### Hata 1: "Could not resolve" Module Hatası

```
error: Could not resolve: "../services/compact/cachedMCConfig.js"
error: Could not resolve: "../proactive/index.js"
error: Could not resolve: "./assistant/index.js"
```

**Neden:**
- Build script'indeki stub modüller eksik veya yanlış yapılandırılmış
- TypeScript dosyaları JavaScript'e compile edilememiş

**Çözüm:**

1. **Repository'yi güncelleyin:**
   ```bash
   git pull origin main
   ```

2. **scripts/build.ts dosyasını kontrol edin:**
   - Tüm feature-gated modüller için stub'lar olmalı
   - `internalFeatureStubModules` Map'i güncel olmalı

3. **Build script'inin son versiyonunu kullandığınızdan emin olun:**
   - `@ant/computer-use-mcp` gibi eksik paketler stub'lanmalı
   - Filter regex doğru çalışmalı: `filter: /\.js$/`

4. **Coolify'da temiz build:**
   ```bash
   # Coolify'da "Clear Build Cache" → "Rebuild"
   ```

### Hata 2: "@ant/computer-use-mcp" Bulunamadı

```
error: Could not resolve: "@ant/computer-use-mcp". Maybe you need to "bun install"?
```

**Neden:**
- Package native stub listesinde değil

**Çözüm:**

`scripts/build.ts` dosyasında şu satırı ekleyin:

```typescript
for (const mod of [
  'audio-capture-napi',
  // ... diğer modüller
  '@ant/computer-use-mcp',  // ← Bu satırı ekleyin
  '@anthropic-ai/sandbox-runtime',
  // ...
]) {
```

### Hata 3: Bun Build Başarısız Oluyor

```
error: script "build" exited with code 1
```

**Neden:**
- Bun sürümü uyumsuz
- Dependencies düzgün yüklenmemiş

**Çözüm:**

1. **Dockerfile'da Bun versiyonunu kontrol edin:**
   ```dockerfile
   FROM oven/bun:1.2-alpine AS builder
   ```

2. **Frozen lockfile kullanın:**
   ```dockerfile
   RUN bun install --frozen-lockfile
   ```

3. **Build loglarını inceleyin:**
   - Coolify'da build loglarını tam olarak okuyun
   - Hangi modülde fail ettiğini tespit edin

### Hata 4: Memory Limit Aşıldı

```
ERROR: failed to build: process exited with code 137
```

**Neden:**
- Build sırasında RAM yetersiz

**Çözüm:**

Coolify'da:
1. Resource Limits → Memory Limit → **En az 2GB** (önerilen 4GB)
2. Build Settings → Memory → **2048MB**

### Hata 5: Dependencies Yüklenemedi

```
error: Failed to install dependencies
```

**Neden:**
- Network problemi
- bun.lock dosyası güncel değil

**Çözüm:**

1. **Local'de test edin:**
   ```bash
   bun install --frozen-lockfile
   bun run build
   ```

2. **bun.lock'u güncelleyin:**
   ```bash
   bun install
   git add bun.lock
   git commit -m "Update bun.lock"
   git push
   ```

## 🟡 Runtime Hataları

### Hata 1: "openclaude: command not found"

**Neden:**
- Binary PATH'e eklenmemiş
- Symlink oluşturulmamış

**Çözüm:**

Container içinde:
```bash
# Binary'i kontrol et
ls -la /app/bin/openclaude

# Symlink'i kontrol et
ls -la /usr/local/bin/openclaude

# Manuel symlink oluştur
ln -sf /app/bin/openclaude /usr/local/bin/openclaude

# Test et
openclaude --version
```

### Hata 2: OpenAI API Hatası

```
Error: Invalid API key
```

**Neden:**
- Environment variable eksik veya yanlış

**Çözüm:**

```bash
# Container içinde env var'ları kontrol et
docker exec -it <container-id> env | grep OPENAI

# Doğru formatta olmalı:
# OPENAI_API_KEY=sk-proj-xxxxx
# CLAUDE_CODE_USE_OPENAI=1

# Test et
docker exec -it <container-id> openclaude "test message"
```

### Hata 3: dist/cli.mjs Bulunamadı

```
Error: Cannot find module '/app/dist/cli.mjs'
```

**Neden:**
- Build stage tamamlanmamış
- Files kopyalanmamış

**Çözüm:**

1. **Build loglarını kontrol edin:**
   ```
   ✓ Built openclaude v0.1.4 → dist/cli.mjs
   ```

2. **Container içinde kontrol edin:**
   ```bash
   docker exec -it <container-id> ls -la /app/dist/
   # cli.mjs ve cli.mjs.map olmalı
   ```

3. **Dockerfile'da COPY komutunu kontrol edin:**
   ```dockerfile
   COPY --from=builder /app/dist ./dist
   ```

## 🔵 Coolify Spesifik Sorunlar

### Sorun 1: Build Her Defasında Baştan Başlıyor

**Çözüm:**
- Coolify → Settings → Build Cache → **Enable Build Cache**
- Docker layer caching aktif olmalı

### Sorun 2: Environment Variables Uygulanmıyor

**Çözüm:**
1. Coolify UI'da değişkenleri kontrol edin
2. "Restart" yerine **"Redeploy"** kullanın
3. `.env` dosyası kullanmayın, Coolify UI'dan tanımlayın

### Sorun 3: Volume Mount Çalışmıyor

**Çözüm:**
```yaml
# docker-compose.yml'de volumes doğru tanımlanmalı:
volumes:
  - openclaude-config:/root/.openclaude
  - openclaude-workspace:/workspace

volumes:
  openclaude-config:
  openclaude-workspace:
```

## 🟢 Best Practices

### ✅ Başarılı Deployment için Checklist

- [ ] Repository güncel (son build script)
- [ ] bun.lock dosyası mevcut
- [ ] Environment variables ayarlandı
- [ ] Memory limit en az 2GB
- [ ] Build cache aktif
- [ ] Volumes yapılandırıldı
- [ ] API keys test edildi
- [ ] Health check passing

### 🔍 Debug Komutları

```bash
# Container içinde debug
docker exec -it <container-id> sh

# Sistem bilgisi
node --version  # v20+
bun --version   # Builder stage'de

# OpenClaude kontrolü
which openclaude
openclaude --version
openclaude --help

# Dosya kontrolü
ls -la /app/
ls -la /app/dist/
ls -la /app/bin/

# Environment kontrolü
env | grep -i claude
env | grep -i openai

# Process kontrolü
ps aux | grep node
```

### 📊 Monitoring

Build süresini takip edin:

```
Beklenen Build Süresi:
- İlk build: 3-5 dakika
- Cached build: 1-2 dakika

Eğer 10+ dakika sürüyorsa:
- Memory yetersiz olabilir
- Network yavaş olabilir
- Dependencies problem yaşıyor olabilir
```

## 🆘 Hala Sorun mu Yaşıyorsunuz?

### 1. Logları Toplayın

```bash
# Build loglarını kaydedin
# Coolify → Logs → Download

# Container loglarını alın
docker logs <container-id> > container.log 2>&1

# System info
docker exec -it <container-id> sh -c "
  echo '=== System Info ===' &&
  uname -a &&
  node --version &&
  ls -la /app/ &&
  ls -la /app/dist/ &&
  env | grep -i 'claude\|openai'
" > system-info.txt
```

### 2. Minimal Test

En basit konfigürasyonla test edin:

```yaml
# docker-compose.minimal.yml
version: '3.8'
services:
  openclaude:
    build: .
    environment:
      - CLAUDE_CODE_USE_OPENAI=1
      - OPENAI_API_KEY=${OPENAI_API_KEY}
    command: openclaude --version
```

### 3. GitHub Issues

Sorun devam ediyorsa:

1. GitHub'da yeni bir issue açın
2. Şunları ekleyin:
   - Build logları
   - Container logları
   - System info
   - docker-compose.yml
   - Dockerfile (eğer özelleştirilmişse)

### 4. Community Support

- Coolify Discord/Forum
- OpenClaude GitHub Discussions
- Stack Overflow (`#openclaude` tag)

## 📚 Ek Kaynaklar

- [Dockerfile Best Practices](https://docs.docker.com/develop/develop-images/dockerfile_best-practices/)
- [Bun Documentation](https://bun.sh/docs)
- [Coolify Documentation](https://coolify.io/docs)
- [OpenClaude README](../README.md)

---

**Son Güncelleme:** 2026-04-02  
**OpenClaude Version:** 0.1.4  
**Bun Version:** 1.2.23  
**Node Version:** 20+