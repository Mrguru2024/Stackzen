import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { parse, format, isValid } from 'date-fns';
import { SavedTemplate, TemplateVersion } from '@/types/template';

// Common date formats
export const _dateFormats = [
  { value: 'yyyy-MM-dd', label: 'YYYY-MM-DD' },
  { value: 'MM/dd/yyyy', label: 'MM/DD/YYYY' },
  { value: 'dd/MM/yyyy', label: 'DD/MM/YYYY' },
  { value: 'yyyy/MM/dd', label: 'YYYY/MM/DD' },
  { value: 'MM-dd-yyyy', label: 'MM-DD-YYYY' },
  { value: 'dd-MM-yyyy', label: 'DD-MM-YYYY' },
] as const;

// Field mappings for CSV/Excel imports
export const fieldMappings = {
  expenses: {
    amount: ['amount', 'value', 'cost', 'price'],
    category: ['category', 'type', 'expense_type'],
    description: ['description', 'note', 'details', 'memo'],
    date: ['date', 'transaction_date', 'purchase_date'],
  },
  income: {
    amount: ['amount', 'value', 'income', 'revenue'],
    source: ['source', 'income_source', 'from'],
    description: ['description', 'note', 'details', 'memo'],
    date: ['date', 'income_date', 'received_date'],
  },
  goals: {
    title: ['title', 'name', 'goal_name'],
    target: ['target', 'goal_amount', 'target_amount'],
    current: ['current', 'current_amount', 'saved'],
    deadline: ['deadline', 'target_date', 'due_date'],
  },
  challenges: {
    title: ['title', 'name', 'challenge_name'],
    description: ['description', 'note', 'details'],
    startDate: ['start_date', 'start', 'begin_date'],
    endDate: ['end_date', 'end', 'finish_date'],
    target: ['target', 'target_amount', 'goal_amount'],
  },
} as const;

// Create a date parser with custom format
const createDateParser = (dateFormat: string) => (str: string) => {
  const date = parse(str, dateFormat, new Date());
  if (!isValid(date)) {
    throw new Error(`Invalid date format. Expected ${dateFormat}`);
  }
  return date;
};

// Create validation schemas with custom date format
const createValidationSchemas = (dateFormat: string) => {
  const parseDate = createDateParser(dateFormat);

  return {
    expenseSchema: z.object({
      amount: z.number().positive(),
      category: z.string().min(1, 'Category is required'),
      description: z.string().optional(),
      date: z.string().transform(parseDate),
    }),

    incomeSchema: z.object({
      amount: z.number().positive(),
      source: z.string().min(1, 'Source is required'),
      description: z.string().optional(),
      date: z.string().transform(parseDate),
    }),

    goalSchema: z.object({
      title: z.string().min(1, 'Title is required'),
      target: z.number().positive(),
      current: z.number().min(0),
      deadline: z.string().transform(parseDate).optional(),
    }),

    challengeSchema: z.object({
      title: z.string().min(1, 'Title is required'),
      description: z.string().optional(),
      startDate: z.string().transform(parseDate),
      endDate: z.string().transform(parseDate),
      target: z.number().positive(),
    }),
  };
};

// Validation schemas for each data type
const expenseSchema = z.object({
  amount: z.number().positive(),
  category: z.string().min(1, 'Category is required'),
  description: z.string().optional(),
  date: z.string().transform(str => {
    const date = parse(str, 'yyyy-MM-dd', new Date());
    if (!isValid(date)) {
      throw new Error('Invalid date format. Use YYYY-MM-DD');
    }
    return date;
  }),
});

const incomeSchema = z.object({
  amount: z.number().positive(),
  source: z.string().min(1, 'Source is required'),
  description: z.string().optional(),
  date: z.string().transform(str => {
    const date = parse(str, 'yyyy-MM-dd', new Date());
    if (!isValid(date)) {
      throw new Error('Invalid date format. Use YYYY-MM-DD');
    }
    return date;
  }),
});

const goalSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  target: z.number().positive(),
  current: z.number().min(0),
  deadline: z
    .string()
    .transform(str => {
      const date = parse(str, 'yyyy-MM-dd', new Date());
      if (!isValid(date)) {
        throw new Error('Invalid date format. Use YYYY-MM-DD');
      }
      return date;
    })
    .optional(),
});

const challengeSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  startDate: z.string().transform(str => {
    const date = parse(str, 'yyyy-MM-dd', new Date());
    if (!isValid(date)) {
      throw new Error('Invalid date format. Use YYYY-MM-DD');
    }
    return date;
  }),
  endDate: z.string().transform(str => {
    const date = parse(str, 'yyyy-MM-dd', new Date());
    if (!isValid(date)) {
      throw new Error('Invalid date format. Use YYYY-MM-DD');
    }
    return date;
  }),
  target: z.number().positive(),
});

// Schema for validating imported data
const importSchema = z.object({
  expenses: z.array(expenseSchema).optional(),
  income: z.array(incomeSchema).optional(),
  goals: z.array(goalSchema).optional(),
  challenges: z.array(challengeSchema).optional(),
});

type ImportData = z.infer<typeof importSchema>;

export type ImportPreview = {
  type: 'expenses' | 'income' | 'goals' | 'challenges';
  data: any[];
  headers: string[];
  errors?: string[];
};

