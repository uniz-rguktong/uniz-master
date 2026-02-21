const express = require('express');
const axios = require('axios');
const app = express();
app.get('/test', async (req, res) => {
  const resp = await axios.get('https://api.github.com/users/github', { responseType: 'arraybuffer' });
  Object.entries(resp.headers).forEach(([k, v]) => res.setHeader(k, v));
  res.status(resp.status).send(resp.data);
});
app.listen(3015);
