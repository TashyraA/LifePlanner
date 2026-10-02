import type { Recipe } from '../contexts/MealContext';

export type ImportedRecipe = Omit<Recipe, 'id'>;

const defaultImage = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400';

const toNumber = (value: unknown): number | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value !== 'string') return undefined;
  const match = value.replace(/,/g, '').match(/-?\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : undefined;
};

const toText = (value: unknown): string => {
  if (Array.isArray(value)) return value.map(item => toText(item)).filter(Boolean).join('\n');
  if (typeof value === 'object' && value !== null) {
    const item = value as Record<string, unknown>;
    return toText(item.text ?? item.name ?? item.step ?? item.instruction ?? '');
  }
  return typeof value === 'string' || typeof value === 'number' ? String(value) : '';
};

const parseIngredient = (value: unknown) => {
  const line = toText(value).replace(/^[-*•]\s*/, '').trim();
  const parts = line.match(/^([\d./\s\w¼½¾⅓⅔⅛-]+?)\s+(.+)$/);
  return parts
    ? { amount: parts[1].trim(), name: parts[2].trim() }
    : { amount: '', name: line };
};

const parseIngredients = (value: unknown) => {
  if (Array.isArray(value)) return value.map(parseIngredient).filter(item => item.name);
  return toText(value).split(/\r?\n/).map(parseIngredient).filter(item => item.name);
};

const field = (source: Record<string, unknown>, ...names: string[]) => {
  const key = names.find(name => source[name] !== undefined && source[name] !== null);
  return key ? source[key] : undefined;
};

const fromObject = (source: Record<string, unknown>): ImportedRecipe | null => {
  const name = toText(field(source, 'name', 'title', 'recipeName')).trim();
  const ingredients = parseIngredients(field(source, 'ingredients', 'ingredientList'));
  const instructions = toText(field(source, 'recipe', 'instructions', 'directions', 'method', 'steps')).trim();
  if (!name || (!ingredients.length && !instructions)) return null;

  const nutrition = (field(source, 'nutrition', 'nutritionalInfo') as Record<string, unknown> | undefined) || {};
  return {
    name,
    image: toText(field(source, 'image', 'imageUrl', 'photo', 'photoUrl')) || defaultImage,
    videoUrl: toText(field(source, 'videoUrl', 'video', 'url')),
    ingredients,
    calories: toNumber(field(source, 'calories', 'calorie')) ?? toNumber(field(nutrition, 'calories', 'calorie')) ?? 0,
    protein: toNumber(field(source, 'protein')) ?? toNumber(field(nutrition, 'protein')) ?? 0,
    carbs: toNumber(field(source, 'carbs', 'carbohydrates')) ?? toNumber(field(nutrition, 'carbs', 'carbohydrates')) ?? 0,
    fats: toNumber(field(source, 'fats', 'fat')) ?? toNumber(field(nutrition, 'fats', 'fat')) ?? 0,
    recipe: instructions,
    category: toText(field(source, 'category', 'mealType')),
    prepTime: toText(field(source, 'prepTime', 'prep_time', 'totalTime')),
    servings: toNumber(field(source, 'servings', 'yield')) ?? 1,
  };
};

const parseJson = (input: string): ImportedRecipe[] | null => {
  try {
    const parsed = JSON.parse(input) as unknown;
    const candidates = Array.isArray(parsed)
      ? parsed
      : typeof parsed === 'object' && parsed !== null
        ? ((parsed as Record<string, unknown>).recipes || (parsed as Record<string, unknown>).data || [parsed])
        : [];
    if (!Array.isArray(candidates)) return null;
    return candidates
      .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
      .map(fromObject)
      .filter((recipe): recipe is ImportedRecipe => recipe !== null);
  } catch {
    return null;
  }
};

const section = (lines: string[], headings: RegExp): string[] => {
  const start = lines.findIndex(line => headings.test(line.trim()));
  if (start < 0) return [];
  const result: string[] = [];
  for (const line of lines.slice(start + 1)) {
    if (/^(ingredients?|what you(?:'|’)ll need|instructions?|directions?|method|steps?)\s*:?[\s]*$/i.test(line.trim())) break;
    if (line.trim()) result.push(line.trim());
  }
  return result;
};

const parseText = (input: string): ImportedRecipe | null => {
  const lines = input.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  if (!lines.length) return null;
  const name = lines[0].replace(/^(recipe|title)\s*:\s*/i, '').trim();
  const ingredients = section(lines, /^(ingredients?|what you(?:'|’)ll need)\s*:?[\s]*$/i).map(parseIngredient);
  const instructions = section(lines, /^(instructions?|directions?|method|steps?)\s*:?[\s]*$/i).join('\n');
  const allText = lines.join('\n');
  const image = allText.match(/https?:\/\/\S+\.(?:jpg|jpeg|png|webp)(?:\?\S*)?/i)?.[0];
  const numberFor = (pattern: RegExp) => toNumber(allText.match(pattern)?.[1]);
  if (!name || (!ingredients.length && !instructions)) return null;
  return {
    name,
    image: image || defaultImage,
    ingredients,
    calories: numberFor(/(?:calories|kcal)\s*:?\s*(\d+)/i) ?? 0,
    protein: numberFor(/protein\s*:?\s*([\d.]+)/i) ?? 0,
    carbs: numberFor(/(?:carbs|carbohydrates)\s*:?\s*([\d.]+)/i) ?? 0,
    fats: numberFor(/(?:fats|fat)\s*:?\s*([\d.]+)/i) ?? 0,
    recipe: instructions,
    prepTime: allText.match(/(?:prep(?:aration)?\s*time|total\s*time)\s*:?\s*([^\n]+)/i)?.[1]?.trim() || '',
    servings: numberFor(/(?:servings| serves)\s*:?\s*(\d+)/i) ?? 1,
  };
};

export const parseRecipeImport = (input: string): ImportedRecipe[] => {
  const jsonRecipes = parseJson(input);
  if (jsonRecipes?.length) return jsonRecipes;
  const textRecipe = parseText(input);
  return textRecipe ? [textRecipe] : [];
};
