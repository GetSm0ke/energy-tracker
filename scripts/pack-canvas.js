/**
 * Собирает canvas-build.zip для загрузки в Studio (корень архива = содержимое build/).
 * Запуск: npm run build && npm run pack:canvas
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const root = path.join(__dirname, '..');
const buildDir = path.join(root, 'build');
const outZip = path.join(root, 'canvas-build.zip');

if (!fs.existsSync(buildDir)) {
    console.error('Папка build/ не найдена. Сначала выполните: npm run build');
    process.exit(1);
}

if (fs.existsSync(outZip)) {
    fs.unlinkSync(outZip);
}

const isWin = process.platform === 'win32';
if (isWin) {
    execSync(
        `powershell -NoProfile -Command "Compress-Archive -Path '${buildDir.replace(/'/g, "''")}\\*' -DestinationPath '${outZip.replace(/'/g, "''")}' -Force"`,
        { stdio: 'inherit', cwd: root }
    );
} else {
    execSync(`cd "${buildDir}" && zip -r "${outZip}" .`, { stdio: 'inherit' });
}

console.log(`Готово: ${outZip}`);
