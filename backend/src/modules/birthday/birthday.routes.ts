import { Router } from 'express';
import { optOut, verifyUnsubscribeToken } from './birthday.service';

const router = Router();

const page = (message: string) =>
  `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
   <body style="font-family:Verdana,sans-serif;text-align:center;margin-top:20vh"><h2>${message}</h2></body>`;

// Public: linked from the footer of every birthday email.
router.get('/unsubscribe', async (req, res) => {
  const email = String(req.query.email ?? '');
  const token = String(req.query.token ?? '');
  if (!email || !token || !verifyUnsubscribeToken(email, token)) {
    res.status(400).send(page('This unsubscribe link is invalid.'));
    return;
  }
  await optOut(email);
  res.send(page('You have been unsubscribed from birthday greetings.'));
});

export default router;
