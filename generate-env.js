// Generate env-config.js from .env file
const fs = require('fs');
const path = require('path');

// Read .env file
const envPath = path.join(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');

// Parse .env file
const config = {};
envContent.split('\n').forEach(line => {
    line = line.trim();
    if (line && !line.startsWith('#')) {
        const [key, ...valueParts] = line.split('=');
        const value = valueParts.join('=').trim();
        if (key && value) {
            // Remove VITE_ prefix for our use
            const configKey = key.replace('VITE_', '');
            config[configKey] = value;
        }
    }
});

// Generate JavaScript file
const jsContent = `// Auto-generated from .env - DO NOT EDIT MANUALLY
// Run 'node generate-env.js' to regenerate

window.ENV_CONFIG = ${JSON.stringify(config, null, 4)};

console.log('✅ Environment configuration loaded');
`;

// Write to env-config.js
fs.writeFileSync(path.join(__dirname, 'env-config.js'), jsContent);
console.log('✅ env-config.js generated successfully from .env');
