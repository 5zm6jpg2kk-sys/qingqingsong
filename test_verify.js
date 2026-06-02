/**
 * 清清松 - 自动化验证脚本 (Node.js)
 * 用法:
 *   node test_verify.js         测试 GitHub Pages (默认)
 *   node test_verify.js local   测试本地 index.html
 *
 * 检查项:
 *   1. 页面加载 + JS 错误收集
 *   2. 首页默认激活
 *   3. 5 个底部 Tab 逐个切换
 *   4. 各页面关键元素可见
 *   5. 首页快捷操作按钮
 *   6. 演示数据加载
 */

const { chromium } = require('playwright');
const path = require('path');

const MODE = process.argv[2] || 'remote';
const TARGET = MODE === 'local'
  ? 'file:///' + path.resolve(__dirname, 'index.html')
  : 'https://5zm6jpg2kk-sys.github.io/qingqingsong/';

const TABS = ['dashboard', 'debts', 'plan', 'hustle', 'settings'];
const TAB_NAMES = { dashboard: '首页', debts: '债务', plan: '规划', hustle: '副业', settings: '我的' };
const TITLES = { dashboard: '清清松', debts: '债务清单', plan: '还款规划', hustle: '副业推荐', settings: '设置' };

let errors = [];
let passed = 0;
let failed = 0;

