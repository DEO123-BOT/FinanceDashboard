import mongoose, { Document, Schema } from 'mongoose';

export interface ITransaction extends Document {
  id: number;
  date: Date;
  amount: number;
  category: 'Revenue' | 'Expense';
  status: 'Paid' | 'Pending';
  user_id: string;
  user_profile: string;
}

const TransactionSchema: Schema = new Schema({
  id: { type: Number, required: true, unique: true },
  date: { type: Date, required: true },
  amount: { type: Number, required: true },
  category: { type: String, enum: ['Revenue', 'Expense'], required: true },
  status: { type: String, enum: ['Paid', 'Pending'], required: true },
  user_id: { type: String, required: true },
  user_profile: { type: String, required: true }
});

export default mongoose.model<ITransaction>('Transaction', TransactionSchema);
