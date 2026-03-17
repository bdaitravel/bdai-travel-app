import https from 'https';

https.get('https://api.github.com/repos/bdaitravel/bdai-travel-app/commits/main', {
  headers: { 'User-Agent': 'Node.js' }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const commit = JSON.parse(data);
    console.log(commit.files[0].patch);
  });
});