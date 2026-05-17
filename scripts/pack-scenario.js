/**
 * Собирает scenario.zip для загрузки в Studio Code.
 * Запуск: npm run pack:scenario
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const root = path.join(__dirname, '..');
const scenarioDir = path.join(root, 'scenario');
const outZip = path.join(root, 'scenario.zip');

if (!fs.existsSync(scenarioDir)) {
    console.error('Папка scenario/ не найдена.');
    process.exit(1);
}

if (fs.existsSync(outZip)) {
    fs.unlinkSync(outZip);
}

const isWin = process.platform === 'win32';
if (isWin) {
    execSync(
        `powershell -NoProfile -Command "Compress-Archive -Path '${scenarioDir.replace(/'/g, "''")}\\*' -DestinationPath '${outZip.replace(/'/g, "''")}' -Force"`,
        { stdio: 'inherit', cwd: root }
    );
} else {
    execSync(`cd "${path.dirname(scenarioDir)}" && zip -r "${outZip}" scenario`, { stdio: 'inherit' });
}

console.log(`Готово: ${outZip}`);
