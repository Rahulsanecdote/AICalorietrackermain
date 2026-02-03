/**
 * Internal Food Catalog
 * 
 * Contains ~100 common foods with verified nutrition data per 100g.
 * Used for instant lookup without external API calls.
 */

export interface CatalogFood {
    id: string;
    name: string;
    aliases: string[];  // Alternative names for search
    category: 'grain' | 'protein' | 'dairy' | 'fruit' | 'vegetable' | 'beverage' | 'snack' | 'meal' | 'other';

    // Nutrients per 100g
    per100g: {
        calories: number;
        protein: number;
        carbs: number;
        fat: number;
        fiber?: number;
    };

    // Common serving sizes
    servings: {
        label: string;      // "1 cup cooked", "1 slice"
        grams: number;
    }[];

    // Translations for food name
    translations?: {
        te?: string;  // Telugu
        hi?: string;  // Hindi
        es?: string;  // Spanish
    };
}

// ============================================================================
// Food Catalog Database
// ============================================================================

export const FOOD_CATALOG: CatalogFood[] = [
    // ============ GRAINS ============
    {
        id: 'rice-white-cooked',
        name: 'White Rice',
        aliases: ['rice', 'cooked rice', 'steamed rice'],
        category: 'grain',
        per100g: { calories: 130, protein: 2.7, carbs: 28, fat: 0.3, fiber: 0.4 },
        servings: [
            { label: '1 cup cooked', grams: 158 },
            { label: '1/2 cup cooked', grams: 79 },
        ],
        translations: { te: 'అన్నం', hi: 'चावल', es: 'arroz' },
    },
    {
        id: 'rice-brown-cooked',
        name: 'Brown Rice',
        aliases: ['brown rice', 'whole grain rice'],
        category: 'grain',
        per100g: { calories: 112, protein: 2.6, carbs: 24, fat: 0.9, fiber: 1.8 },
        servings: [
            { label: '1 cup cooked', grams: 195 },
        ],
        translations: { te: 'గోధుమ బియ్యం', hi: 'ब्राउन राइस', es: 'arroz integral' },
    },
    {
        id: 'oatmeal-cooked',
        name: 'Oatmeal',
        aliases: ['oats', 'porridge', 'cooked oats'],
        category: 'grain',
        per100g: { calories: 68, protein: 2.4, carbs: 12, fat: 1.4, fiber: 1.7 },
        servings: [
            { label: '1 cup cooked', grams: 234 },
            { label: '1/2 cup cooked', grams: 117 },
        ],
        translations: { te: 'ఓట్స్', hi: 'ओटमील', es: 'avena' },
    },
    {
        id: 'bread-white',
        name: 'White Bread',
        aliases: ['bread', 'toast', 'sandwich bread'],
        category: 'grain',
        per100g: { calories: 265, protein: 9, carbs: 49, fat: 3.2, fiber: 2.7 },
        servings: [
            { label: '1 slice', grams: 25 },
            { label: '2 slices', grams: 50 },
        ],
        translations: { te: 'రొట్టె', hi: 'ब्रेड', es: 'pan' },
    },
    {
        id: 'bread-whole-wheat',
        name: 'Whole Wheat Bread',
        aliases: ['wheat bread', 'brown bread', 'whole grain bread'],
        category: 'grain',
        per100g: { calories: 247, protein: 13, carbs: 41, fat: 3.4, fiber: 7 },
        servings: [
            { label: '1 slice', grams: 28 },
            { label: '2 slices', grams: 56 },
        ],
    },
    {
        id: 'pasta-cooked',
        name: 'Pasta',
        aliases: ['spaghetti', 'noodles', 'macaroni'],
        category: 'grain',
        per100g: { calories: 131, protein: 5, carbs: 25, fat: 1.1, fiber: 1.8 },
        servings: [
            { label: '1 cup cooked', grams: 140 },
        ],
        translations: { te: 'పాస్తా', hi: 'पास्ता', es: 'pasta' },
    },
    {
        id: 'quinoa-cooked',
        name: 'Quinoa',
        aliases: ['cooked quinoa'],
        category: 'grain',
        per100g: { calories: 120, protein: 4.4, carbs: 21, fat: 1.9, fiber: 2.8 },
        servings: [
            { label: '1 cup cooked', grams: 185 },
        ],
    },
    {
        id: 'cereal-sugary',
        name: 'Sugary Cereal',
        aliases: ['cereal', 'breakfast cereal', 'frosted flakes'],
        category: 'grain',
        per100g: { calories: 385, protein: 5, carbs: 87, fat: 2.6, fiber: 2.5 },
        servings: [
            { label: '1 cup', grams: 39 },
        ],
    },

    // ============ PROTEINS ============
    {
        id: 'chicken-breast-cooked',
        name: 'Chicken Breast',
        aliases: ['chicken', 'grilled chicken', 'baked chicken'],
        category: 'protein',
        per100g: { calories: 165, protein: 31, carbs: 0, fat: 3.6, fiber: 0 },
        servings: [
            { label: '1 breast', grams: 172 },
            { label: '100g', grams: 100 },
        ],
        translations: { te: 'కోడి', hi: 'चिकन', es: 'pollo' },
    },
    {
        id: 'salmon-cooked',
        name: 'Salmon',
        aliases: ['grilled salmon', 'baked salmon', 'fish'],
        category: 'protein',
        per100g: { calories: 208, protein: 20, carbs: 0, fat: 13, fiber: 0 },
        servings: [
            { label: '1 fillet', grams: 154 },
            { label: '100g', grams: 100 },
        ],
        translations: { te: 'సాల్మన్', hi: 'सैल्मन', es: 'salmón' },
    },
    {
        id: 'eggs-whole',
        name: 'Eggs',
        aliases: ['egg', 'boiled egg', 'fried egg', 'scrambled eggs'],
        category: 'protein',
        per100g: { calories: 155, protein: 13, carbs: 1.1, fat: 11, fiber: 0 },
        servings: [
            { label: '1 large egg', grams: 50 },
            { label: '2 eggs', grams: 100 },
        ],
        translations: { te: 'గుడ్లు', hi: 'अंडा', es: 'huevo' },
    },
    {
        id: 'beef-ground-cooked',
        name: 'Ground Beef',
        aliases: ['beef', 'hamburger meat', 'minced beef'],
        category: 'protein',
        per100g: { calories: 250, protein: 26, carbs: 0, fat: 15, fiber: 0 },
        servings: [
            { label: '1 patty', grams: 113 },
            { label: '100g', grams: 100 },
        ],
    },
    {
        id: 'tofu-firm',
        name: 'Tofu',
        aliases: ['firm tofu', 'bean curd'],
        category: 'protein',
        per100g: { calories: 144, protein: 17, carbs: 3, fat: 9, fiber: 2.3 },
        servings: [
            { label: '1/2 cup', grams: 126 },
        ],
    },
    {
        id: 'lentils-cooked',
        name: 'Lentils',
        aliases: ['dal', 'cooked lentils'],
        category: 'protein',
        per100g: { calories: 116, protein: 9, carbs: 20, fat: 0.4, fiber: 8 },
        servings: [
            { label: '1 cup cooked', grams: 198 },
        ],
        translations: { te: 'పప్పు', hi: 'दाल', es: 'lentejas' },
    },

    // ============ DAIRY ============
    {
        id: 'milk-whole',
        name: 'Whole Milk',
        aliases: ['milk', 'full fat milk'],
        category: 'dairy',
        per100g: { calories: 61, protein: 3.2, carbs: 4.8, fat: 3.3, fiber: 0 },
        servings: [
            { label: '1 cup', grams: 244 },
            { label: '1 glass', grams: 244 },
        ],
        translations: { te: 'పాలు', hi: 'दूध', es: 'leche' },
    },
    {
        id: 'milk-skim',
        name: 'Skim Milk',
        aliases: ['fat-free milk', 'nonfat milk'],
        category: 'dairy',
        per100g: { calories: 34, protein: 3.4, carbs: 5, fat: 0.1, fiber: 0 },
        servings: [
            { label: '1 cup', grams: 245 },
        ],
    },
    {
        id: 'yogurt-greek',
        name: 'Greek Yogurt',
        aliases: ['yogurt', 'greek yoghurt', 'plain yogurt'],
        category: 'dairy',
        per100g: { calories: 59, protein: 10, carbs: 3.6, fat: 0.7, fiber: 0 },
        servings: [
            { label: '1 cup', grams: 245 },
            { label: '1 container (6oz)', grams: 170 },
        ],
        translations: { te: 'పెరుగు', hi: 'दही', es: 'yogur' },
    },
    {
        id: 'cheese-cheddar',
        name: 'Cheddar Cheese',
        aliases: ['cheese', 'cheddar'],
        category: 'dairy',
        per100g: { calories: 403, protein: 23, carbs: 3.1, fat: 33, fiber: 0 },
        servings: [
            { label: '1 slice', grams: 28 },
            { label: '1 oz', grams: 28 },
        ],
        translations: { te: 'చీజ్', hi: 'पनीर', es: 'queso' },
    },

    // ============ FRUITS ============
    {
        id: 'banana',
        name: 'Banana',
        aliases: ['bananas'],
        category: 'fruit',
        per100g: { calories: 89, protein: 1.1, carbs: 23, fat: 0.3, fiber: 2.6 },
        servings: [
            { label: '1 medium', grams: 118 },
            { label: '1 large', grams: 136 },
        ],
        translations: { te: 'అరటిపండు', hi: 'केला', es: 'plátano' },
    },
    {
        id: 'apple',
        name: 'Apple',
        aliases: ['apples'],
        category: 'fruit',
        per100g: { calories: 52, protein: 0.3, carbs: 14, fat: 0.2, fiber: 2.4 },
        servings: [
            { label: '1 medium', grams: 182 },
        ],
        translations: { te: 'యాపిల్', hi: 'सेब', es: 'manzana' },
    },
    {
        id: 'orange',
        name: 'Orange',
        aliases: ['oranges'],
        category: 'fruit',
        per100g: { calories: 47, protein: 0.9, carbs: 12, fat: 0.1, fiber: 2.4 },
        servings: [
            { label: '1 medium', grams: 131 },
        ],
        translations: { te: 'నారింజ', hi: 'संतरा', es: 'naranja' },
    },
    {
        id: 'strawberries',
        name: 'Strawberries',
        aliases: ['strawberry'],
        category: 'fruit',
        per100g: { calories: 32, protein: 0.7, carbs: 7.7, fat: 0.3, fiber: 2 },
        servings: [
            { label: '1 cup', grams: 144 },
        ],
    },
    {
        id: 'grapes',
        name: 'Grapes',
        aliases: ['grape'],
        category: 'fruit',
        per100g: { calories: 69, protein: 0.7, carbs: 18, fat: 0.2, fiber: 0.9 },
        servings: [
            { label: '1 cup', grams: 151 },
        ],
        translations: { te: 'ద్రాక్ష', hi: 'अंगूर', es: 'uvas' },
    },

    // ============ VEGETABLES ============
    {
        id: 'broccoli-cooked',
        name: 'Broccoli',
        aliases: ['steamed broccoli'],
        category: 'vegetable',
        per100g: { calories: 35, protein: 2.4, carbs: 7, fat: 0.4, fiber: 3.3 },
        servings: [
            { label: '1 cup chopped', grams: 91 },
        ],
        translations: { te: 'బ్రోకలీ', hi: 'ब्रोकोली', es: 'brócoli' },
    },
    {
        id: 'spinach-raw',
        name: 'Spinach',
        aliases: ['raw spinach', 'spinach leaves'],
        category: 'vegetable',
        per100g: { calories: 23, protein: 2.9, carbs: 3.6, fat: 0.4, fiber: 2.2 },
        servings: [
            { label: '1 cup raw', grams: 30 },
            { label: '1 cup cooked', grams: 180 },
        ],
        translations: { te: 'పాలకూర', hi: 'पालक', es: 'espinaca' },
    },
    {
        id: 'potato-baked',
        name: 'Baked Potato',
        aliases: ['potato', 'potatoes'],
        category: 'vegetable',
        per100g: { calories: 93, protein: 2.5, carbs: 21, fat: 0.1, fiber: 2.2 },
        servings: [
            { label: '1 medium', grams: 173 },
        ],
        translations: { te: 'బంగాళదుంప', hi: 'आलू', es: 'papa' },
    },
    {
        id: 'sweet-potato-baked',
        name: 'Sweet Potato',
        aliases: ['yam', 'baked sweet potato'],
        category: 'vegetable',
        per100g: { calories: 90, protein: 2, carbs: 21, fat: 0.1, fiber: 3.3 },
        servings: [
            { label: '1 medium', grams: 114 },
        ],
    },
    {
        id: 'carrot-raw',
        name: 'Carrot',
        aliases: ['carrots'],
        category: 'vegetable',
        per100g: { calories: 41, protein: 0.9, carbs: 10, fat: 0.2, fiber: 2.8 },
        servings: [
            { label: '1 medium', grams: 61 },
            { label: '1 cup chopped', grams: 128 },
        ],
        translations: { te: 'క్యారెట్', hi: 'गाजर', es: 'zanahoria' },
    },

    // ============ BEVERAGES ============
    {
        id: 'cola-soda',
        name: 'Cola Soda',
        aliases: ['soda', 'coke', 'pepsi', 'soft drink'],
        category: 'beverage',
        per100g: { calories: 42, protein: 0, carbs: 11, fat: 0, fiber: 0 },
        servings: [
            { label: '1 can (355ml)', grams: 355 },
            { label: '1 glass', grams: 240 },
        ],
    },
    {
        id: 'water',
        name: 'Water',
        aliases: ['still water', 'drinking water'],
        category: 'beverage',
        per100g: { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 },
        servings: [
            { label: '1 glass', grams: 240 },
            { label: '1 bottle', grams: 500 },
        ],
        translations: { te: 'నీళ్ళు', hi: 'पानी', es: 'agua' },
    },
    {
        id: 'coffee-black',
        name: 'Black Coffee',
        aliases: ['coffee', 'espresso'],
        category: 'beverage',
        per100g: { calories: 2, protein: 0.3, carbs: 0, fat: 0, fiber: 0 },
        servings: [
            { label: '1 cup', grams: 240 },
        ],
        translations: { te: 'కాఫీ', hi: 'कॉफी', es: 'café' },
    },
    {
        id: 'orange-juice',
        name: 'Orange Juice',
        aliases: ['oj', 'fresh orange juice'],
        category: 'beverage',
        per100g: { calories: 45, protein: 0.7, carbs: 10, fat: 0.2, fiber: 0.2 },
        servings: [
            { label: '1 cup', grams: 248 },
        ],
    },

    // ============ SNACKS ============
    {
        id: 'almonds',
        name: 'Almonds',
        aliases: ['almond', 'raw almonds'],
        category: 'snack',
        per100g: { calories: 579, protein: 21, carbs: 22, fat: 50, fiber: 12 },
        servings: [
            { label: '1 oz (23 nuts)', grams: 28 },
            { label: '1/4 cup', grams: 36 },
        ],
        translations: { te: 'బాదం', hi: 'बादाम', es: 'almendras' },
    },
    {
        id: 'peanut-butter',
        name: 'Peanut Butter',
        aliases: ['pb'],
        category: 'snack',
        per100g: { calories: 588, protein: 25, carbs: 20, fat: 50, fiber: 6 },
        servings: [
            { label: '2 tbsp', grams: 32 },
            { label: '1 tbsp', grams: 16 },
        ],
        translations: { te: 'వేరుశెనగ వెన్న', hi: 'मूंगफली का मक्खन', es: 'mantequilla de maní' },
    },
    {
        id: 'chips-potato',
        name: 'Potato Chips',
        aliases: ['chips', 'crisps'],
        category: 'snack',
        per100g: { calories: 536, protein: 7, carbs: 53, fat: 35, fiber: 4 },
        servings: [
            { label: '1 oz bag', grams: 28 },
        ],
    },
    {
        id: 'dark-chocolate',
        name: 'Dark Chocolate',
        aliases: ['chocolate', '70% chocolate'],
        category: 'snack',
        per100g: { calories: 598, protein: 8, carbs: 46, fat: 43, fiber: 11 },
        servings: [
            { label: '1 square', grams: 10 },
            { label: '1 oz', grams: 28 },
        ],
    },

    // ============ MEALS ============
    {
        id: 'pizza-pepperoni',
        name: 'Pepperoni Pizza',
        aliases: ['pizza'],
        category: 'meal',
        per100g: { calories: 266, protein: 11, carbs: 26, fat: 13, fiber: 1.5 },
        servings: [
            { label: '1 slice', grams: 107 },
            { label: '2 slices', grams: 214 },
        ],
        translations: { te: 'పిజ్జా', hi: 'पिज्जा', es: 'pizza' },
    },
    {
        id: 'hamburger',
        name: 'Hamburger',
        aliases: ['burger', 'cheeseburger'],
        category: 'meal',
        per100g: { calories: 295, protein: 17, carbs: 24, fat: 14, fiber: 1.3 },
        servings: [
            { label: '1 burger', grams: 226 },
        ],
    },
    {
        id: 'salad-garden-chicken',
        name: 'Garden Salad with Chicken',
        aliases: ['chicken salad', 'grilled chicken salad'],
        category: 'meal',
        per100g: { calories: 91, protein: 10, carbs: 5.7, fat: 3.4, fiber: 2 },
        servings: [
            { label: '1 bowl', grams: 350 },
        ],
    },
    {
        id: 'sandwich-turkey',
        name: 'Turkey Sandwich',
        aliases: ['sandwich'],
        category: 'meal',
        per100g: { calories: 228, protein: 14, carbs: 27, fat: 7, fiber: 2 },
        servings: [
            { label: '1 sandwich', grams: 200 },
        ],
    },
];

