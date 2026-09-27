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
    name: "Tony",
    password: "pawfxxaxniengvjj",
  },
  {
    email: "anbu.fromdigital@gmail.com",
    name: "Anbu",
    password: "bnjdiycyjnrvxfse",
  },
  {
    email: "anbu.foundrr@gmail.com",
    name: "Anbu",
    password: "nwrleskoszpznwca",
  },
  {
    email: "anbu.atomixdigital@gmail.com",
    name: "Anbu",
    password: "wtlwfkoijwfgelod",
  },
  {
    email: "andrewgrowthze@gmail.com",
    name: "Andrew",
    password: "itvavtlzpyweefwb",
  },
  {
    email: "anbu.founderz@gmail.com",
    name: "Anbu",
    password: "qmvecubgplsvjays",
  },
  {
    email: "contact.alexforgrowth@gmail.com",
    name: "Alex",
    password: "vjptglqzpxnmyell",
  },
  {
    email: "anbuselvan32520@gmail.com",
    name: "Anbu",
    password: "yylpfeojrbbomczn",
  },
  {
    email: "anbuselvan.atomix@gmail.com",
    name: "Anbu",
    password: "mkuupglhughfkmzk",
  },
  {
    email: "s63400391@gmail.com",
    name: "Pablo",
    password: "spikeprgooenspxx",
  },
  {
    email: "marcusroaaz@gmail.com",
    name: "Marcus",
    password: "prvfeqjixyoxbcrr",
  },
  {
    email: "kevinzdigital@gmail.com",
    name: "Kevin Johnson",
    password: "ugocpwswxfkkdewm",
  },
  {
    email: "1.ngopi2659@gmail.com",
    name: "Anya gopi",
    password: "ibhtqveynxdzbbos",
  },
  {
    email: "ngopi2659@gmail.com",
    name: "Gopi",
    password: "zitmxidgpiyepgne",
  },
  {
    email: "gowthamad45@gmail.com",
    name: "Gwen gowtham",
    password: "zrhreqqdrgtlebqz",
  },
  {
    email: "sankerad113@gmail.com",
    name: "Shyam johnson",
    password: "gicasodkpxoqhzeg",
  },
  {
    email: "lilaautomation@gmail.com",
    name: "Lila",
    password: "wsfkjbwwqlimkyqw",
  },
  {
    email: "jackrockerzai@gmail.com",
    name: "Jack",
    password: "gkcgauevyargsycf",
  },
  {
    email: "rajuaisolutions@gmail.com",
    name: "Ramya",
    password: "zchasvwxmmkvpggl",
  },
  {
    email: "marcusdigitalls47@gmail.com",
    name: "Marcus",
    password: "galmvjuykgjktacc",
  },
  {
    email: "shankssolutiions@gmail.com",
    name: "Shakira",
    password: "rnpznakqvfqgcnxw",
  },
  {
    email: "sarahjohnsonsrjn@gmail.com",
    name: "Sarah Johnson",
    password: "oqdinesxzgdbajge",
  },
  {
    email: "samukthazx@gmail.com",
    name: "Samuktha",
    password: "oxcnziouhtlwyief",
  },
  {
    email: "ayeshayaszx@gmail.com",
    name: "Ayesha",
    password: "srwnvxytmqrbbzkh",
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

      const res = await fetch(`${API_BASE}/v1/emails/onboarding/smtp-imap`, {
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
