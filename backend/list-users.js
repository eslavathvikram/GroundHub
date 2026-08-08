const mongoose = require('mongoose');
const User = require('./models/user');

mongoose.connect('mongodb://127.0.0.1:27017/ground-booking').then(async () => {
  const providers = await User.find({ role: 'provider' }).select('name email createdAt -_id');
  console.log('=== Service Provider Accounts ===');
  if (providers.length === 0) {
    console.log('No service providers found.');
  } else {
    providers.forEach((p, i) => {
      console.log((i + 1) + '. ' + p.name + ' -- ' + p.email);
    });
    console.log('\nTotal: ' + providers.length + ' provider(s)');
  }

  console.log('\n=== Customer Accounts ===');
  const customers = await User.find({ role: 'customer' }).select('name email -_id');
  if (customers.length === 0) {
    console.log('No customers found.');
  } else {
    customers.forEach((c, i) => {
      console.log((i + 1) + '. ' + c.name + ' -- ' + c.email);
    });
    console.log('\nTotal: ' + customers.length + ' customer(s)');
  }

  mongoose.disconnect();
}).catch(e => {
  console.error('DB error:', e.message);
  process.exit(1);
});
