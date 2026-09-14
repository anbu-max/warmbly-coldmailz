import tls from 'node:tls';
import net from 'node:net';

async function testImap(email, pass) {
  return new Promise((resolve) => {
    console.log(`\nTesting IMAP for ${email}...`);
    const socket = tls.connect(993, 'imap.gmail.com', { servername: 'imap.gmail.com' }, () => {
      // connected
    });

    let step = 0;
    socket.on('data', (chunk) => {
      const msg = chunk.toString();
      console.log(`[IMAP <] ${msg.trim()}`);
      if (step === 0 && msg.includes('* OK')) {
        step = 1;
        const loginCmd = `a001 LOGIN ${email} ${pass}\r\n`;
        console.log(`[IMAP >] a001 LOGIN ${email} ****`);
        socket.write(loginCmd);
      } else if (step === 1) {
        if (msg.includes('a001 OK')) {
          console.log(`✅ IMAP Login Success for ${email}!`);
        } else if (msg.includes('a001 NO') || msg.includes('a001 BAD')) {
          console.log(`❌ IMAP Login Failed for ${email}: ${msg.trim()}`);
        }
        socket.end();
        resolve();
      }
    });

    socket.on('error', (err) => {
      console.error(`Socket error:`, err.message);
      resolve();
    });

    socket.setTimeout(8000, () => {
      console.log('Timeout');
      socket.destroy();
      resolve();
    });
  });
}

async function run() {
  await testImap("anbuselvan32520@gmail.com", "mpcdaaaftyitrkazw");
  await testImap("anbu.fromatomixdigital@gmail.com", "qqeqomzzaonrrysr");
  await testImap("anbuselvan.atomix@gmail.com", "mkuupglhughfkmzk"); // Known working
}

run();
