import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import Transaction from '../models/Transaction';
import { categorizeTransaction } from './categoryHelper';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI!;

const loadTransactions = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ MongoDB connected');

    const filePath = path.join(__dirname, '../../transactions.json');
    const data = fs.readFileSync(filePath, 'utf-8');
    const transactions = JSON.parse(data);

    // Enhance transactions with categories
    const enhanced = transactions.map((t: any) => ({
      ...t,
      description: t.category || 'Generic transaction',
      category: t.category || categorizeTransaction(t.category || ''),
    }));

    await Transaction.deleteMany();
    await Transaction.insertMany(enhanced);

    console.log(`✅ Inserted ${enhanced.length} transactions with categories.`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding transactions:', error);
    process.exit(1);
  }
};

loadTransactions();



// import mongoose from 'mongoose';
// import dotenv from 'dotenv';
// import fs from 'fs';
// import path from 'path';
// import Transaction from '../models/Transaction';

// dotenv.config();

// const MONGO_URI = process.env.MONGO_URI!;

// const loadTransactions = async () => {
//   try {
//     // Connect to DB
//     await mongoose.connect(MONGO_URI);
//     console.log('MongoDB connected');

//     // Read JSON file
//     const filePath = path.join(__dirname, '../../transactions.json');
//     const data = fs.readFileSync(filePath, 'utf-8');
//     const transactions = JSON.parse(data);

//     // Clear existing and insert new
//     await Transaction.deleteMany();
//     await Transaction.insertMany(transactions);

//     console.log(`✅ Inserted ${transactions.length} transactions.`);
//     process.exit(0);
//   } catch (error) {
//     console.error('❌ Error seeding transactions:', error);
//     process.exit(1);
//   }
// };

// loadTransactions();
