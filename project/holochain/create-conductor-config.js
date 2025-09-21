#!/usr/bin/env node

const fs = require('fs');
const yaml = require('js-yaml');

// Create a minimal valid conductor config
const config = {
  environment_path: 'conductor-data',
  use_dangerous_test_keystore: true,
  admin_interfaces: [
    {
      driver: {
        type: 'websocket',
        port: 4444
      },
      allowed_origins: '*'
    }
  ]
};

// Convert to YAML
const yamlStr = yaml.dump(config);

// Write to file
fs.writeFileSync('conductor-generated.yaml', yamlStr);

console.log('Created conductor-generated.yaml:');
console.log(yamlStr);