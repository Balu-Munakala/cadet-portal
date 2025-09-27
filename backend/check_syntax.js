// Simple syntax checker
const fs = require('fs');

try {
  const content = fs.readFileSync('./controllers/masterController.js', 'utf8');
  
  // Count braces
  let openBraces = 0;
  let closeBraces = 0;
  
  for (let i = 0; i < content.length; i++) {
    if (content[i] === '{') openBraces++;
    if (content[i] === '}') closeBraces++;
  }
  
  console.log(`Open braces: ${openBraces}`);
  console.log(`Close braces: ${closeBraces}`);
  console.log(`Balance: ${openBraces - closeBraces}`);
  
  // Try to evaluate syntax
  new Function(content);
  console.log('Syntax appears valid');
} catch (err) {
  console.error('Syntax error:', err.message);
  console.error('At line:', err.line || 'unknown');
}