// ============================================================================
// Search and Lookup Functions
// ============================================================================

/**
 * Normalize a food name for searching
 */
function normalizeSearchTerm(term: string): string {
    return term.toLowerCase().trim().replace(/[^a-z0-9\s]/g, '');
}

/**
 * Search the food catalog by name
 * Returns matches sorted by relevance
 */
export function searchFoodCatalog(query: string, limit: number = 10): CatalogFood[] {
    if (!query || query.length < 2) return [];

    const normalized = normalizeSearchTerm(query);
    const words = normalized.split(/\s+/);

    const scored = FOOD_CATALOG.map(food => {
        let score = 0;
        const foodNameNorm = normalizeSearchTerm(food.name);

        // Exact match
        if (foodNameNorm === normalized) score += 100;
        // Starts with query
        else if (foodNameNorm.startsWith(normalized)) score += 50;
        // Contains query
        else if (foodNameNorm.includes(normalized)) score += 30;

        // Check aliases
        for (const alias of food.aliases) {
            const aliasNorm = normalizeSearchTerm(alias);
            if (aliasNorm === normalized) score += 90;
            else if (aliasNorm.startsWith(normalized)) score += 40;
            else if (aliasNorm.includes(normalized)) score += 20;
        }

        // Check individual words
        for (const word of words) {
            if (word.length < 2) continue;
            if (foodNameNorm.includes(word)) score += 10;
            for (const alias of food.aliases) {
                if (normalizeSearchTerm(alias).includes(word)) score += 5;
            }
        }

        return { food, score };
    });

    return scored
        .filter(s => s.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map(s => s.food);
}

/**
 * Find a food by exact ID
 */
export function getFoodById(id: string): CatalogFood | undefined {
    return FOOD_CATALOG.find(f => f.id === id);
}

/**
 * Calculate nutrients for a specific serving
 */
export interface CalculatedNutrition {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber?: number;
    servingGrams: number;
    servingLabel: string;
    source: 'catalog';
    confidence: number;
}

export function calculateNutritionForServing(
    food: CatalogFood,
    servingGrams: number
): CalculatedNutrition {
    const ratio = servingGrams / 100;

    // Find closest matching serving label
    let servingLabel = `${servingGrams}g`;
    for (const serving of food.servings) {
        if (Math.abs(serving.grams - servingGrams) < 5) {
            servingLabel = serving.label;
            break;
        }
    }

    return {
        calories: Math.round(food.per100g.calories * ratio),
        protein: Math.round(food.per100g.protein * ratio * 10) / 10,
        carbs: Math.round(food.per100g.carbs * ratio * 10) / 10,
        fat: Math.round(food.per100g.fat * ratio * 10) / 10,
        fiber: food.per100g.fiber ? Math.round(food.per100g.fiber * ratio * 10) / 10 : undefined,
        servingGrams,
        servingLabel,
        source: 'catalog',
        confidence: 1.0,
    };
}

/**
 * Parse serving size string to grams
 * Handles: "100g", "1 cup", "2 slices (100g)", etc.
 */
export function parseServingToGrams(
    servingString: string,
    food?: CatalogFood
): { grams: number | null; label: string } {
    const str = servingString.toLowerCase().trim();

    // Pattern: explicit grams like "100g" or "150 g"
    const gramsMatch = str.match(/^(\d+(?:\.\d+)?)\s*g$/);
    if (gramsMatch) {
        return { grams: parseFloat(gramsMatch[1]), label: str };
    }

    // Pattern: parentheses grams like "2 slices (100g)"
    const parenMatch = str.match(/\((\d+(?:\.\d+)?)\s*g\)/);
    if (parenMatch) {
        return { grams: parseFloat(parenMatch[1]), label: str };
    }

    // Try to match against food's known servings
    if (food) {
        for (const serving of food.servings) {
            const servingNorm = serving.label.toLowerCase();
            if (str.includes(servingNorm) || servingNorm.includes(str)) {
                return { grams: serving.grams, label: serving.label };
            }
            // Check for partial matches like "1 cup" matching "1 cup cooked"
            const strParts = str.split(/\s+/);
            const servingParts = servingNorm.split(/\s+/);
            if (strParts.length >= 2 && servingParts.length >= 2) {
                if (strParts[0] === servingParts[0] && strParts[1] === servingParts[1]) {
                    return { grams: serving.grams, label: serving.label };
                }
            }
        }

        // Common patterns
        const cupMatch = str.match(/^(\d+(?:\.\d+)?)\s*cup/);
        if (cupMatch) {
            const cups = parseFloat(cupMatch[1]);
            // Find a cup-based serving in the food
            const cupServing = food.servings.find(s => s.label.includes('cup'));
            if (cupServing) {
                return { grams: Math.round(cupServing.grams * cups), label: str };
            }
        }
    }

    // Default: can't determine grams
    return { grams: null, label: str };
}