// Template data for each type
const templateData = {
  expenses: [
    {
      amount: 50.0,
      category: 'Groceries',
      description: 'Weekly groceries',
      date: format(new Date(), 'yyyy-MM-dd'),
    },
    {
      amount: 25.0,
      category: 'Transportation',
      description: 'Bus fare',
      date: format(new Date(), 'yyyy-MM-dd'),
    },
  ],
  income: [
    {
      amount: 1000.0,
      source: 'Salary',
      description: 'Monthly salary',
      date: format(new Date(), 'yyyy-MM-dd'),
    },
    {
      amount: 100.0,
      source: 'Freelance',
      description: 'Project payment',
      date: format(new Date(), 'yyyy-MM-dd'),
    },
  ],
  goals: [
    {
      title: 'Emergency Fund',
      target: 10000.0,
      current: 5000.0,
      deadline: format(new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
    },
    {
      title: 'Vacation Savings',
      target: 2000.0,
      current: 500.0,
      deadline: format(new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
    },
  ],
  challenges: [
    {
      title: 'No Spend Month',
      description: 'Avoid unnecessary expenses',
      startDate: format(new Date(), 'yyyy-MM-dd'),
      endDate: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
      target: 500.0,
    },
    {
      title: 'Save More Challenge',
      description: 'Increase savings rate',
      startDate: format(new Date(), 'yyyy-MM-dd'),
      endDate: format(new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
      target: 1000.0,
    },
  ],
};

// Validation rules for each data type
export const _validationRules = {
  expenses: {
    amount: 'Must be a positive number',
    category: 'Required, cannot be empty',
    description: 'Optional',
    date: 'Must be in YYYY-MM-DD format',
  },
  income: {
    amount: 'Must be a positive number',
    source: 'Required, cannot be empty',
    description: 'Optional',
    date: 'Must be in YYYY-MM-DD format',
  },
  goals: {
    title: 'Required, cannot be empty',
    target: 'Must be a positive number',
    current: 'Must be a non-negative number',
    deadline: 'Must be in YYYY-MM-DD format',
  },
  challenges: {
    title: 'Required, cannot be empty',
    description: 'Optional',
    startDate: 'Must be in YYYY-MM-DD format',
    endDate: 'Must be in YYYY-MM-DD format',
    target: 'Must be a positive number',
  },
};

// Category mapping type
export type CategoryMapping = {
  [key: string]: string;
};

// Template customization options
export type TemplateOptions = {
  includeExampleData: boolean;
  customFields?: {
    [key: string]: {
      type: 'string' | 'number' | 'date' | 'boolean';
      required: boolean;
      description?: string;
    };
  };
};

// Update TransformOptions to include category mapping
export type TransformOptions = {
  currency?: {
    from: string;
    to: string;
    rate?: number;
  };
  dateFormat?: string;
  numberFormat?: {
    decimalSeparator: string;
    thousandsSeparator: string;
  };
  categoryMapping?: CategoryMapping;
};

// Transform a value based on options
const transformValue = (value: any, field: string, options: TransformOptions) => {
  if (value === undefined || value === null) return value;

  // Handle currency conversion
  if (options.currency && (field === 'amount' || field === 'target' || field === 'current')) {
    const amount = typeof value === 'string' ? parseFloat(value) : value;
    if (!isNaN(amount) && options.currency.rate) {
      return amount * options.currency.rate;
    }
  }

  // Handle number formatting
  if (options.numberFormat && typeof value === 'number') {
    return value
      .toString()
      .replace(/\B(?=(\d{3})+(?!\d))/g, options.numberFormat.thousandsSeparator);
  }

  return value;
};

// Transform a row based on options
const transformRow = (row: any, type: keyof typeof fieldMappings, options: TransformOptions) => {
  const transformed: any = {};
  const fields = fieldMappings[type];

  Object.entries(fields).forEach(([targetField, _possibleValues]) => {
    const value = row[targetField];
    if (value !== undefined) {
      // Handle category mapping
      if (targetField === 'category' && options.categoryMapping) {
        transformed[targetField] = options.categoryMapping[value] || value;
      } else {
        transformed[targetField] = transformValue(value, targetField, options);
      }
    }
  });

  return transformed;
};

// Generate template with customization options
export function generateTemplate(
  type: keyof typeof templateData,
  format: 'json' | 'csv' | 'xlsx',
  options: TemplateOptions = { includeExampleData: true }
): Blob {
  let data = options.includeExampleData ? templateData[type] : [];

  // Add custom fields if specified
  if (options.customFields) {
    data = data.map(row => ({
      ...row,
      ...Object.entries(options.customFields).reduce(
        (acc, [field, config]) => ({
          ...acc,
          [field]:
            config.type === 'string'
              ? ''
              : config.type === 'number'
                ? 0
                : config.type === 'date'
                  ? format(new Date(), 'yyyy-MM-dd')
                  : config.type === 'boolean'
                    ? false
                    : '',
        }),
        {}
      ),
    }));
  }

  if (format === 'json') {
    const jsonData = { [type]: data };
    return new Blob([JSON.stringify(jsonData, null, 2)], {
      type: 'application/json',
    });
  }

  if (format === 'csv') {
    const csv = Papa.unparse(data);
    return new Blob([csv], { type: 'text/csv' });
  }

  if (format === 'xlsx') {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, type);
    const excelBuffer = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array',
    });
    return new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
  }

  throw new Error('Unsupported format');
}

// Get available categories for mapping
export async function getAvailableCategories(userId: string): Promise<string[]> {
  const categories = await prisma.expense.findMany({
    where: { userId },
    select: { category: true },
    distinct: ['category'],
  });
  return categories.map(c => c.category);
}

export async function importData(userId: string, data: ImportData) {
  try {
    // Validate the imported data
    const validatedData = importSchema.parse(data);

    // Import data in a transaction
    await prisma.$transaction(async tx => {
      // Import expenses
      if (validatedData.expenses?.length) {
        await tx.expense.createMany({
          data: validatedData.expenses.map(expense => ({
            ...expense,
            userId,
          })),
        });
      }

      // Import income
      if (validatedData.income?.length) {
        await tx.income.createMany({
          data: validatedData.income.map(income => ({
            ...income,
            userId,
          })),
        });
      }

      // Import goals
      if (validatedData.goals?.length) {
        await tx.goal.createMany({
          data: validatedData.goals.map(goal => ({
            ...goal,
            userId,
          })),
        });
      }

      // Import challenges
      if (validatedData.challenges?.length) {
        await tx.challenge.createMany({
          data: validatedData.challenges.map(challenge => ({
            ...challenge,
            userId,
          })),
        });
      }
    });

    return {
      success: true,
      message: 'Data imported successfully',
      summary: {
        expenses: validatedData.expenses?.length || 0,
        income: validatedData.income?.length || 0,
        goals: validatedData.goals?.length || 0,
        challenges: validatedData.challenges?.length || 0,
      },
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        message: 'Invalid data format',
        errors: error.errors.map(err => ({
          path: err.path.join('.'),
          message: err.message,
        })),
      };
    }
    throw error;
  }
}

