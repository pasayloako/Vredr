// This is an optional API endpoint you can use for additional functionality
module.exports = (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  res.status(200).json({
    status: 'success',
    message: 'KJV Bible API is ready',
    version: '1.0.0',
    endpoints: {
      bible_data: 'https://raw.githubusercontent.com/wldeh/bible-api/main/bibles/en-kjv/'
    }
  });
};
