import { Meal } from '../types';
import { Recipe } from '../types/recipes';
import { LifestyleEntry } from '../types/lifestyle';
import { UserSettings } from '../types';
import { CURRENT_DATA_VERSION } from '../constants';

export interface ExportData {
  meals: Meal[];
  recipes: Recipe[];
  lifestyle: LifestyleEntry[];
  settings: UserSettings;
  exportDate: string;
  version: number;
}

// Export data as JSON file with version information
export function exportAsJSON(data: ExportData): void {
  const exportObject = {
    ...data,
    version: CURRENT_DATA_VERSION,
    exportDate: new Date().toISOString(),
  };

  const jsonString = JSON.stringify(exportObject, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `nutriai-backup-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Export meals as CSV
export function exportMealsAsCSV(meals: Meal[]): void {
  const headers = [
    'Date',
    'Time',
    'Category',
    'Food Name',
    'Description',
    'Serving Size',
    'Calories',
    'Protein (g)',
    'Carbs (g)',
    'Fat (g)',
  ];

  const rows = meals.map((meal) => {
    const date = new Date(meal.timestamp);
    return [
      date.toLocaleDateString(),
      date.toLocaleTimeString(),
      meal.category,
      `"${meal.foodName.replace(/"/g, '""')}"`,
      `"${meal.description.replace(/"/g, '""')}"`,
      meal.servingSize,
      meal.nutrition.calories,
      meal.nutrition.protein_g,
      meal.nutrition.carbs_g,
      meal.nutrition.fat_g,
    ];
  });

  const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `nutriai-meals-${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Export nutrition summary as CSV
export function exportNutritionSummaryAsCSV(
  dailyTotals: { date: string; calories: number; protein_g: number; carbs_g: number; fat_g: number }[]
): void {
  const headers = ['Date', 'Calories', 'Protein (g)', 'Carbs (g)', 'Fat (g)'];

  const rows = dailyTotals.map((day) => [
    day.date,
    day.calories,
    day.protein_g,
    day.carbs_g,
    day.fat_g,
  ]);

  const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `nutriai-nutrition-summary-${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Generate plain text report
export function exportAsPlainText(
  meals: Meal[],
  settings: UserSettings,
  dailyTotals: { calories: number; protein_g: number; carbs_g: number; fat_g: number }
): string {
  const date = new Date().toLocaleDateString();
  let text = `NUTRITION REPORT\n`;
  text += `Generated: ${date}\n`;
  text += `${'='.repeat(40)}\n\n`;

  text += `DAILY SUMMARY\n`;
  text += `${'-'.repeat(20)}\n`;
  text += `Calories: ${dailyTotals.calories} / ${settings.dailyCalorieGoal}\n`;
  text += `Protein: ${dailyTotals.protein_g}g / ${settings.proteinGoal_g}g\n`;
  text += `Carbs: ${dailyTotals.carbs_g}g / ${settings.carbsGoal_g}g\n`;
  text += `Fat: ${dailyTotals.fat_g}g / ${settings.fatGoal_g}g\n\n`;

  text += `MEALS\n`;
  text += `${'-'.repeat(20)}\n`;
  meals.forEach((meal, index) => {
    text += `\n${index + 1}. ${meal.category.toUpperCase()}\n`;
    text += `   Food: ${meal.foodName}\n`;
    text += `   Serving: ${meal.servingSize}\n`;
    text += `   Calories: ${meal.nutrition.calories}\n`;
    text += `   P/C/F: ${meal.nutrition.protein_g}g / ${meal.nutrition.carbs_g}g / ${meal.nutrition.fat_g}g\n`;
  });

  return text;
}

// Export as plain text file
export function exportAsTextFile(
  meals: Meal[],
  settings: UserSettings,
  dailyTotals: { calories: number; protein_g: number; carbs_g: number; fat_g: number }
): void {
  const text = exportAsPlainText(meals, settings, dailyTotals);
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `nutriai-report-${new Date().toISOString().split('T')[0]}.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
