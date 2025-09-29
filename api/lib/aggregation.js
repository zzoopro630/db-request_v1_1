const escapeRegExp = (string = '') => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const parseItemsSummary = (itemsSummary = '') => {
  const items = [];
  const cleanText = itemsSummary
    .replace(/<br\s*\/?>(\s*)/gi, ' | ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const regex = /([^-]+)\s*-\s*\[([^\]]+)\]\s*([^(|]+)\s*\(([^)]+)\)\s*\(수량:\s*(\d+),\s*금액:\s*([\d,]+)원\)/g;
  let match;

  while ((match = regex.exec(cleanText)) !== null) {
    const [, dbType, category, productName, region, quantity, amount] = match;
    items.push({
      db_type: dbType.trim().replace(/업체$/, ''),
      product_name: `[${category.trim()}] ${productName.trim()}`,
      region: region.trim(),
      quantity: parseInt(quantity, 10),
      total_price: parseInt(amount.replace(/,/g, ''), 10),
    });
  }

  return items;
};

export const stripDbTypePrefix = (name = '', dbType = '') => {
  if (!name || !dbType) return name?.trim?.() || '';
  const pattern = new RegExp(`^${escapeRegExp(dbType)}\s*-\s*`, 'i');
  return name.replace(pattern, '').trim();
};

export const extractCoreProductName = (rawName = '', region = '', dbType = '') => {
  let name = (rawName || '').trim();

  if (region) {
    const regionPattern = new RegExp(`\s*\(${escapeRegExp(region.trim())}\)$`);
    name = name.replace(regionPattern, '').trim();
  }

  const dbTypeClean = dbType.endsWith('업체') ? dbType : `${dbType}업체`;
  name = stripDbTypePrefix(name, dbTypeClean);

  const parts = name
    .split('-')
    .map((part) => part.trim())
    .filter((part) => part.length > 0)
    .filter((part) => part !== dbType && part !== dbTypeClean && part !== dbType.replace(/업체$/, ''));

  return parts.join(' - ').trim();
};

export const aggregateItems = (items = []) => {
  const aggregated = {};

  items.forEach((item) => {
    const dbTypeClean = item.db_type.endsWith('업체') ? item.db_type : `${item.db_type}업체`;
    const sanitizedName = (item.product_name || '').trim();
    const coreName = extractCoreProductName(sanitizedName, item.region, item.db_type);
    const productLabel = coreName ? `${dbTypeClean} - ${coreName}` : dbTypeClean;
    const key = `${dbTypeClean}__${coreName}`;

    if (!aggregated[key]) {
      aggregated[key] = {
        productName: productLabel,
        regions: {},
      };
    }

    if (!aggregated[key].regions[item.region]) {
      aggregated[key].regions[item.region] = {
        quantity: 0,
        amount: 0,
      };
    }

    aggregated[key].regions[item.region].quantity += item.quantity;
    aggregated[key].regions[item.region].amount += item.total_price;
  });

  return Object.values(aggregated).map(({ productName, regions }) => ({
    productName,
    regions: Object.entries(regions).map(([regionName, data]) => ({
      regionName,
      ...data,
    })),
    totalQuantity: Object.values(regions).reduce((sum, r) => sum + r.quantity, 0),
    totalAmount: Object.values(regions).reduce((sum, r) => sum + r.amount, 0),
  }));
};

const resolvePeriod = ({ start, end } = {}) => {
  const now = new Date();
  const startDate = start ? new Date(start) : new Date(now.getFullYear(), now.getMonth(), 1);
  const endDate = end
    ? new Date(end)
    : new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  return {
    start: startDate,
    end: endDate,
    startIso: startDate.toISOString(),
    endIso: endDate.toISOString(),
  };
};

export const buildAggregation = async (supabase, { start, end } = {}) => {
  if (!supabase) {
    throw new Error('Supabase client is required');
  }

  const { startIso, endIso } = resolvePeriod({ start, end });

  const { data: confirmedSubmissions, error: submissionsError } = await supabase
    .from('submissions')
    .select('id, items_summary, total_amount, status')
    .gte('created_at', startIso)
    .lte('created_at', endIso)
    .eq('status', 'confirmed');

  if (submissionsError) {
    throw submissionsError;
  }

  const submissionIds = confirmedSubmissions.map((submission) => submission.id);
  let orderItems = [];

  if (submissionIds.length > 0) {
    const { data: fetchedItems, error: itemsError } = await supabase
      .from('order_items')
      .select('*')
      .in('submission_id', submissionIds);

    if (itemsError) {
      throw itemsError;
    }

    orderItems = fetchedItems || [];
  }

  const submissionsWithItems = new Set(orderItems.map((item) => item.submission_id));

  const legacyItems = confirmedSubmissions
    .filter((submission) => !submissionsWithItems.has(submission.id))
    .flatMap((submission) => parseItemsSummary(submission.items_summary));

  const normalizedItems = [
    ...orderItems.map((item) => ({
      db_type: item.db_type,
      product_name: extractCoreProductName(item.product_name, item.region, item.db_type),
      region: item.region,
      quantity: item.quantity,
      total_price: item.total_price,
    })),
    ...legacyItems,
  ];

  const aggregated = aggregateItems(normalizedItems);

  return {
    period: {
      start: startIso,
      end: endIso,
    },
    aggregated,
    summary: {
      totalQuantity: aggregated.reduce((sum, product) => sum + product.totalQuantity, 0),
      totalAmount: aggregated.reduce((sum, product) => sum + product.totalAmount, 0),
    },
  };
};
