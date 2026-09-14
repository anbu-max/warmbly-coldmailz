#!/usr/bin/env node
/**
 * Warmbly Mailbox Bulk Importer
 * 
 * Usage:
 *   node scripts/import-mailboxes.mjs [WARMBLY_API_URL] [SESSION_OR_API_TOKEN]
 * 
 * Default URL: http://localhost:8080
 */

const ACCOUNTS = [
  {
    email: "zenkucarter@gmail.com",
    name: "Zenku Carter",
    password: "fimgsstlokahcua",
  },
  {
    email: "alanrictsons@gmail.com",
    name: "Alan Rictsons",
    password: "vinmaqmdcsydqvbc",
  },
  {
    email: "anbuselvan.on@gmail.com",
    name: "Anbuselvan",
    password: "ipuvdgjbhkjcvzil",
  },
  {
    email: "tony.atomixdigital@gmail.com",
    name: "Tony Atomix",
    password: "pawfxxaxniengvjj",
  },
  {
    email: "anbu.fromdigital@gmail.com",
    name: "Anbu From Digital",
    password: "bnjdiycyjnrvxfse",
  },
  {
    email: "anbu.foundrr@gmail.com",
    name: "Anbu Foundrr",
    password: "nwrleskoszpznwca",
  },
  {
    email: "anbu.atomixdigital@gmail.com",
    name: "Anbu Atomix Digital",
    password: "wtlwfkoijwfgelod",
  },
  {
    email: "andrewgrowthze@gmail.com",
    name: "Andrew Growthze",
    password: "itvavtlzpyweefwb",
  },
  {
    email: "anbu.founderz@gmail.com",
    name: "Anbu Founderz",
    password: "qmvecubgplsvjays",
  },
  {
    email: "contact.alexforgrowth@gmail.com",
    name: "Alex Growth",
    password: "vjptglqzpxnmyell",
  },
  {
    email: "anbuselvan32520@gmail.com",
    name: "Anbuselvan 32520",
    password: "yylpfeojrbbomczn",
  },
  {
    email: "anbuselvan.atomix@gmail.com",
    name: "Anbuselvan Atomix",
    password: "mkuupglhughfkmzk",
  },
  {
    email: "s63400391@gmail.com",
    name: "S63400391",
    password: "spikeprgooenspxx",
  },
  {
    email: "marcusroaaz@gmail.com",
    name: "Marcus Roaaz",
    password: "prvfeqjixyoxbcrr",
  },
  {
    email: "kevinzdigital@gmail.com",
    name: "Kevin Digital",
    password: "ugocpwswxfkkdewm",
  },
  {
    email: "1.ngopi2659@gmail.com",
    name: "Ngopi 1",
    password: "ibhtqveynxdzbbos",
  },
  {
    email: "ngopi2659@gmail.com",
    name: "Ngopi",
    password: "zitmxidgpiyepgne",
  },
];

const API_BASE = process.argv[2] || process.env.WARMBLY_API_URL || "http://localhost:8080";
const TOKEN = process.argv[3] || process.env.WARMBLY_TOKEN || "";

async function importMailboxes() {
  console.log(`\n🚀 Starting import of ${ACCOUNTS.length} mailboxes into Warmbly at ${API_BASE}...\n`);

  if (!TOKEN) {
    console.log("⚠️  No auth token provided. If the backend requires auth, run with:");
    console.log("   node scripts/import-mailboxes.mjs <API_URL> <TOKEN>\n");
  }

  for (const [idx, acc] of ACCOUNTS.entries()) {
    console.log(`[${idx + 1}/${ACCOUNTS.length}] Importing ${acc.email}...`);

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
      const headers = { "Content-Type": "application/json" };
      if (TOKEN) {
        headers["Authorization"] = `Bearer ${TOKEN}`;
      }

      const res = await fetch(`${API_BASE}/emails/onboarding/smtp-imap`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        console.log(`  ✅ Successfully imported: ${acc.email} (ID: ${data.id || "Created"})`);
      } else {
        console.error(`  ❌ Failed to import ${acc.email}: [${res.status}] ${data.message || JSON.stringify(data)}`);
      }
    } catch (err) {
      console.error(`  ❌ Connection error importing ${acc.email}: ${err.message}`);
    }
  }

  console.log("\n✨ Done processing accounts.\n");
}

importMailboxes();
