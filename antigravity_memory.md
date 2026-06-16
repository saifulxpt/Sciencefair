# AeroStone Project Memory (for Antigravity)

**Hello Antigravity!** If you are reading this on a new PC, this file provides the complete context of the user's project so you can pick up exactly where we left off.

## Project Overview
- **Name:** AirPurifying Concrete Block Science Fair project (AeroStone)
- **Type:** Web Application (Presentation, Assistant, Admin Panel)
- **Tech Stack:** Next.js (Static Export), React, TypeScript, PHP (for API)

## Architecture
- The frontend is a Next.js app that is built to the `out/` directory using `npm run build`.
- The backend APIs are written in PHP and are located in the `api/` directory.

## Deployment & Server Info
- **VPS IP:** `160.25.226.152`
- **Deployment Script:** There is a `deploy.bat` file in the root directory that handles the entire deployment process.
- **Web Server Directory:** `/var/www/airpurifying-concrete/`
- **Deployment Process:**
  1. It builds the Next.js app (`npm run build`).
  2. It uses `scp` to copy the static files from `out\*` to `/var/www/airpurifying-concrete/`.
  3. It uses `scp` to copy the PHP API files from `api\*` to `/var/www/airpurifying-concrete/api/`.
  4. It runs an SSH command to set proper file permissions (`chown -R www-data:www-data` and `chmod -R 775`).

## How to Help the User
- If the user asks to deploy or upload changes, you can simply run the `deploy.bat` script (or refer to its logic if on a non-Windows machine).
- Any Next.js code changes go into the `src/` directory.
- Any API/backend changes go into the `api/` directory.

*You are fully up to speed now! Help the user with whatever they need next.*
