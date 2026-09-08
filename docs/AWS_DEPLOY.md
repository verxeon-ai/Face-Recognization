# AWS Deployment Guide — AegisAI (Webcam / Phone Camera)

Browsers only allow `getUserMedia` (webcam) on **HTTPS** (or localhost).  
EC2 has **no USB webcam**, so on AWS the live sensor is your **phone browser** (or an RTSP camera). This guide deploys the app behind an **Application Load Balancer + ACM certificate** so phone camera works without self-signed cert warnings.

**Region used in this guide:** Asia Pacific (Mumbai) `ap-south-1` (matches your console).

---

## Architecture

```
Phone / Laptop browser
        │  HTTPS :443
        ▼
Application Load Balancer  ←── ACM certificate (required for webcam)
        │  HTTP :80
        ▼
EC2 (Ubuntu)  Docker Compose
   nginx:80 ─┬─→ Next.js :3000   (UI + /mobile-cam)
             └─→ Flask   :5001   (AI, MJPEG, APIs)
```

| Service | Why |
|---------|-----|
| **EC2 t3.xlarge** | PyTorch + YOLO + OpenCV need ~8–16 GB RAM |
| **ALB + ACM** | Trusted HTTPS so phone/browser camera unlocks |
| **Docker Compose** | nginx + Flask + Next.js on one instance (dev-sized) |
| **EBS gp3 40–80 GB** | Models + uploads + Docker images |

**Cost estimate (ap-south-1, always-on, approximate):**

| Resource | ~Monthly |
|----------|----------|
| EC2 t3.xlarge on-demand | ~$110–130 |
| Application Load Balancer | ~$18–25 |
| EBS 40 GB gp3 | ~$4 |
| Data transfer (light) | ~$5–15 |
| **Total** | **~$140–175 / month** |

Stop the instance when idle to cut EC2 cost. Spot instances can lower compute further.

---

## What changed in the project (cloud-ready)

- `PUBLIC_BASE_URL` — QR / phone link uses your HTTPS hostname
- `SKIP_LOCAL_WEBCAM=true` — no OpenCV device 0 on EC2
- `ENABLE_LOCAL_HTTPS_PROXY=false` — ALB replaces local `:5443` self-signed proxy
- Phone frames feed **SOC / Live Face** when no USB camera
- `/api/health` for ALB health checks
- `docker-compose.yml`, `Dockerfile.backend`, `Dockerfile.frontend`, `deploy/nginx.conf`

---

## Prerequisites

1. AWS account (your Verxeon account is fine)
2. A **domain name** you control (recommended) *or* readiness to use the ALB DNS name with an ACM cert
3. This project code on a machine that can `scp` / `git clone` to EC2
4. Key pair for SSH

---

## Step 1 — Request an ACM certificate (HTTPS)

1. Console → **Certificate Manager** → region **ap-south-1** (must be same region as ALB)
2. **Request** → public certificate
3. Domain: `aegis.yourdomain.com` (or `*.yourdomain.com`)
4. DNS validation → create the CNAME in Route 53 / your DNS
5. Wait until status is **Issued**

> Without ACM + HTTPS, phone cameras will stay blocked in modern browsers.

---

## Step 2 — Launch EC2

1. **EC2 → Launch instance**
2. Name: `aegisai`
3. AMI: **Ubuntu Server 24.04 LTS**
4. Instance type: **t3.xlarge** (4 vCPU / 16 GB)
5. Key pair: create/download `.pem`
6. Network:
   - Default VPC is OK for a first deploy
   - Auto-assign public IP: **Enable**
7. Storage: **40 GB gp3** (80 GB if you keep lots of video uploads)
8. Security group **inbound**:

| Type | Port | Source | Notes |
|------|------|--------|--------|
| SSH | 22 | Your IP only | Admin |
| HTTP | 80 | ALB SG *or* `0.0.0.0/0` temporarily | Prefer ALB-only later |
| HTTPS | 443 | — | Not needed on instance if ALB terminates TLS |

9. Launch → note **private IP** and **public IP** / Elastic IP (optional but recommended)

---

## Step 3 — Install Docker on EC2

```bash
ssh -i your-key.pem ubuntu@EC2_PUBLIC_IP

# Upload project (from your laptop), or git clone
# scp -i your-key.pem -r "/path/to/face recognization" ubuntu@EC2_PUBLIC_IP:/opt/aegisai

cd /opt/aegisai   # or wherever you placed the repo
sudo bash deploy/ec2-bootstrap.sh
# reconnect so docker group applies
exit
ssh -i your-key.pem ubuntu@EC2_PUBLIC_IP
```

---

## Step 4 — Configure environment

```bash
cd /opt/aegisai
cp deploy/env.aws.example .env.aws
nano .env.aws
```

