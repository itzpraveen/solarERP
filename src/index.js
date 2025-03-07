const server = require('./server');

// Start the server
const port = process.env.PORT || 5002;
server.listen(port, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${port}`);
});