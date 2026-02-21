const express = require('express');
const app = express();
app.get('/ok', (req, res) => {
  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.send(Buffer.from('{"a":1}'));
});
app.listen(3015, () => console.log('started'));