function check(condition, msg) {
  if (condition) {
    console.log(`  ✅ ${msg}`);
    passed++;
  } else {
    console.log(`  ❌ ${msg}`);
    failed++;
  }
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 414, height: 896 } });
  const page = await context.newPage();

  // 收集 JS 错误
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(`[console] ${msg.text()}`);
  });
  page.on('pageerror', err => errors.push(`[exception] ${err.message}`));

  // ==================== 1. 加载 ====================
  console.log(`\n${'='.repeat(50)}`);
  console.log(`🔍 清清松 验证脚本`);
  console.log(`   目标: ${MODE.toUpperCase()} → ${TARGET}`);
  console.log(`${'='.repeat(50)}\n`);

  console.log('1️⃣  页面加载...');
  try {
    await page.goto(TARGET, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
  } catch (e) {
    console.log(`  ❌ 页面加载失败: ${e.message}`);
    await browser.close();
    process.exit(1);
  }

  const title = await page.title();
  check(title === '清清松', `页面标题 = '${title}'`);

  // ==================== 2. 首页状态 ====================
  console.log('\n2️⃣  首页默认状态...');
  const dashEl = page.locator('#pg-dashboard');
  const dashVisible = await dashEl.isVisible().catch(() => false);
  check(dashVisible, '首页容器可见');
  if (dashVisible) {
    const dashActive = await dashEl.evaluate(el => el.classList.contains('active'));
    check(dashActive, '首页默认激活');
  }
  const headerTitle = await page.locator('#hTitle').textContent();
  check(headerTitle === '清清松', `Header 标题 = '${headerTitle}'`);

  // ==================== 3. Tab 切换 ====================
  console.log('\n3️⃣  底部导航切换...');
  for (const t of TABS) {
    const tabBtn = page.locator(`.tab[data-t="${t}"]`);
    const tabVisible = await tabBtn.isVisible().catch(() => false);
    if (!tabVisible) {
      console.log(`  ❌ [${TAB_NAMES[t]}] Tab 按钮不可见`);
      failed++;
      continue;
    }
    await tabBtn.click();
    await page.waitForTimeout(600);

    const pgEl = page.locator(`#pg-${t}`);
    const pgVisible = await pgEl.isVisible().catch(() => false);
    if (!pgVisible) {
      console.log(`  ❌ [${TAB_NAMES[t]}] 页面不可见`);
      failed++;
      continue;
    }
    const isActive = await pgEl.evaluate(el => el.classList.contains('active'));
    const hTitle = await page.locator('#hTitle').textContent();
    const correctTitle = hTitle === TITLES[t];

    if (isActive && correctTitle) {
      console.log(`  ✅ [${TAB_NAMES[t]}] → '${hTitle}'`);
      passed += 2;
    } else {
      if (!isActive) { console.log(`  ❌ [${TAB_NAMES[t]}] 未激活`); failed++; }
      if (!correctTitle) { console.log(`  ❌ [${TAB_NAMES[t]}] 标题: 期望'${TITLES[t]}' 实际'${hTitle}'`); failed++; }
    }
  }

  // ==================== 4. JS 错误 ====================
  console.log('\n4️⃣  JavaScript 错误...');
  if (errors.length === 0) {
    console.log('  ✅ 零 JS 错误');
    passed++;
  } else {
    console.log(`  ❌ ${errors.length} 个 JS 错误:`);
    errors.slice(0, 10).forEach(e => console.log(`     • ${e.substring(0, 150)}`));
    failed += errors.length;
  }

  // ==================== 5. 内容检查 ====================
  console.log('\n5️⃣  各页面内容...');

  await page.locator('.tab[data-t="dashboard"]').click();
  await page.waitForTimeout(500);
  check(await page.locator('#totalDebt').isVisible().catch(() => false), '首页 → 总债务金额可见');
  const dashProgressExists = (await page.locator('#dashProgress').count()) > 0;
check(dashProgressExists, '首页 → 进度条元素存在');

  await page.locator('.tab[data-t="debts"]').click();
  await page.waitForTimeout(500);
  check(await page.locator('#debtList').isVisible().catch(() => false), '债务页 → 债务列表可见');
  check(await page.locator('#monthIncome').isVisible().catch(() => false), '债务页 → 月收入可见');

  await page.locator('.tab[data-t="plan"]').click();
  await page.waitForTimeout(500);
  check(await page.locator('#monthlyPlan').isVisible().catch(() => false), '规划页 → 逐月计划可见');

  await page.locator('.tab[data-t="hustle"]').click();
  await page.waitForTimeout(500);
  check(await page.locator('#skillTags').isVisible().catch(() => false), '副业页 → 技能标签可见');

  await page.locator('.tab[data-t="settings"]').click();
  await page.waitForTimeout(500);
  check(await page.isVisible('text=隐私模式'), '设置页 → 隐私模式可见');
  check(await page.isVisible('text=导出备份'), '设置页 → 导出备份可见');

  // ==================== 6. 快捷操作 ====================
  console.log('\n6️⃣  快捷操作...');
  await page.locator('.tab[data-t="dashboard"]').click();
  await page.waitForTimeout(500);
  const btnCount = await page.locator('.qa-btn').count();
  check(btnCount === 4, `首页快捷按钮数 = ${btnCount} (期望 4)`);

  // ==================== 7. Demo 数据 ====================
  console.log('\n7️⃣  演示数据...');
  await page.locator('.tab[data-t="settings"]').click();
  await page.waitForTimeout(500);

  // 自动接受 confirm 弹窗
  page.on('dialog', async d => { await d.accept(); });
  await page.locator('button', { hasText: '加载演示数据' }).click();
  await page.waitForTimeout(1500);

  await page.locator('.tab[data-t="dashboard"]').click();
  await page.waitForTimeout(500);
  const totalText = await page.locator('#totalDebt').textContent();
  check(totalText !== '¥0' && totalText !== '', `加载演示后总债务: ${totalText}`);

  // ==================== 报告 ====================
  const total = passed + failed;
  const pct = total > 0 ? Math.round(100 * passed / total) : 0;
  console.log(`\n${'='.repeat(50)}`);
  console.log(`📊 验证报告: ${passed}/${total} 通过 (${pct}%)`);
  if (failed === 0) {
    console.log('🎉 全部通过！可以部署。');
  } else {
    console.log(`❌ ${failed} 项失败，修复后再验证。`);
  }
  console.log(`${'='.repeat(50)}\n`);

  await browser.close();
  process.exit(failed > 0 ? 1 : 0);
})();
