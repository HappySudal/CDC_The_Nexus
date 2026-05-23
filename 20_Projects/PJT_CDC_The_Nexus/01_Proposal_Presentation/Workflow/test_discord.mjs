// Discord Bridge — End-to-End Connectivity Test
// ===============================================
// 사용법:
//   node test_discord.mjs <webhook_url>
//
// webhook_url 미제공 시: 코드 정합성만 검증 (실제 메시지 발송 X)
// webhook_url 제공 시: 실제 Discord 채널로 테스트 메시지 발송
//
// G4 목표 (헌법 거버넌스 강제) 검증의 일환.

import { DiscordBridge } from '../../electron/discord-bridge.js';

const webhookUrl = process.argv[2] || null;
const isDryRun = !webhookUrl;

console.log('='.repeat(60));
console.log('Discord Bridge Connectivity Test');
console.log('='.repeat(60));
console.log(`Mode    : ${isDryRun ? 'DRY-RUN (code validation)' : 'LIVE (actual send)'}`);
console.log(`Webhook : ${isDryRun ? '(none)' : webhookUrl.replace(/\/(\w{8})\w+\/(\w{8})\w+/, '/$1***/$2***')}`);
console.log('='.repeat(60));

const results = {
  instantiation: null,
  connect: null,
  validate: null,
  sendText: null,
  sendEmbed: null,
  stats: null,
};

try {
  // 1. 인스턴스 생성
  const bridge = new DiscordBridge({ webhookUrl });
  results.instantiation = '✅ Pass';
  console.log('\n[1/6] Instantiation       : ✅ DiscordBridge created');

  // 2. 통계 (초기 상태)
  const initStats = bridge.getStats();
  results.stats = `connected=${initStats.connected}, queued=${initStats.queuedMessages}, handlers=${initStats.handlers}`;
  console.log(`[2/6] Initial Stats       : ${results.stats}`);

  // 3. Connect
  console.log('[3/6] Connecting...');
  const connected = await bridge.connect();
  results.connect = connected ? '✅ Connected' : '⚠️ Not connected (expected if dry-run)';
  console.log(`      Result              : ${results.connect}`);

  if (isDryRun) {
    console.log('\n[4-6] Skipped (dry-run mode)');
    results.validate = 'Skipped';
    results.sendText = 'Skipped';
    results.sendEmbed = 'Skipped';
  } else {
    // 4. Text 메시지 발송
    console.log('[4/6] Sending text message...');
    const textResult = await bridge.sendMessage(
      `🤖 The Nexus — Discord Bridge Test\nTime: ${new Date().toISOString()}\nFrom: G4 (Constitutional Governance) verification.`
    );
    results.sendText = textResult ? '✅ Sent' : '❌ Failed';
    console.log(`      Result              : ${results.sendText}`);

    // 5. Embed 메시지 발송
    console.log('[5/6] Sending embed message...');
    const embedResult = await bridge.sendMessage(
      {
        description: 'The Nexus v0.3.0 — Cycle #1 STEP 6 (Verification)',
        fields: [
          { name: 'G1 ZeroCost', value: '✅ Code verified', inline: true },
          { name: 'G2 ReAct Loop', value: '✅ Code verified', inline: true },
          { name: 'G3 Knowledge Graph', value: '✅ Code verified', inline: true },
          { name: 'G4 Constitution Watch', value: '🔄 Testing now', inline: true },
          { name: 'G5 UI/UX', value: '⏳ Chairman pending', inline: true },
          { name: 'SHA-256', value: '`67dc2a70...75e89`', inline: false },
        ],
      },
      { title: '🌌 The Nexus Status Update', color: 0x9900ff }
    );
    results.sendEmbed = embedResult ? '✅ Sent' : '❌ Failed';
    console.log(`      Result              : ${results.sendEmbed}`);

    // 6. 최종 통계
    const finalStats = bridge.getStats();
    console.log(`[6/6] Final Stats         : connected=${finalStats.connected}, queued=${finalStats.queuedMessages}`);
  }
} catch (error) {
  console.error('\n[ERROR]', error.message);
  console.error(error.stack);
}

console.log('\n' + '='.repeat(60));
console.log('Summary');
console.log('='.repeat(60));
console.log(JSON.stringify(results, null, 2));

if (isDryRun) {
  console.log('\n📌 To run a LIVE test:');
  console.log('   node test_discord.mjs <YOUR_WEBHOOK_URL>');
  console.log('\n📌 To create a webhook:');
  console.log('   Discord server → Settings → Integrations → Webhooks → New Webhook → Copy URL');
}

// "시각(時刻)에 존재하고, 시간(時間)에 소멸한다."
// "Exists in the Moment, Vanishes in Time."
