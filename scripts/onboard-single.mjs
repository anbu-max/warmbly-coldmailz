import tls from 'node:tls';
import crypto from 'node:crypto';

const AUTH_SECRET = "local-dev-auth-secret-minimum-32-characters-long";
const USER_ID = "75480632-d990-45a5-adf7-43516c9e4126";
const SESSION_ID = "f8c92e2e-48ee-46a2-9849-c39290ab4532";
const ACCESS_NONCE = "dga6rgdbHCaEDS4wsTLX5g";
const EMAIL = "dev@warmbly.com";

function base64url(str) {
  return Buffer.from(str)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function createJWT() {
  const header = { alg: "HS256", typ: "JWT" };
  const iat = Math.floor(new Date("2026-09-14T08:20:10.061164Z").getTime() / 1000);
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    sub: USER_ID,
    sid: SESSION_ID,
    email: EMAIL,
    nonce: ACCESS_NONCE,
    iat: iat,
    exp: now + 86400 * 365,
  };

  const headerB64 = base64url(JSON.stringify(header));
  const payloadB64 = base64url(JSON.stringify(payload));
  const message = `${headerB64}.${payloadB64}`;

  const signature = crypto
    .createHmac("sha256", AUTH_SECRET)
    .update(message)
    .digest();
  return `${message}.${base64url(signature)}`;
}

async function testImap(email, pass) {
  return new Promise((resolve) => {
    console.log(`\nTesting IMAP credentials for ${email} with pass ${pass}...`);
    const socket = tls.connect(993, 'imap.gmail.com', { servername: 'imap.gmail.com' }, () => {});

    let step = 0;
    socket.on('data', (chunk) => {
      const msg = chunk.toString();
      if (step === 0 && msg.includes('* OK')) {
        step = 1;
        socket.write(`a001 LOGIN ${email} ${pass}\r\n`);
      } else if (step === 1) {
        if (msg.includes('a001 OK')) {
          console.log(`✅ Google IMAP Login SUCCESS for ${email}!`);
          socket.end();
          resolve(true);
        } else {
          console.log(`❌ Google IMAP Login FAILED: ${msg.trim()}`);
          socket.end();
          resolve(false);
        }
      }
    });

    socket.on('error', (err) => {
      console.error(`Socket error:`, err.message);
      resolve(false);
    });
  });
}

async function onboard(email, name, pass) {
  const token = createJWT();
  const payload = {
    email,
    name,
    smtp: {
      username: email,
      password: pass,
      host: "smtp.gmail.com",
      port: 587,
      security: "starttls",
    },
    imap: {
      username: email,
      password: pass,
      host: "imap.gmail.com",
      port: 993,
      security: "tls",
    },
  };

  const res = await fetch("http://localhost:8080/v1/emails/onboarding/smtp-imap", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => ({}));
  if (res.ok) {
    console.log(`🎉 Successfully added to Warmbly! ID: ${data.id}`);
    if (data.id) {
      await fetch(`http://localhost:8080/v1/emails/${data.id}/warmup/start`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
      });
      console.log(`🔥 Warmup started for ${email}`);
    }
  } else {
    console.error(`❌ Warmbly onboarding failed:`, data);
  }
}

async function run() {
  const email = "ngopi2659@gmail.com";
  const pass = "zitmxidgpiyepgne";
  const ok = await testImap(email, pass);
  if (ok) {
    await onboard(email, "Ngopi", pass);
  }
}

run();
