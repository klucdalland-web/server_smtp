# servermail

API serverless Vercel pour envoyer des emails via SMTP (Nodemailer). Compatible Gmail (port 587 TLS).

## Endpoint

```
POST /api/send
```

### Via headers (recommandé)

| Header | Requis | Description |
|--------|--------|-------------|
| `x-api-secret` | oui | `MAIL_API_SECRET` |
| `x-to` | oui | Destinataire |
| `x-subject` | oui | Sujet |
| `x-html` | oui* | Contenu HTML |
| `x-text` | non | Contenu texte (sinon généré depuis le HTML) |
| `x-html-b64` | oui* | HTML encodé en base64 (si HTML long / caractères spéciaux) |
| `x-text-b64` | non | Texte encodé en base64 |
| `x-reply-to` | non | Adresse de réponse |

\* Fournir `x-html` **ou** `x-html-b64`.

```bash
curl -X POST https://TON-PROJET.vercel.app/api/send \
  -H "x-api-secret: $MAIL_API_SECRET" \
  -H "x-to: destinataire@example.com" \
  -H "x-subject: Hello" \
  -H "x-html: <p>Hi</p>" \
  -H "x-text: Hi"
```

### Via body JSON (fallback)

Le secret reste en header. Le reste peut aller dans le body :

```json
{
  "to": "destinataire@example.com",
  "subject": "Sujet",
  "html": "<p>Contenu HTML</p>",
  "text": "Contenu texte (optionnel)",
  "replyTo": "noreply@example.com"
}
```

**Réponses**

| Status | Body |
|--------|------|
| 200 | `{ "ok": true, "messageId": "..." }` |
| 400 | `{ "error": "invalid_payload" }` |
| 401 | `{ "error": "unauthorized" }` |
| 405 | `{ "error": "method_not_allowed" }` |
| 500 | `{ "error": "send_failed" }` |

## Variables d'environnement

À configurer dans **Vercel → Settings → Environment Variables** (Production + Preview) :

| Variable | Description |
|----------|-------------|
| `MAIL_HOST` | Serveur SMTP (ex. `smtp.gmail.com`) |
| `MAIL_PORT` | Port (`587` TLS ou `465` SSL) |
| `MAIL_USERNAME` | Identifiant SMTP |
| `MAIL_PASSWORD` | Mot de passe d'application Gmail |
| `MAIL_ENCRYPTION` | `tls` ou `ssl` |
| `MAIL_FROM_ADDRESS` | Adresse d'expéditeur |
| `MAIL_FROM_NAME` | Nom d'expéditeur |
| `MAIL_API_SECRET` | Secret pour authentifier les appels |

En local : copier `.env.example` → `.env`. Ne jamais committer `.env`.

## Développement local

```bash
npm install
npm run dev
```

```bash
set -a && source .env && set +a
curl -X POST http://localhost:3000/api/send \
  -H "x-api-secret: $MAIL_API_SECRET" \
  -H "x-to: ton-email@example.com" \
  -H "x-subject: Test local" \
  -H "x-html: <p>Hello</p>"
```

## Déploiement Vercel

1. Lier le repo : `npx vercel` (ou importer sur vercel.com)
2. Ajouter les variables d'environnement ci-dessus
3. Déployer : `npx vercel --prod`

L’URL sera du type : `https://TON-PROJET.vercel.app/api/send`

> **Spam :** héberger sur Vercel ne change pas la délivrabilité. Avec un Gmail perso, les mails peuvent aller en spam. Pour du prod fiable : domaine custom + ESP (Resend, SendGrid, SES…) avec SPF/DKIM/DMARC.
