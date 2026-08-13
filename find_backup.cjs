const fs = require('fs');
const path = require('path');
const logPath = 'C:\\Users\\rajes\\.gemini\\antigravity-ide\\brain\\5f4d3ab6-bddf-49e2-a0fa-c9bd92494cd1\\.system_generated\\logs\\transcript_full.jsonl';
const lines = fs.readFileSync(logPath, 'utf-8').split('\n');

for (let i = lines.length - 1; i >= 0; i--) {
  const line = lines[i];
  if (!line) continue;
  try {
    const data = JSON.parse(line);
    if (data.type === 'WRITE_TO_FILE' || data.type === 'REPLACE_FILE_CONTENT') {
       if (data.tool_calls && data.tool_calls.some(call => call.args && typeof call.args.TargetFile === 'string' && call.args.TargetFile.includes('app._index.tsx'))) {
           console.log('Found modified app._index.tsx in step', data.step_index);
           // dump the arguments
           const call = data.tool_calls.find(c => c.args.TargetFile.includes('app._index.tsx'));
           fs.writeFileSync('app_index_backup.txt', call.args.CodeContent || call.args.ReplacementContent || JSON.stringify(call.args));
           console.log('Backup written to app_index_backup.txt');
           break;
       }
    }
  } catch (e) {}
}
