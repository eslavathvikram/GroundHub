const mongoose = require('mongoose');
const User = require('./models/user');
const Ground = require('./models/ground');
const Booking = require('./models/booking');

mongoose.connect('mongodb://127.0.0.1:27017/ground-booking').then(async () => {
  const users = await User.deleteMany({});
  const grounds = await Ground.deleteMany({});
  const bookings = await Booking.deleteMany({});

  console.log('=== Database Cleared ===');
  console.log('Users deleted: ' + users.deletedCount);
  console.log('Grounds deleted: ' + grounds.deletedCount);
  console.log('Bookings deleted: ' + bookings.deletedCount);
  console.log('\nDatabase is now empty.');

  mongoose.disconnect();
}).catch(e => {
  console.error('DB error:', e.message);
  process.exit(1);
});
