
import { Request, Response } from 'express';
import Transaction from '../models/Transaction';
import { Parser } from 'json2csv';

// ✅ Return all transactions (no user filtering)
export const getTransactions = async (req: Request, res: Response) => {
  try {
    const transactions = await Transaction.find();
    res.json(transactions);
  } catch (err) {
    console.error('❌ Error fetching transactions:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ✅ Export transactions as CSV file
export const exportTransactions = async (req: Request, res: Response) => {
  try {
    const transactions = await Transaction.find();

    const fields = ['date', 'amount', 'category'];
    const parser = new Parser({ fields });
    const csv = parser.parse(transactions);

    res.header('Content-Type', 'text/csv');
    res.attachment('transactions.csv');
    res.send(csv);
  } catch (err) {
    console.error('❌ Error exporting CSV:', err);
    res.status(500).json({ message: 'Export failed' });
  }
};





// import { Request, Response } from 'express';
// import Transaction from '../models/Transaction';
// import { Parser } from 'json2csv';

// // ======================
// // GET /api/transactions
// // ======================
// export const getTransactions = async (req: Request, res: Response) => {
//   try {
//     const {
//       search = '',
//       category,
//       status,
//       user_id,
//       minAmount,
//       maxAmount,
//       sort = 'date',
//       order = 'desc',
//       page = 1,
//       limit = 10
//     } = req.query;

//     const filter: any = {};

//     if (category) filter.category = category;
//     if (status) filter.status = status;
//     if (user_id) filter.user_id = user_id;
//     if (minAmount || maxAmount) {
//       filter.amount = {};
//       if (minAmount) filter.amount.$gte = Number(minAmount);
//       if (maxAmount) filter.amount.$lte = Number(maxAmount);
//     }
//     if (search) {
//       filter.$or = [
//         { user_id: { $regex: search, $options: 'i' } },
//         { category: { $regex: search, $options: 'i' } },
//         { status: { $regex: search, $options: 'i' } }
//       ];
//     }

//     const sortOption: any = {};
//     sortOption[sort as string] = order === 'asc' ? 1 : -1;

//     const pageNumber = parseInt(page as string);
//     const pageSize = parseInt(limit as string);
//     const skip = (pageNumber - 1) * pageSize;

//     const total = await Transaction.countDocuments(filter);
//     const transactions = await Transaction.find(filter)
//       .sort(sortOption)
//       .skip(skip)
//       .limit(pageSize);

//     res.json({
//       data: transactions,
//       page: pageNumber,
//       limit: pageSize,
//       total
//     });
//   } catch (error) {
//     res.status(500).json({ error: 'Failed to fetch transactions' });
//   }
// };

// // ==============================
// // GET /api/transactions/export
// // ==============================
// export const exportTransactions = async (req: Request, res: Response) => {
//   try {
//     const { fields, ...filters } = req.query;

//     // Get selected fields as array
//     const selectedFields = typeof fields === 'string' ? fields.split(',') : [];

//     // Basic filtering (can expand later)
//     const query: any = {};
//     if (filters.category) query.category = filters.category;
//     if (filters.status) query.status = filters.status;
//     if (filters.user_id) query.user_id = filters.user_id;

//     const transactions = await Transaction.find(query).lean();

//     // Convert to CSV using selected fields
//     const parser = new Parser({ fields: selectedFields });
//     const csv = parser.parse(transactions);

//     // Send CSV file
//     res.header('Content-Type', 'text/csv');
//     res.attachment('transactions.csv');
//     res.send(csv);
//   } catch (error) {
//     res.status(500).json({ message: 'Failed to export transactions' });
//   }
// };