export function validateImportFile(file: File): Promise<ImportData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = event => {
      try {
        const _data = JSON.parse(event.target?.result as string);
        resolve(data);
      } catch (error) {
        reject(new Error('Invalid JSON file'));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsText(file);
  });
}

export async function parseFileToImportData(
  file: File,
  options: {
    dateFormat?: string;
    fieldMapping?: Record<string, string>;
    dataType?: keyof typeof fieldMappings;
  } = {}
): Promise<ImportData> {
  const { dateFormat = 'yyyy-MM-dd', fieldMapping, dataType } = options;
  const schemas = createValidationSchemas(dateFormat);
  const data: ImportData = {};

  const mapFields = (row: any, type: keyof typeof fieldMappings) => {
    const mapping = fieldMapping || {};
    const possibleFields = fieldMappings[type];
    const mappedRow: any = {};

    Object.entries(possibleFields).forEach(([targetField, _possibleValues]) => {
      const sourceField = mapping[targetField] || targetField;
      const value = row[sourceField];

      if (value !== undefined) {
        // Handle date fields
        if (targetField.includes('date') || targetField === 'deadline') {
          mappedRow[targetField] = value;
        }
        // Handle numeric fields
        else if (
          targetField === 'amount' ||
          targetField === 'target' ||
          targetField === 'current'
        ) {
          mappedRow[targetField] = parseFloat(value);
        }
        // Handle string fields
        else {
          mappedRow[targetField] = value;
        }
      }
    });

    return mappedRow;
  };

  if (file.type === 'application/json') {
    return validateImportFile(file);
  } else if (file.type === 'text/csv') {
    const result = await new Promise<Papa.ParseResult<any>>((resolve, _reject) => {
      Papa.parse(file, {
        header: true,
        complete: resolve,
        error: _reject,
      });
    });

    if (dataType) {
      const mappedData = result.data.map(row => mapFields(row, dataType));
      data[dataType] = mappedData;
    } else {
      // Auto-detect data type based on headers
      const headers = result.meta.fields || [];
      if (
        headers.some(h => fieldMappings.expenses.amount.includes(h)) &&
        headers.some(h => fieldMappings.expenses.category.includes(h))
      ) {
        data.expenses = result.data.map(row => mapFields(row, 'expenses'));
      } else if (
        headers.some(h => fieldMappings.income.amount.includes(h)) &&
        headers.some(h => fieldMappings.income.source.includes(h))
      ) {
        data.income = result.data.map(row => mapFields(row, 'income'));
      }
    }
  } else if (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer);
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(firstSheet);

    if (dataType) {
      const mappedData = jsonData.map((row: any) => mapFields(row, dataType));
      data[dataType] = mappedData;
    } else {
      // Auto-detect data type based on headers
      const headers = Object.keys(jsonData[0] || {});
      if (
        headers.some(h => fieldMappings.expenses.amount.includes(h)) &&
        headers.some(h => fieldMappings.expenses.category.includes(h))
      ) {
        data.expenses = jsonData.map((row: any) => mapFields(row, 'expenses'));
      } else if (
        headers.some(h => fieldMappings.income.amount.includes(h)) &&
        headers.some(h => fieldMappings.income.source.includes(h))
      ) {
        data.income = jsonData.map((row: any) => mapFields(row, 'income'));
      }
    }
  }

  return data;
}

