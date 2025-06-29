export const categorizeTransaction = (description: string): string => {
  const desc = description.toLowerCase();

  if (desc.includes('swiggy') || desc.includes('zomato') || desc.includes('uber eats')) {
    return 'Food';
  }
  if (desc.includes('petrol') || desc.includes('shell') || desc.includes('fuel')) {
    return 'Fuel';
  }
  if (desc.includes('flipkart') || desc.includes('amazon') || desc.includes('myntra')) {
    return 'Shopping';
  }
  if (desc.includes('electricity') || desc.includes('water') || desc.includes('gas')) {
    return 'Utilities';
  }
  if (desc.includes('movie') || desc.includes('netflix') || desc.includes('bookmyshow')) {
    return 'Entertainment';
  }
  if (desc.includes('rent') || desc.includes('apartment')) {
    return 'Rent';
  }

  return 'Other';
};
