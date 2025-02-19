require('dotenv').config();
const mongoose = require('mongoose');

const connectToDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Mongodb connected successfully');
  } catch (e) {
    console.error('Mongodb connection failed', e);
    process.exit(1);
  }
};

module.exports = connectToDB;