// Bulk import result type
export type BulkImportResult = {
  success: boolean;
  files: {
    name: string;
    success: boolean;
    message?: string;
    summary?: {
      expenses: number;
      income: number;
      goals: number;
      challenges: number;
    };
  }[];
  total: {
    expenses: number;
    income: number;
    goals: number;
    challenges: number;
  };
};

export async function bulkImport(
  userId: string,
  files: File[],
  options: TransformOptions = {}
): Promise<BulkImportResult> {
  const result: BulkImportResult = {
    success: true,
    files: [],
    total: {
      expenses: 0,
      income: 0,
      goals: 0,
      challenges: 0,
    },
  };

  for (const file of files) {
    try {
      const importData = await parseFileToImportData(file, {
        dateFormat: options.dateFormat,
        dataType: undefined, // Auto-detect type
      });

      // Transform the data
      if (importData.expenses) {
        importData.expenses = importData.expenses.map(row =>
          transformRow(row, 'expenses', options)
        );
      }
      if (importData.income) {
        importData.income = importData.income.map(row => transformRow(row, 'income', options));
      }
      if (importData.goals) {
        importData.goals = importData.goals.map(row => transformRow(row, 'goals', options));
      }
      if (importData.challenges) {
        importData.challenges = importData.challenges.map(row =>
          transformRow(row, 'challenges', options)
        );
      }

      // Import the data
      const importResult = await importData(userId, importData);

      result.files.push({
        name: file.name,
        success: importResult.success,
        message: importResult.message,
        summary: importResult.summary,
      });

      if (importResult.summary) {
        result.total.expenses += importResult.summary.expenses;
        result.total.income += importResult.summary.income;
        result.total.goals += importResult.summary.goals;
        result.total.challenges += importResult.summary.challenges;
      }
    } catch (error) {
      result.files.push({
        name: file.name,
        success: false,
        message: error instanceof Error ? error.message : 'Import failed',
      });
      result.success = false;
    }
  }

  return result;
}

// Template version type
export type TemplateVersion = {
  id: string;
  templateId: string;
  version: number;
  changes: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
  createdBy: string;
  createdAt: Date;
};

// Update SavedTemplate type to include version info
export type SavedTemplate = {
  id: string;
  name: string;
  type: keyof typeof templateData;
  format: 'json' | 'csv' | 'xlsx';
  options: TemplateOptions;
  category?: string;
  tags: string[];
  isPublic: boolean;
  sharedWith: string[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  currentVersion: number;
  versions: TemplateVersion[];
};

// Save template with versioning
export async function saveTemplate(
  userId: string,
  name: string,
  type: keyof typeof templateData,
  format: 'json' | 'csv' | 'xlsx',
  options: TemplateOptions,
  category?: string,
  tags: string[] = [],
  isPublic = false,
  sharedWith: string[] = []
): Promise<SavedTemplate> {
  return prisma.$transaction(async tx => {
    const template = await tx.template.create({
      data: {
        name,
        type,
        format,
        options: options as any,
        category,
        tags,
        isPublic,
        sharedWith,
        createdBy: userId,
        currentVersion: 1,
      },
    });

    // Create initial version
    await tx.templateVersion.create({
      data: {
        templateId: template.id,
        version: 1,
        changes: [],
        createdBy: userId,
      },
    });

    return {
      ...template,
      versions: [],
    };
  });
}

// Update template with versioning
export async function updateTemplate(
  templateId: string,
  updates: Partial<
    Omit<SavedTemplate, 'id' | 'createdBy' | 'createdAt' | 'currentVersion' | 'versions'>
  >,
  userId: string
): Promise<SavedTemplate> {
  return prisma.$transaction(async tx => {
    const template = await tx.template.findUnique({
      where: { id: templateId },
      include: { versions: true },
    });

    if (!template) {
      throw new Error('Template not found');
    }

    // Track changes
    const changes: TemplateVersion['changes'] = [];
    Object.entries(updates).forEach(([field, newValue]) => {
      const oldValue = template[field as keyof typeof template];
      if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        changes.push({
          field,
          oldValue,
          newValue,
        });
      }
    });

    if (changes.length === 0) {
      return template;
    }

    // Create new version
    const newVersion = await tx.templateVersion.create({
      data: {
        templateId,
        version: template.currentVersion + 1,
        changes,
        createdBy: userId,
      },
    });

    // Update template
    const updatedTemplate = await tx.template.update({
      where: { id: templateId },
      data: {
        ...updates,
        currentVersion: newVersion.version,
      },
      include: { versions: true },
    });

    return updatedTemplate;
  });
}