Set at minimum:

```bash
SECRET_KEY=<long-random>
ADMIN_PASSWORD=<strong>
OPERATOR_PASSWORD=<strong>
PUBLIC_BASE_URL=https://aegis.yourdomain.com
ENABLE_LOCAL_HTTPS_PROXY=false
SKIP_LOCAL_WEBCAM=true
```

`PUBLIC_BASE_URL` must match the HTTPS hostname users open (same as ACM).

---

## Step 5 — Build and run

```bash
cd /opt/aegisai
docker compose --env-file .env.aws up -d --build
docker compose ps
curl -s http://127.0.0.1/api/health
```

First build downloads PyTorch/models and can take **15–30+ minutes**.

---

## Step 6 — Application Load Balancer + HTTPS

1. **EC2 → Target Groups → Create**
   - Type: Instances
   - Protocol: **HTTP**
   - Port: **80**
   - VPC: same as instance
   - Health check path: **`/api/health`**
   - Healthy threshold: 2, interval: 30s
   - Register your EC2 instance on port 80

2. **EC2 → Load Balancers → Application Load Balancer**
   - Scheme: Internet-facing
   - IP: IPv4
   - AZs: pick at least 2 (required)
   - Security group: allow **443** and **80** from `0.0.0.0/0`
   - Listeners:
     - **HTTPS:443** → forward to target group (select ACM cert)
     - **HTTP:80** → redirect to HTTPS
   - Create

3. Tighten **EC2 security group**: allow port **80 only from the ALB security group** (remove public :80 if you opened it).

4. DNS:
   - Route 53 / registrar: **A/ALIAS** or **CNAME** `aegis.yourdomain.com` → ALB DNS name
   - Wait for propagation

5. Update `.env.aws` if needed:

```bash
PUBLIC_BASE_URL=https://aegis.yourdomain.com
docker compose --env-file .env.aws up -d
```

---

## Step 7 — Verify webcam (phone) flow

1. Open `https://aegis.yourdomain.com` on a laptop → login / role as usual  
2. Go to **Mobile Streamer**  
3. Scan the QR (should be `https://aegis.yourdomain.com/mobile-cam` — **no :5443**, no cert warning)  
4. On phone: **Allow Camera**  
5. Dashboard shows live feed; **SOC** and **Live Face** also consume that phone feed on AWS  

Image / video upload triage works over the same HTTPS origin without a camera.

---

## Optional: Elastic IP

EC2 → Elastic IPs → Allocate → Associate to the instance. Useful if you SSH often; ALB DNS is what users should bookmark.

---

## Optional: RTSP / IP cameras

If you have an IP camera URL, use the cameras API (Admin) to set an RTSP source instead of relying on phone. Phone remains the zero-hardware cloud option.

---

## Operations cheatsheet

```bash
# Logs
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f nginx

# Restart after .env.aws change
docker compose --env-file .env.aws up -d

# Update code
git pull   # or scp new files
docker compose --env-file .env.aws up -d --build

# Stop to save money
docker compose down
# Then EC2 → Stop instance (ALB still bills a little)
```

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| Phone camera blocked / “Only secure origins” | Use HTTPS via ALB+ACM; `PUBLIC_BASE_URL` must be `https://…` |
| QR still shows LAN IP / `:5443` | Set `PUBLIC_BASE_URL` and recreate containers |
| ALB target unhealthy | Check `curl localhost/api/health` on EC2; SG allows ALB → :80 |
| Backend OOM / killed | Use t3.xlarge+; check `dmesg \| grep -i kill` |
| Build fails on torch | Ensure instance has enough disk (40 GB+) and internet |
| Blank MJPEG streams | Confirm nginx `proxy_buffering off` (already in `deploy/nginx.conf`) |
| Role passwords not working | Secrets only load from `.env.aws` env_file — rebuild/recreate |

---

## Security checklist

- [ ] Change `SECRET_KEY`, `ADMIN_PASSWORD`, `OPERATOR_PASSWORD`
- [ ] SSH only from your IP
- [ ] EC2 :80 only from ALB security group
- [ ] HTTPS redirect on ALB
- [ ] Do not commit `.env` / `.env.aws`
- [ ] Prefer a custom domain + ACM over raw ALB HTTP

---

## Local vs AWS camera modes

| Mode | Camera | HTTPS |
|------|--------|-------|
| Laptop (`python app.py`) | USB webcam + phone via `:5443` self-signed | Local proxy |
| AWS (this guide) | Phone `/mobile-cam` or RTSP | ALB + ACM |

Local development is unchanged: keep `ENABLE_LOCAL_HTTPS_PROXY=true` and omit `PUBLIC_BASE_URL`.
