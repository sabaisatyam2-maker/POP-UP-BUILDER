const fs = require('fs');
try {
  fs.unlinkSync('app/routes/test_db.tsx');
  console.log('File deleted.');
} catch(e) {
  console.log('Error:', e.message);
}
