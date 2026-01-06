import { FoodItem } from '../types';

// Measurement type with converted value and unit
export interface IntuitiveMeasurement {
  value: number;
  unit: string;
  isApproximate: boolean;
}

// Food category detection and measurement conversion
function getFoodCategory(name: string): string {
  const lowerName = name.toLowerCase();
  
  // Eggs
  if (lowerName.includes('egg')) return 'eggs';
  
  // Bread and baked goods
  if (lowerName.includes('bread') || lowerName.includes('toast') || lowerName.includes('bagel') || lowerName.includes('bun') || lowerName.includes('roll')) return 'slices';
  
  // Fruits - whole or pieces
  if (lowerName.includes('apple') || lowerName.includes('banana') || lowerName.includes('orange') || 
      lowerName.includes('pear') || lowerName.includes('peach') || lowerName.includes('plum') ||
      lowerName.includes('mango') || lowerName.includes('kiwi') || lowerName.includes('avocado')) return 'whole';
  
  // Berries and small fruits
  if (lowerName.includes('berry') || lowerName.includes('strawberry') || lowerName.includes('blueberry') ||
      lowerName.includes('grape') || lowerName.includes('cherry') || lowerName.includes('raisin')) return 'pieces';
  
  // Vegetables - cups for leafy, pieces for others
  if (lowerName.includes('spinach') || lowerName.includes('lettuce') || lowerName.includes('kale') ||
      lowerName.includes('salad') || lowerName.includes('greens')) return 'cups';
  
  // Rice, grains, pasta - bowls
  if (lowerName.includes('rice') || lowerName.includes('quinoa') || lowerName.includes('oats') ||
      lowerName.includes('pasta') || lowerName.includes('noodles') || lowerName.includes('curry') ||
      lowerName.includes('stew') || lowerName.includes('soup') || lowerName.includes('cereal') ||
      lowerName.includes('porridge')) return 'bowls';
  
  // Dairy - cups for milk, pieces for cheese
  if (lowerName.includes('milk') || lowerName.includes('yogurt') || lowerName.includes('smoothie')) return 'cups';
  if (lowerName.includes('cheese') || lowerName.includes('cottage') || lowerName.includes('tofu')) return 'pieces';
  
  // Nuts and seeds - handfuls or tablespoons
  if (lowerName.includes('almond') || lowerName.includes('walnut') || lowerName.includes('cashew') ||
      lowerName.includes('peanut') || lowerName.includes('nut') || lowerName.includes('seed') ||
      lowerName.includes('mix')) return 'handfuls';
  
  // Liquids and sauces - tablespoons or cups
  if (lowerName.includes('sauce') || lowerName.includes('oil') || lowerName.includes('honey') ||
      lowerName.includes('syrup') || lowerName.includes('vinegar') || lowerName.includes('dressing') ||
      lowerName.includes('mayo') || lowerName.includes('ketchup') || lowerName.includes('salsa')) return 'tablespoons';
  
  // Butter and spreads
  if (lowerName.includes('butter') || lowerName.includes('margarine') || lowerName.includes('spread')) return 'tablespoons';
  
  // Meat and protein - grams or pieces
  if (lowerName.includes('chicken') || lowerName.includes('beef') || lowerName.includes('pork') ||
      lowerName.includes('fish') || lowerName.includes('salmon') || lowerName.includes('tuna') ||
      lowerName.includes('shrimp') || lowerName.includes('turkey') || lowerName.includes('lamb') ||
      lowerName.includes('steak') || lowerName.includes('meat')) return 'meat';
  
  // Legumes - cups
  if (lowerName.includes('beans') || lowerName.includes('lentils') || lowerName.includes('chickpeas') ||
      lowerName.includes('hummus') || lowerName.includes('dal')) return 'cups';
  
  // Vegetables - pieces for chopped
  if (lowerName.includes('tomato') || lowerName.includes('onion') || lowerName.includes('carrot') ||
      lowerName.includes('pepper') || lowerName.includes('cucumber') || lowerName.includes('zucchini') ||
      lowerName.includes('potato') || lowerName.includes('sweet potato') || lowerName.includes('broccoli') ||
      lowerName.includes('mushroom') || lowerName.includes('cauliflower') || lowerName.includes('asparagus')) return 'pieces';
  
  // Default to grams
  return 'grams';
}

// Conversion factors to grams
const unitConversions: Record<string, number> = {
  pieces: 150,      // Average piece ~150g
  slices: 30,       // Slice of bread ~30g
  whole: 200,       // Medium whole fruit ~200g
  cups: 200,        // 1 cup ~200g (varies by food)
  bowls: 250,       // 1 bowl ~250g
  handfuls: 30,     // Handful of nuts ~30g
  tablespoons: 15,  // 1 tbsp ~15g
  eggs: 50,         // 1 egg ~50g
  meat: 100,        // Standard serving of meat in grams
};

// Convert grams to intuitive measurement
export function getIntuitiveMeasurement(item: FoodItem): IntuitiveMeasurement {
  const category = getFoodCategory(item.name);
  const grams = item.weightGrams;
  
  // For meat and items that should stay in grams
  if (category === 'meat' || grams < 50 || grams > 500) {
    return { value: grams, unit: 'g', isApproximate: false };
  }
  
  const conversionFactor = unitConversions[category];
  if (!conversionFactor) {
    return { value: grams, unit: 'g', isApproximate: false };
  }
  
  const convertedValue = grams / conversionFactor;
  
  // Round to nice numbers
  let displayValue: number;
  let isApproximate = true;
  
  if (convertedValue < 1) {
    // Show fractions for small amounts
    if (convertedValue < 0.25) {
      displayValue = 0.25;
    } else if (convertedValue < 0.5) {
      displayValue = 0.5;
    } else {
      displayValue = Math.round(convertedValue * 10) / 10;
    }
  } else if (convertedValue < 3) {
    // Show halves and quarters for small quantities
    displayValue = Math.round(convertedValue * 2) / 2;
  } else {
    // Round to whole numbers for larger quantities
    displayValue = Math.round(convertedValue);
  }
  
  return {
    value: displayValue,
    unit: category,
    isApproximate,
  };
}

// Get display string for measurement
export function getMeasurementDisplay(item: FoodItem): string {
  const measurement = getIntuitiveMeasurement(item);
  const formattedValue = measurement.value % 1 === 0 ? measurement.value.toString() : measurement.value.toFixed(1);
  
  const unitLabels: Record<string, string> = {
    pieces: 'pcs',
    slices: 'slices',
    whole: 'whole',
    cups: 'cup',
    bowls: 'bowl',
    handfuls: 'handful',
    tablespoons: 'tbsp',
    eggs: 'egg',
    meat: 'g',
    grams: 'g',
  };
  
  const unit = unitLabels[measurement.unit] || measurement.unit;
  
  // Make unit plural if value > 1 (except for grams which don't pluralize)
  const displayUnit = measurement.value > 1 && measurement.unit !== 'meat' && measurement.unit !== 'grams' 
    ? unit + 's' 
    : unit;
    
  return `${formattedValue} ${displayUnit}`;
}

// Convert back to grams for editing
export function measurementToGrams(value: number, category: string): number {
  const conversionFactor = unitConversions[category] || 1;
  return Math.round(value * conversionFactor);
}

// Get the food category for a given item (useful for editing)
export function getFoodCategoryForItem(item: FoodItem): string {
  return getFoodCategory(item.name);
}
