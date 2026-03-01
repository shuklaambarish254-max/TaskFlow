const mongoose = require('mongoose');
const connectDB = require('./config/db');

async function main() {
  await connectDB();

  const db = mongoose.connection.db;
  try {
    const cols = await db.listCollections().toArray();
    console.log('Collections in DB:', cols.map(c => c.name));
  } catch (err) {
    console.error('Failed to list collections:', err.message);
  } finally {
    // Close the connection cleanly
    await mongoose.disconnect();
    console.log('Disconnected');
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