// Get template version history
export async function getTemplateVersions(templateId: string): Promise<TemplateVersion[]> {
  return prisma.templateVersion.findMany({
    where: { templateId },
    orderBy: { version: 'desc' },
  });
}

// Restore template to a specific version
export async function restoreTemplateVersion(
  templateId: string,
  version: number,
  userId: string
): Promise<SavedTemplate> {
  return prisma.$transaction(async tx => {
    const template = await tx.template.findUnique({
      where: { id: templateId },
      include: { versions: true },
    });

    if (!template) {
      throw new Error('Template not found');
    }

    const targetVersion = template.versions.find(v => v.version === version);
    if (!targetVersion) {
      throw new Error('Version not found');
    }

    // Apply all changes up to the target version
    const updates: any = {};
    template.versions
      .filter(v => v.version <= version)
      .forEach(v => {
        v.changes.forEach(change => {
          updates[change.field] = change.newValue;
        });
      });

    // Create new version for the restore
    const newVersion = await tx.templateVersion.create({
      data: {
        templateId,
        version: template.currentVersion + 1,
        changes: [
          {
            field: 'version_restore',
            oldValue: template.currentVersion,
            newValue: version,
          },
        ],
        createdBy: userId,
      },
    });

    // Update template
    const updatedTemplate = await tx.template.update({
      where: { id: templateId },
      data: {
        ...updates,
        currentVersion: newVersion.version,
      },
      include: { versions: true },
    });

    return updatedTemplate;
  });
}

// Load saved templates with filtering
export async function loadTemplates(
  userId: string,
  options: {
    category?: string;
    tags?: string[];
    includePublic?: boolean;
    includeShared?: boolean;
  } = {}
): Promise<SavedTemplate[]> {
  const { category, tags, includePublic = true, includeShared = true } = options;

  return prisma.template.findMany({
    where: {
      OR: [
        { createdBy: userId },
        ...(includePublic ? [{ isPublic: true }] : []),
        ...(includeShared ? [{ sharedWith: { has: userId } }] : []),
      ],
      ...(category ? { category } : {}),
      ...(tags?.length ? { tags: { hasEvery: tags } } : {}),
    },
    orderBy: { updatedAt: 'desc' },
  });
}

// Get template categories
export async function getTemplateCategories(userId: string): Promise<string[]> {
  const templates = await prisma.template.findMany({
    where: {
      OR: [{ createdBy: userId }, { isPublic: true }, { sharedWith: { has: userId } }],
    },
    select: { category: true },
    distinct: ['category'],
  });
  return templates.map(t => t.category).filter(Boolean) as string[];
}

// Get template tags
export async function getTemplateTags(userId: string): Promise<string[]> {
  const templates = await prisma.template.findMany({
    where: {
      OR: [{ createdBy: userId }, { isPublic: true }, { sharedWith: { has: userId } }],
    },
    select: { tags: true },
  });
  const allTags = templates.flatMap(t => t.tags);
  return [...new Set(allTags)];
}

// Share template with users
export async function shareTemplate(templateId: string, userIds: string[]): Promise<SavedTemplate> {
  return prisma.template.update({
    where: { id: templateId },
    data: {
      sharedWith: {
        push: userIds,
      },
    },
  });
}

// Unshare template from users
export async function unshareTemplate(
  templateId: string,
  userIds: string[]
): Promise<SavedTemplate> {
  const template = await prisma.template.findUnique({
    where: { id: templateId },
    select: { sharedWith: true },
  });

  if (!template) {
    throw new Error('Template not found');
  }

  return prisma.template.update({
    where: { id: templateId },
    data: {
      sharedWith: template.sharedWith.filter(id => !userIds.includes(id)),
    },
  });
}

