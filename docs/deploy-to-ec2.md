# Deploying LabScan to AWS EC2 (Beginner Guide)

This guide walks you through putting the LabScan API (Node.js + Express + Prisma/PostgreSQL) on a fresh AWS EC2 server, from zero to a running, auto-restarting service. No prior AWS experience assumed.

LabScan facts used in this guide:
- Runs on **Node.js**, written in TypeScript, built with `npm run build` → `dist/server.js`
- Listens on **port 8082** by default (`PORT` env var)
- Uses **PostgreSQL** via Prisma (`DATABASE_URL` env var)
- Process is kept alive with **PM2** (`ecosystem.config.js` is already in the repo)
- API is mounted at `/api/v1/labscan` (namespaced so the Uyir api-gateway can route it by prefix)

> **Fastest path**: if you just want push-to-deploy working, read [section 10](#10-cicd-fully-automatic-deploy-on-push-to-main) — the CI/CD pipeline now bootstraps a bare EC2 box itself (installs Node/git/PM2, clones the repo, writes `.env`). Sections 1–9 below are the manual walkthrough, useful for understanding what's happening under the hood, doing a one-off deploy without CI, or setting up the database/Nginx/HTTPS pieces the pipeline doesn't touch.

---

## 1. Launch an EC2 instance

1. Log into the [AWS Console](https://console.aws.amazon.com/) → search **EC2** → **Launch instance**.
2. **Name**: `labscan-server` (or anything you like).
3. **AMI (OS image)**: any modern Linux works. **Amazon Linux 2023** (default user `ec2-user`) or **Ubuntu Server 22.04/24.04** (default user `ubuntu`). Avoid **Amazon Linux 2** — its glibc is too old for Node.js 22. Commands below show both package managers; examples use `ec2-user` — substitute `ubuntu` if you chose Ubuntu.
4. **Instance type**: `t3.micro` is fine to start (free-tier eligible in most accounts).
5. **Key pair**: click **Create new key pair**, name it `labscan-key`, type RSA, format `.pem`. Download it — you cannot re-download it later. Keep it safe; it's how you SSH in.
6. **Network settings** → click **Edit** and add these inbound rules:
   - **SSH**, port 22, source: **My IP** (safer than 0.0.0.0/0)
   - **Custom TCP**, port 8082, source: **Anywhere (0.0.0.0/0)** — only if you want to hit the API directly on this port. If you'll put Nginx in front (recommended, see step 6), instead open **HTTP (80)** and, later, **HTTPS (443)** to Anywhere, and keep 8082 closed to the internet.
7. Storage: default 8 GB is enough to start.
8. Click **Launch instance**.

Once it's running, note its **Public IPv4 address** from the instance list.

---

## 2. Connect to the instance

On Windows, using Git Bash / WSL / PowerShell with OpenSSH:

```bash
chmod 400 /path/to/labscan-key.pem   # skip on plain PowerShell, not needed
ssh -i /path/to/labscan-key.pem ec2-user@<EC2_PUBLIC_IP>   # or ubuntu@ on Ubuntu
```

If you're on plain Windows PowerShell, `ssh` is built in (Windows 10/11) — just run the same `ssh -i ...` command from PowerShell.

You should land at an `[ec2-user@ip-... ~]$` (or `ubuntu@ip-...:~$`) prompt.

---

## 3. Install system dependencies

Run these on the **EC2 instance** (not your local machine):

**Amazon Linux 2023 / RHEL-family:**

```bash
sudo dnf update -y
curl -fsSL https://rpm.nodesource.com/setup_22.x | sudo bash -
sudo dnf install -y nodejs git
```

**Ubuntu / Debian:**

```bash
sudo apt update && sudo apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs git
```

Then, on either:

```bash
node -v   # should print v22.x

# PM2 - keeps the app running and restarts it on crash / reboot
sudo npm install -g pm2
```

### Install PostgreSQL

You have two options — pick one:

**Option A: Managed database (recommended for real use)** — create a PostgreSQL instance in **Amazon RDS** instead of installing it on the same server. This keeps your data safe if you ever destroy/rebuild the EC2 instance, and is the standard production setup. You'll get a connection endpoint to put in `DATABASE_URL` later. (AWS Console → RDS → Create database → PostgreSQL → pick a small/free-tier instance class → set a master password → note the endpoint hostname.) Make sure its security group allows inbound port 5432 from your EC2 instance's security group.

**Option B: PostgreSQL on the same EC2 box (simpler, fine for testing/small deployments)**:

```bash
sudo apt install -y postgresql postgresql-contrib          # Ubuntu
# Amazon Linux 2023 instead:
# sudo dnf install -y postgresql15-server && sudo postgresql-setup --initdb && sudo systemctl enable --now postgresql

sudo -u postgres psql -c "CREATE USER labscan WITH PASSWORD 'choose-a-strong-password';"
sudo -u postgres psql -c "CREATE DATABASE labscan OWNER labscan;"
```

Your `DATABASE_URL` in this case will be:
```
postgresql://labscan:choose-a-strong-password@localhost:5432/labscan
```

---

## 4. Get the code onto the server

Still on the EC2 instance:

```bash
cd ~
git clone <your-repo-url> labscan
cd labscan
```

If the repo is private, either use a GitHub personal access token in the clone URL, or set up a deploy key (`ssh-keygen` on the server, add the public key to the GitHub repo's Deploy Keys).

---

## 5. Configure environment variables

```bash
cp .env.example .env
nano .env
```

Fill in real values:

```
NODE_ENV=production
PORT=8082
LOG_LEVEL=info
KAFKA_BROKERS=localhost:9092
KAFKA_CLIENT_ID=labscan-service
KAFKA_GROUP_ID=labscan-service-group

DATABASE_URL=postgresql://labscan:choose-a-strong-password@localhost:5432/labscan
```

(If you used RDS, replace `localhost` with the RDS endpoint hostname, and use the master user/password you set there.)

Save and exit nano with `Ctrl+O`, `Enter`, then `Ctrl+X`.

---

## 6. Install, build, and migrate

```bash
npm ci
npx prisma generate --config prisma7.config.ts
npx prisma migrate deploy --config prisma7.config.ts
npm run build
```

- `npm ci` installs exact dependency versions from `package-lock.json`.
- `prisma generate` builds the Prisma client used by the app code. The `--config prisma7.config.ts` flag is required on every Prisma command: Prisma does not auto-detect that filename, and it is where `DATABASE_URL` is wired in.
- `prisma migrate deploy` applies database migrations from `prisma/migrations` to create/update tables.
- `npm run build` compiles TypeScript to `dist/`.

---

## 7. Start the app with PM2

The repo already has `ecosystem.config.js` configured to run `dist/server.js`. From the `labscan` directory:

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

`pm2 startup` prints a command — copy and run the one it gives you (it registers PM2 to auto-start on server reboot). Then run `pm2 save` again after.

Check it's alive:

```bash
pm2 status
pm2 logs labscan
curl http://localhost:8082/health
```

---

## 8. (Recommended) Put Nginx in front with a domain + HTTPS

Running the raw Node app directly on port 8082 to the internet works, but a reverse proxy is the standard, safer setup and lets you use port 80/443 with a real domain and free HTTPS.

```bash
sudo dnf install -y nginx        # Amazon Linux  (Ubuntu: sudo apt install -y nginx)
sudo nano /etc/nginx/conf.d/labscan.conf
```

Paste:

```nginx
server {
    listen 80;
    server_name your-domain-or-ec2-ip;

    location / {
        proxy_pass http://localhost:8082;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

Enable it:

```bash
sudo systemctl enable nginx
sudo nginx -t
sudo systemctl restart nginx
```

If you have a real domain pointed at the EC2 IP (an A record), add free HTTPS:

```bash
sudo dnf install -y certbot python3-certbot-nginx   # Ubuntu: sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

Now update your EC2 security group: allow inbound 80/443 from Anywhere, and you can remove/close inbound 8082 to the public internet since Nginx forwards internally.

---

## 9. Deploying updates later

Whenever you push new code:

```bash
ssh -i /path/to/labscan-key.pem ec2-user@<EC2_PUBLIC_IP>   # or ubuntu@
cd ~/labscan
git pull origin main
npm ci
npx prisma generate --config prisma7.config.ts
npx prisma migrate deploy --config prisma7.config.ts
npm run build
pm2 restart labscan
```

---

## 10. CI/CD: fully automatic deploy on push to `main`

`.github/workflows/ci-cd.yml` is already set up in this repo, and the `deploy` job is fully self-bootstrapping — **no manual SSH setup on the EC2 box is required**, even for a brand-new instance. On every push:

1. **`build` job** — checks out the code, installs deps, runs `prisma generate`, and type-checks/builds with `tsc`. Runs on every push and PR, so broken code never reaches the deploy step.
2. **`deploy` job** — only runs on pushes to `main` (or a manual run via the Actions tab → "Run workflow"), and only after `build` passes. It uploads [`scripts/deploy-remote.sh`](../scripts/deploy-remote.sh) to your EC2 instance over SSH and runs it, which:
   - detects the distro (`dnf`/`yum` on Amazon Linux/RHEL, `apt` on Ubuntu/Debian) and installs Node.js 22, `git`, and PM2 **if they're not already there**, and registers PM2 with systemd so the app survives reboots (idempotent — skipped instantly on later runs)
   - clones the repo into `EC2_APP_DIR` **if it isn't already a git checkout** (using the workflow's own short-lived `GITHUB_TOKEN`, so no separate deploy key/PAT is needed for a private repo)
   - fetches latest `main` and `git reset --hard`s to it
   - **writes `.env` from the `APP_ENV_FILE` secret on every deploy** — this is now the single source of truth for server config; hand-editing `.env` directly on the box will just get overwritten on the next deploy
   - `npm ci`, `prisma generate`, `prisma migrate deploy`, `npm run build`
   - `pm2 startOrReload ecosystem.config.js --update-env` + `pm2 save`
   - polls `http://localhost:$PORT/health` for up to ~30s
   - **if the health check fails, it automatically rolls the code back** to the previous commit, rebuilds, and reloads PM2 — then fails the Action run so you get notified. (Note: database migrations applied during a failed deploy are *not* auto-reverted — check them manually if a rollback happens.)

Deploys are serialized (`concurrency: deploy-production`, not cancelled mid-flight), so two pushes in quick succession queue instead of corrupting each other's deploy.

### One-time setup required (all in GitHub, nothing on the server)

You still need a **bare** EC2 instance (step 1 of this guide — launched, security group open for SSH from GitHub's runners or `0.0.0.0/0` on port 22, since GitHub Actions doesn't have fixed IPs) and these secrets, but the pipeline handles everything else itself:

1. **In the GitHub repo** → Settings → Environments → create an environment named `production` (optionally add required reviewers here if you want deploys to need manual approval).
2. **In that `production` environment** (or repo-level Secrets, either works) → add:
   - `EC2_HOST` — the instance's public IP or domain
   - `EC2_USER` — `ec2-user` on Amazon Linux, `ubuntu` on Ubuntu
   - `EC2_SSH_KEY` — the **private** key contents (the `.pem` file you downloaded in step 1) — paste the whole file including `-----BEGIN...-----`/`-----END...-----` lines
   - `EC2_APP_DIR` — optional, defaults to `~/labscan` (e.g. `/home/ec2-user/labscan`)
   - `EC2_SSH_PORT` — optional, defaults to 22
   - `APP_ENV_FILE` — the **entire contents** of a production `.env` file, pasted as one multi-line secret value. Copy your local `.env`, then set `NODE_ENV=production` and `PORT=8082` in the copy (keep `DATABASE_URL` pointing at your real database — Neon, RDS, etc.), and paste that whole block as the secret's value.
3. Push to `main` (or trigger the workflow manually) and watch it run under the repo's **Actions** tab.

Since `EC2_SSH_KEY` needs to already be a valid login for the instance, and `sudo` needs to work non-interactively for the auto-install steps, this assumes the default AMI setup where `ec2-user` (Amazon Linux) or `ubuntu` (Ubuntu) has passwordless `sudo` — true out of the box unless you've changed it.

### Why `/health`

The app now exposes `GET /health` → `{"status":"ok"}` (added in `src/app.ts`), used purely so the deploy script has something reliable to poll after a restart — it doesn't touch the database, so it won't falsely fail if Postgres is just slow to accept connections right after a reboot.

---

## Appendix: using systemd instead of PM2

PM2 is what this repo ships (`ecosystem.config.js`) and what the CI/CD workflow above drives, so that's the recommended path. If you'd rather rely on the OS's own service manager instead of an extra global npm package, you can run the app under **systemd** instead — trade-off is you lose PM2's `pm2 logs`/`pm2 monit` niceties but gain plain `journalctl`/`systemctl` and one less moving part.

```bash
sudo tee /etc/systemd/system/labscan.service > /dev/null <<'EOF'
[Unit]
Description=LabScan API
After=network.target postgresql.service

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/labscan
EnvironmentFile=/home/ubuntu/labscan/.env
ExecStart=/usr/bin/node dist/server.js
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable --now labscan
sudo systemctl status labscan
journalctl -u labscan -f
```

If you switch to this, replace the `pm2 startOrReload ...` / `pm2 save` lines in `.github/workflows/ci-cd.yml`'s deploy script with `sudo systemctl restart labscan`, and drop the PM2 install step from server setup. Don't run both PM2 and systemd for the same app at once — pick one, since they'll otherwise fight over port 8082.

---

## Troubleshooting

- **`pm2 logs labscan` shows DB connection errors**: double-check `DATABASE_URL` in `.env`, and that the security group for RDS (or local Postgres `pg_hba.conf`) allows connections from the EC2 instance.
- **Can't reach the app from your browser**: check the EC2 security group has the right port open, and that `pm2 status` shows the app as `online` not `errored`.
- **`npm ci` fails**: make sure Node version on the server matches what's expected (`node -v` should be 22.x).
- **Migrations fail**: confirm the DB user has permission to create tables, and that `DATABASE_URL` points at the right database.
- **Uploaded reports**: files uploaded through the API are written to `uploads/` on the server's disk. Deploys never delete them (no `git clean`), but they are lost if the instance is terminated — back up that folder or move uploads to S3 for real production use.
- **Deploy job hangs/fails at "Set up SSH key"**: the security group must allow port 22 from GitHub Actions runners (they have no fixed IP, so `0.0.0.0/0`), and `EC2_HOST` must be the *public* IP/DNS.
