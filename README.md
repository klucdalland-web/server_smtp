# servermail

API serverless Vercel pour envoyer des emails via Gmail SMTP (Nodemailer).

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
| `x-text` | non | Contenu texte |
| `x-html-b64` | oui* | HTML encodé en base64 (si HTML long / caractères spéciaux) |
| `x-text-b64` | non | Texte encodé en base64 |

\* Fournir `x-html` **ou** `x-html-b64`.

```bash
curl -X POST https://TON-PROJET.vercel.app/api/send \
  -H "x-api-secret: $MAIL_API_SECRET" \
  -H "x-to: destinataire@example.com" \
  -H "x-subject: Hello" \
  -H "x-html: <p>Hi</p>" \
  -H "x-text: Hi"
```

HTML long / caractères spéciaux → base64 :

```bash
HTML_B64=$(printf '%s' '<p>Contenu</p>' | base64)
curl -X POST https://TON-PROJET.vercel.app/api/send \
  -H "x-api-secret: $MAIL_API_SECRET" \
  -H "x-to: destinataire@example.com" \
  -H "x-subject: Hello" \
  -H "x-html-b64: $HTML_B64"
```

### Via body JSON (fallback)

Si un champ n’est pas dans les headers, il est lu depuis le body :

```json
{
  "to": "destinataire@example.com",
  "subject": "Sujet",
  "html": "<p>Contenu HTML</p>",
  "text": "Contenu texte (optionnel)"
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

> Les headers HTTP ont une taille limitée (~8–16 Ko). Pour un HTML long, utilise `x-html-b64`.

## Variables d'environnement

Configurer dans le dashboard Vercel (Settings → Environment Variables) pour Production et Preview :

| Variable | Description |
|----------|-------------|
| `GMAIL_USER` | Adresse Gmail d'envoi |
| `GMAIL_APP_PASSWORD` | Mot de passe d'application Gmail |
| `MAIL_API_SECRET` | Secret partagé pour authentifier les appels |
| `MAIL_FROM_NAME` | Nom d'expéditeur (défaut : `AfriNumber`) |

En local, copier `.env.example` vers `.env` et renseigner les valeurs. Ne jamais committer `.env`.

## Développement local

```bash
npm install
npm run dev
```

## Déploiement Vercel

1. Lier le repo au projet Vercel (ou `npx vercel`)
2. Ajouter les variables d'environnement ci-dessus
3. Déployer : `npx vercel --prod`
