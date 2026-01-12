export interface ProductCSVRow {
  name: string;
  description?: string;
  price: number;
  category: 'Pet' | 'Farm';
  product_type?: string;
  stock?: number;
  badge?: string;
  discount?: number;
}

export interface ParseResult {
  success: boolean;
  data: ProductCSVRow[];
  errors: { row: number; message: string }[];
}

export function parseCSV(csvText: string): ParseResult {
  const lines = csvText.trim().split('\n');
  const errors: { row: number; message: string }[] = [];
  const data: ProductCSVRow[] = [];

  if (lines.length < 2) {
    return { success: false, data: [], errors: [{ row: 0, message: 'CSV must have a header row and at least one data row' }] };
  }

  // Parse header
  const headerLine = lines[0];
  const headers = parseCSVLine(headerLine).map(h => h.toLowerCase().trim());

  // Validate required headers
  const requiredHeaders = ['name', 'price', 'category'];
  const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
  
  if (missingHeaders.length > 0) {
    return { 
      success: false, 
      data: [], 
      errors: [{ row: 0, message: `Missing required columns: ${missingHeaders.join(', ')}` }] 
    };
  }

  // Parse data rows
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = parseCSVLine(line);
    const row: Record<string, string> = {};
    
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });

    // Validate row
    const rowErrors: string[] = [];

    if (!row.name?.trim()) {
      rowErrors.push('Name is required');
    }

    const price = parseFloat(row.price);
    if (isNaN(price) || price < 0) {
      rowErrors.push('Price must be a valid positive number');
    }

    const category = row.category?.trim();
    if (category !== 'Pet' && category !== 'Farm') {
      rowErrors.push('Category must be "Pet" or "Farm"');
    }

    if (rowErrors.length > 0) {
      errors.push({ row: i + 1, message: rowErrors.join('; ') });
      continue;
    }

    // Build product object
    const product: ProductCSVRow = {
      name: row.name.trim(),
      price: price,
      category: category as 'Pet' | 'Farm',
    };

    if (row.description?.trim()) {
      product.description = row.description.trim();
    }

    if (row.product_type?.trim()) {
      product.product_type = row.product_type.trim();
    }

    if (row.stock?.trim()) {
      const stock = parseInt(row.stock);
      if (!isNaN(stock) && stock >= 0) {
        product.stock = stock;
      }
    }

    if (row.badge?.trim()) {
      product.badge = row.badge.trim();
    }

    if (row.discount?.trim()) {
      const discount = parseFloat(row.discount);
      if (!isNaN(discount) && discount >= 0 && discount <= 100) {
        product.discount = discount;
      }
    }

    data.push(product);
  }

  return {
    success: errors.length === 0 && data.length > 0,
    data,
    errors,
  };
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"' && inQuotes && nextChar === '"') {
      current += '"';
      i++;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current);
  return result;
}

export function generateCSVTemplate(): string {
  const headers = ['name', 'description', 'price', 'category', 'product_type', 'stock', 'badge', 'discount'];
  const exampleRow = ['Dog Food Premium', 'High quality dog food', '500', 'Pet', 'Food', '100', 'New', '10'];
  
  return [headers.join(','), exampleRow.join(',')].join('\n');
}

export function downloadCSV(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
