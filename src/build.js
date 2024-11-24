const JavaScriptObfuscator = require('javascript-obfuscator');
const fs = require('fs');
const path = require('path');
const config = require('./obfuscator.config.js');

const obfuscateFile = (filePath) => {
    const code = fs.readFileSync(filePath, 'utf8');
    const obfuscatedCode = JavaScriptObfuscator.obfuscate(code, config).getObfuscatedCode();
    fs.writeFileSync(filePath, obfuscatedCode);
};

const obfuscateBuild = () => {
    const buildDir = path.join(__dirname, '..', '.next');
    const walk = (dir) => {
        const files = fs.readdirSync(dir);
        files.forEach(file => {
            const filePath = path.join(dir, file);
            const stat = fs.statSync(filePath);
            if (stat.isDirectory()) {
                walk(filePath);
            } else if (file.endsWith('.js')) {
                obfuscateFile(filePath);
            }
        });
    };
    walk(buildDir);
};

obfuscateBuild();
