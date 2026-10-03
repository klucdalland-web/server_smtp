# servermail

API serverless Vercel pour envoyer des emails via Gmail SMTP (Nodemailer).

## Endpoint

```
POST /api/send
```

**Headers**

| Header         | Valeur              |
|----------------|---------------------|
| `Content-Type` | `application/json`  |
| `x-api-secret` | `MAIL_API_SECRET`   |

**Body JSON**

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

Puis tester :

```bash
curl -X POST http://localhost:3000/api/send \
  -H "Content-Type: application/json" \
  -H "x-api-secret: $MAIL_API_SECRET" \
  -d '{"to":"test@example.com","subject":"Hello","html":"<p>Hi</p>"}'
```

## Déploiement Vercel

1. Lier le repo au projet Vercel (ou `npx vercel`)
2. Ajouter les variables d'environnement ci-dessus
3. Déployer : `npx vercel --prod`