// Update template visibility
export async function updateTemplateVisibility(
  templateId: string,
  isPublic: boolean
): Promise<SavedTemplate> {
  return prisma.template.update({
    where: { id: templateId },
    data: { isPublic },
  });
}

// Delete saved template
export async function deleteTemplate(templateId: string): Promise<void> {
  await prisma.template.delete({
    where: { id: templateId },
  });
}

// Validate custom fields against data
export function validateCustomFields(
  data: any[],
  customFields: NonNullable<TemplateOptions['customFields']>
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  data.forEach((row, index) => {
    Object.entries(customFields).forEach(([field, config]) => {
      const value = row[field];

      // Check required fields
      if (config.required && (value === undefined || value === null || value === '')) {
        errors.push(`Row ${index + 1}: ${field} is required`);
      }

      // Validate field types
      if (value !== undefined && value !== null && value !== '') {
        switch (config.type) {
          case 'number':
            if (isNaN(Number(value))) {
              errors.push(`Row ${index + 1}: ${field} must be a number`);
            }
            break;
          case 'date':
            if (!isValid(new Date(value))) {
              errors.push(`Row ${index + 1}: ${field} must be a valid date`);
            }
            break;
          case 'boolean':
            if (
              typeof value !== 'boolean' &&
              !['true', 'false', 'yes', 'no', '1', '0'].includes(String(value).toLowerCase())
            ) {
              errors.push(`Row ${index + 1}: ${field} must be a boolean value`);
            }
            break;
        }
      }
    });
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}

// Template export type
export interface TemplateExport {
  template: SavedTemplate;
  versions: TemplateVersion[];
  metadata: {
    exportedAt: string;
    version: string;
    exportFormat: 'json';
  };
}

// Export template to file
export async function exportTemplate(
  template: SavedTemplate,
  versions: TemplateVersion[]
): Promise<Blob> {
  const exportData: TemplateExport = {
    template,
    versions,
    metadata: {
      exportedAt: new Date().toISOString(),
      version: '1.0',
      exportFormat: 'json',
    },
  };

  const blob = new Blob([JSON.stringify(exportData, null, 2)], {
    type: 'application/json',
  });

  return blob;
}

// Import template from file
export async function importTemplate(file: File): Promise<{
  template: SavedTemplate;
  versions: TemplateVersion[];
}> {
  const text = await file.text();
  const _data = JSON.parse(text) as TemplateExport;

  // Validate the export format
  if (!data.metadata || data.metadata.exportFormat !== 'json') {
    throw new Error('Invalid export format');
  }

  // Validate the template data
  if (!data.template || !data.versions) {
    throw new Error('Invalid template data');
  }

  // Validate versions
  if (!Array.isArray(data.versions)) {
    throw new Error('Invalid versions data');
  }

  // Validate each version
  data.versions.forEach(version => {
    if (!version.version || !version.createdAt || !Array.isArray(version.changes)) {
      throw new Error('Invalid version data');
    }
  });

  return {
    template: data.template,
    versions: data.versions,
  };
}

// Validate template export
export function validateTemplateExport(data: unknown): data is TemplateExport {
  if (!data || typeof data !== 'object') return false;

  const exportData = data as TemplateExport;

  // Check metadata
  if (
    !exportData.metadata ||
    typeof exportData.metadata !== 'object' ||
    exportData.metadata.exportFormat !== 'json'
  ) {
    return false;
  }

  // Check template
  if (!exportData.template || typeof exportData.template !== 'object') {
    return false;
  }

  // Check versions
  if (!Array.isArray(exportData.versions)) {
    return false;
  }

  // Validate each version
  return exportData.versions.every(version => {
    return (
      typeof version === 'object' &&
      typeof version.version === 'number' &&
      typeof version.createdAt === 'string' &&
      Array.isArray(version.changes)
    );
  });
}
