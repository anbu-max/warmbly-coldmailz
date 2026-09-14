import crypto from 'node:crypto';

const AUTH_SECRET = "local-dev-auth-secret-minimum-32-characters-long";
const USER_ID = "75480632-d990-45a5-adf7-43516c9e4126";
const SESSION_ID = "f8c92e2e-48ee-46a2-9849-c39290ab4532";
const ACCESS_NONCE = "dga6rgdbHCaEDS4wsTLX5g";
const EMAIL = "dev@warmbly.com";

// Base64URL helper
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
    exp: now + 86400 * 365, // 1 year
  };

  const headerB64 = base64url(JSON.stringify(header));
  const payloadB64 = base64url(JSON.stringify(payload));
  const message = `${headerB64}.${payloadB64}`;

  const signature = crypto
    .createHmac("sha256", AUTH_SECRET)
    .update(message)
    .digest();
  const signatureB64 = base64url(signature);

  return `${message}.${signatureB64}`;
}

const ACCOUNTS_TO_IMPORT = [
  {
    email: "anbuselvan32520@gmail.com",
    name: "Anbuselvan 32520",
    password: "mpcdaaaftyitrkazw",
  },
  {
    email: "anbuselvan.atomix@gmail.com",
    name: "Anbuselvan Atomix",
    password: "mkuupglhughfkmzk",
  },
  {
    email: "alanrictsons@gmail.com",
    name: "Alan Rictsons",
    password: "vinmaqmdcsydqvbc",
  },
  {
    email: "anbu.fromatomixdigital@gmail.com",
    name: "Anbu From Atomix Digital",
    password: "qqeqomzzaonrrysr",
  },
];

async function run() {
  const token = createJWT();
  console.log("Generated JWT Token for dev session");

  for (const acc of ACCOUNTS_TO_IMPORT) {
    console.log(`\nImporting ${acc.email}...`);
    const payload = {
      email: acc.email,
      name: acc.name,
      smtp: {
        username: acc.email,
        password: acc.password,
        host: "smtp.gmail.com",
        port: 587,
        security: "starttls",
      },
      imap: {
        username: acc.email,
        password: acc.password,
        host: "imap.gmail.com",
        port: 993,
        security: "tls",
      },
    };

    try {
      const res = await fetch("http://localhost:8080/v1/emails/onboarding/smtp-imap", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }

      if (res.ok) {
        console.log(`✅ Success: ${acc.email} added with ID ${data.id}`);
        // Enable warmup if needed
        if (data.id) {
          const warmupRes = await fetch(`http://localhost:8080/v1/emails/${data.id}/warmup/start`, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${token}`,
            },
          });
          console.log(`   Warmup started: HTTP ${warmupRes.status}`);
        }
      } else {
        console.error(`❌ Failed (${res.status}):`, data);
      }
    } catch (e) {
      console.error(`❌ Error importing ${acc.email}:`, e.message);
    }
  }
}

run();
