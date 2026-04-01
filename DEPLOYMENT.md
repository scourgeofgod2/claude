# 🚀 OpenClaude Coolify Deployment Rehberi

Bu rehber, OpenClaude'u Coolify platformunda Docker container olarak deploy etmeniz için gereken tüm adımları içerir.

## 📋 İçindekiler

1. [Gereksinimler](#gereksinimler)
2. [Hızlı Başlangıç](#hızlı-başlangıç)
3. [Coolify'da Deployment](#coolifyde-deployment)
4. [Environment Variables Yapılandırması](#environment-variables-yapılandırması)
5. [Container'a Erişim](#containera-erişim)
6. [Kullanım Örnekleri](#kullanım-örnekleri)
7. [Sorun Giderme](#sorun-giderme)
8. [İleri Seviye Yapılandırma](#ileri-seviye-yapılandırma)

---

## 🔧 Gereksinimler

- Coolify instance (self-hosted veya cloud)
- API key (OpenAI, DeepSeek, Gemini vb.)
- Git repository (GitHub, GitLab, Gitea vb.)
- En az 2GB RAM (önerilen 4GB)
- En az 2 CPU core

---

## ⚡ Hızlı Başlangıç

### 1. Repository'yi Hazırlayın

Projenizi Git repository'sine pushlayın (tüm Docker dosyaları dahil):

```bash
git add Dockerfile docker-compose.yml .dockerignore entrypoint.sh .env.example
git commit -m "Add Coolify deployment files"
git push origin main
```

### 2. Coolify'da Yeni Proje Oluşturun

1. Coolify dashboard'a gidin
2. **"+ New Resource"** → **"Docker Compose"** seçin
3. Repository URL'inizi girin
4. Branch'i seçin (main, master vb.)
5. **"docker-compose.yml"** dosyasını seçin

---

## 🌐 Coolify'da Deployment

### Adım 1: Proje Oluşturma

1. **Resource Type:** Docker Compose
2. **Source:** Git Repository
3. **Repository URL:** `https://github.com/your-username/openclaude.git`
4. **Branch:** `main`
5. **Docker Compose Location:** `./docker-compose.yml`

### Adım 2: Environment Variables

Coolify UI'da **Environment Variables** sekmesine gidin ve aşağıdaki değişkenleri ekleyin:

#### OpenAI Provider için (Önerilen):

```env
CLAUDE_CODE_USE_OPENAI=1
OPENAI_API_KEY=sk-your-actual-key-here
OPENAI_MODEL=gpt-4o
OPENAI_BASE_URL=https://api.openai.com/v1
```

#### DeepSeek için:

```env
CLAUDE_CODE_USE_OPENAI=1
OPENAI_API_KEY=sk-your-deepseek-key
OPENAI_BASE_URL=https://api.deepseek.com/v1
OPENAI_MODEL=deepseek-chat
```

#### Ollama (Local) için:

```env
CLAUDE_CODE_USE_OPENAI=1
OPENAI_BASE_URL=http://host.docker.internal:11434/v1
OPENAI_MODEL=llama3.3:70b
```

> **Not:** Ollama kullanıyorsanız, `docker-compose.yml` içinde `network_mode: host` ayarını aktif etmeniz gerekebilir.

### Adım 3: Persistent Storage

Coolify volumes'i otomatik olarak yönetir, ancak manuel yapılandırmak isterseniz:

1. **Volumes** sekmesine gidin
2. Aşağıdaki mount path'leri ekleyin:
   - `/root/.openclaude` → OpenClaude config
   - `/workspace` → Çalışma dizini

### Adım 4: Deploy

1. **"Deploy"** butonuna tıklayın
2. Build loglarını izleyin
3. Container başarıyla başladığında "Running" durumunu göreceksiniz

---

## 🔐 Environment Variables Yapılandırması

### Tüm Provider'lar için Değişkenler

| Variable | Zorunlu | Açıklama | Örnek |
|----------|---------|----------|-------|
| `CLAUDE_CODE_USE_OPENAI` | ✅ | OpenAI provider'ı aktifleştir | `1` |
| `OPENAI_API_KEY` | ⚠️* | API anahtarı (*local değilse) | `sk-...` |
| `OPENAI_MODEL` | ✅ | Kullanılacak model | `gpt-4o` |
| `OPENAI_BASE_URL` | ❌ | API endpoint | `https://api.openai.com/v1` |
| `NODE_ENV` | ❌ | Node ortamı | `production` |
| `TZ` | ❌ | Timezone | `Europe/Istanbul` |

### Provider Örnekleri

<details>
<summary><b>OpenAI (GPT-4o)</b></summary>

```env
CLAUDE_CODE_USE_OPENAI=1
OPENAI_API_KEY=sk-proj-...
OPENAI_MODEL=gpt-4o
```
</details>

<details>
<summary><b>DeepSeek</b></summary>

```env
CLAUDE_CODE_USE_OPENAI=1
OPENAI_API_KEY=sk-...
OPENAI_BASE_URL=https://api.deepseek.com/v1
OPENAI_MODEL=deepseek-chat
```
</details>

<details>
<summary><b>Google Gemini (OpenRouter)</b></summary>

```env
CLAUDE_CODE_USE_OPENAI=1
OPENAI_API_KEY=sk-or-...
OPENAI_BASE_URL=https://openrouter.ai/api/v1
OPENAI_MODEL=google/gemini-2.0-flash
```
</details>

<details>
<summary><b>Codex (ChatGPT Backend)</b></summary>

```env
CLAUDE_CODE_USE_OPENAI=1
OPENAI_MODEL=codexplan
CODEX_API_KEY=your-codex-token
```
</details>

<details>
<summary><b>Groq</b></summary>

```env
CLAUDE_CODE_USE_OPENAI=1
OPENAI_API_KEY=gsk-...
OPENAI_BASE_URL=https://api.groq.com/openai/v1
OPENAI_MODEL=llama-3.3-70b-versatile
```
</details>

---

## 🔌 Container'a Erişim

### Yöntem 1: Coolify Terminal

1. Coolify dashboard'da projenize gidin
2. **"Terminal"** veya **"Console"** sekmesine tıklayın
3. Terminal açılacak, ardından:

```bash
openclaude
```

### Yöntem 2: Docker Exec (SSH ile)

Sunucunuza SSH ile bağlanın:

```bash
# Container'ın adını bulun
docker ps | grep openclaude

# Container içine girin
docker exec -it openclaude bash

# OpenClaude'u çalıştırın
openclaude
```

### Yöntem 3: Doğrudan Komut Çalıştırma

Container içine girmeden:

```bash
docker exec -it openclaude openclaude
```

---

## 💡 Kullanım Örnekleri

### Örnek 1: Basit Sohbet

```bash
docker exec -it openclaude openclaude
```

Ardından bir görev verin:
```
Create a simple Python calculator script
```

### Örnek 2: Dosya İşlemleri

Container içinde `/workspace` dizininde çalışabilirsiniz:

```bash
docker exec -it openclaude bash
cd /workspace
openclaude
```

Görev:
```
Create a React todo app with TypeScript
```

### Örnek 3: Git Repository ile Çalışma

```bash
docker exec -it openclaude bash
cd /workspace
git clone https://github.com/your-username/your-project.git
cd your-project
openclaude
```

Görev:
```
Add unit tests to the authentication module
```

### Örnek 4: Volume Mount ile Local Proje

`docker-compose.yml` dosyasında volumes bölümünü güncelleyin:

```yaml
volumes:
  - openclaude_config:/root/.openclaude
  - openclaude_workspace:/workspace
  - ./your-local-project:/workspace/project:rw  # YENİ
```

Ardından:

```bash
docker exec -it openclaude bash
cd /workspace/project
openclaude
```

---

## 🔍 Sorun Giderme

### Container Başlamıyor

**Sorun:** Container "Exited" durumunda

**Çözüm:**
```bash
# Logları kontrol edin
docker logs openclaude

# Build hatalarını kontrol edin
docker-compose logs openclaude
```

### API Key Hatası

**Sorun:** `OPENAI_API_KEY is not set` uyarısı

**Çözüm:**
1. Coolify UI'da Environment Variables'ı kontrol edin
2. API key'in doğru olduğundan emin olun
3. Container'ı yeniden başlatın

```bash
docker-compose restart openclaude
```

### Model Bulunamadı

**Sorun:** `Model not found` hatası

**Çözüm:**
1. `OPENAI_MODEL` değişkeninin doğru olduğundan emin olun
2. Provider'ınızın desteklediği modeli kullanın
3. Ollama kullanıyorsanız, modelin pull edildiğinden emin olun:

```bash
ollama pull llama3.3:70b
```

### Volume Permission Hatası

**Sorun:** `/workspace` veya `/root/.openclaude` yazma hatası

**Çözüm:**
```bash
docker exec -it openclaude bash
chmod -R 777 /workspace
chmod -R 777 /root/.openclaude
```

### Connection Refused (Ollama)

**Sorun:** Local Ollama'ya bağlanamıyor

**Çözüm:**
1. `docker-compose.yml` içinde `network_mode: host` kullanın
2. Veya `host.docker.internal` yerine sunucu IP'sini kullanın:

```env
OPENAI_BASE_URL=http://192.168.1.100:11434/v1
```

### Container Sürekli Restart Oluyor

**Sorun:** Container health check fail

**Çözüm:**
```bash
# Health check'i devre dışı bırakın (geçici)
# docker-compose.yml içinde healthcheck bölümünü comment out edin

# Veya openclaude'un çalıştığını manuel kontrol edin
docker exec -it openclaude openclaude --version
```

---

## ⚙️ İleri Seviye Yapılandırma

### Resource Limits

`docker-compose.yml` içinde:

```yaml
deploy:
  resources:
    limits:
      cpus: '4'        # 4 CPU core
      memory: 4G       # 4GB RAM
    reservations:
      cpus: '1'
      memory: 1G
```

### Custom Entrypoint

Kendi startup script'inizi kullanmak için:

```bash
# my-entrypoint.sh
#!/bin/bash
echo "Custom initialization..."
source /entrypoint.sh
```

`Dockerfile` içinde:
```dockerfile
COPY my-entrypoint.sh /my-entrypoint.sh
RUN chmod +x /my-entrypoint.sh
ENTRYPOINT ["/my-entrypoint.sh"]
```

### Multiple Model Support

Birden fazla model kullanmak için:

```bash
# Model 1 ile çalıştır
docker exec -e OPENAI_MODEL=gpt-4o -it openclaude openclaude

# Model 2 ile çalıştır
docker exec -e OPENAI_MODEL=gpt-4o-mini -it openclaude openclaude
```

### Scheduled Tasks (Cron)

Container içinde cron job eklemek için:

```bash
docker exec -it openclaude bash

# Cron job ekle
crontab -e

# Örnek: Her gün saat 02:00'de backup
0 2 * * * cd /workspace && openclaude "Create a backup of all project files"
```

### Persistent Bash History

`.bashrc` dosyası oluşturun ve volume mount edin:

```yaml
volumes:
  - ./custom-bashrc:/root/.bashrc:ro
```

### Logging

Daha detaylı logging için:

```yaml
logging:
  driver: "json-file"
  options:
    max-size: "50m"
    max-file: "5"
    labels: "openclaude"
```

Logları görüntülemek:

```bash
docker logs -f --tail 100 openclaude
```

---

## 📊 Monitoring

### Health Check

Container sağlığını kontrol edin:

```bash
docker inspect openclaude | grep -A 10 Health
```

### Resource Usage

```bash
# CPU ve Memory kullanımı
docker stats openclaude

# Detaylı istatistikler
docker inspect openclaude
```

### Coolify Monitoring

Coolify dashboard'da:
1. Projenize gidin
2. **"Metrics"** sekmesine tıklayın
3. CPU, Memory, Network kullanımını görüntüleyin

---

## 🔄 Güncelleme

Container'ı güncellemek için:

```bash
# Yeni değişiklikleri pull edin
cd /path/to/openclaude
git pull origin main

# Container'ı yeniden build ve başlatın
docker-compose down
docker-compose up -d --build
```

Coolify üzerinden:
1. **"Redeploy"** butonuna tıklayın
2. Build işlemi otomatik başlayacak

---

## 🛡️ Güvenlik

### API Key Güvenliği

- API key'leri **asla** public repository'ye commit etmeyin
- Coolify'ın **Secrets** özelliğini kullanın
- Production'da farklı key'ler kullanın

### Container Güvenliği

- Non-root user kullanmayı düşünün (Dockerfile'da commented)
- Network izolasyonu yapın
- Gereksiz portları expose etmeyin

### Volume Permissions

```bash
# Sadece owner'a read/write
chmod 700 /root/.openclaude

# Workspace için group access
chmod 770 /workspace
```

---

## 📞 Destek

Sorunlarınız için:

1. GitHub Issues: [OpenClaude Repository](https://github.com/your-username/openclaude/issues)
2. Coolify Docs: [https://coolify.io/docs](https://coolify.io/docs)
3. Docker Docs: [https://docs.docker.com](https://docs.docker.com)

---

## 📝 Notlar

- Container ilk başlatıldığında build işlemi ~5-10 dakika sürebilir
- Ollama gibi local provider'lar için network ayarlarına dikkat edin
- Persistent volume'ler sayesinde config ve memory kaybı olmaz
- Health check başarısız olursa container restart edilir

---

## ✅ Checklist

Deployment öncesi kontrol listesi:

- [ ] Git repository hazır
- [ ] Tüm Docker dosyaları commit edildi
- [ ] Environment variables ayarlandı
- [ ] API key test edildi
- [ ] Volume mount path'leri belirlendi
- [ ] Resource limits ayarlandı
- [ ] Health check çalışıyor
- [ ] Container erişimi test edildi

---

**Başarılı deploymentlar! 🎉**