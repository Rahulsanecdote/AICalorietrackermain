import { useState, useRef } from 'react';
import {
  Download,
  Upload,
  FileJson,
  FileText,
  FileSpreadsheet,
  Moon,
  Sun,
  WifiOff,
  Wifi,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  X,
} from 'lucide-react';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import {
  exportAsJSON,
  exportMealsAsCSV,
  exportAsTextFile,
  ExportData,
} from '../utils/exportData';
import {
  parseJSONFile,
  importFromBackup,
  importFromCSV,
  generateCSVTemplate,
  ImportResult,
} from '../utils/importData';
import { useTheme } from '../context/ThemeContext';
import { Meal, UserSettings, DailyTotals } from '../types';

interface UtilityPanelProps {
  meals: Meal[];
  settings: UserSettings;
  dailyTotals: DailyTotals;
  onImportMeals: (meals: Partial<Meal>[]) => void;
  isOpen: boolean;
  onClose: () => void;
}

type ExportFormat = 'json' | 'csv' | 'text';
type ImportStatus = 'idle' | 'importing' | 'success' | 'error';

export function UtilityPanel({
  meals,
  settings,
  dailyTotals,
  onImportMeals,
  isOpen,
  onClose,
}: UtilityPanelProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('export');
  const [exportFormat, setExportFormat] = useState<ExportFormat>('json');
  const [importStatus, setImportStatus] = useState<ImportStatus>('idle');
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importedMealsCount, setImportedMealsCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const exportData: ExportData = {
      meals,
      recipes: [],
      lifestyle: [],
      settings,
      exportDate: new Date().toISOString(),
      version: '1.0.0',
    };

    switch (exportFormat) {
      case 'json':
        exportAsJSON(exportData);
        break;
      case 'csv':
        exportMealsAsCSV(meals);
        break;
      case 'text':
        exportAsTextFile(meals, settings, dailyTotals);
        break;
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImportStatus('importing');

    try {
      if (file.name.endsWith('.json')) {
        const { data, error } = await parseJSONFile(file);
        if (error) {
          setImportResult({ success: false, meals: [], recipes: [], lifestyle: [], errors: [error] });
          setImportStatus('error');
        } else {
          const result = importFromBackup(data);
          setImportResult(result);
          setImportedMealsCount(result.meals.length);
          if (result.success && result.meals.length > 0) {
            setImportStatus('success');
          } else {
            setImportStatus('error');
          }
        }
      } else if (file.name.endsWith('.csv')) {
        const { meals: importedMeals, errors } = await importFromCSV(file);
        if (errors.length > 0) {
          setImportResult({ success: false, meals: [], recipes: [], lifestyle: [], errors });
          setImportStatus('error');
        } else {
          setImportedMealsCount(importedMeals.length);
          if (importedMeals.length > 0) {
            onImportMeals(importedMeals);
            setImportStatus('success');
          } else {
            setImportResult({
              success: false,
              meals: [],
              recipes: [],
              lifestyle: [],
              errors: ['No valid meals found in the CSV file'],
            });
            setImportStatus('error');
          }
        }
      } else {
        setImportResult({
          success: false,
          meals: [],
          recipes: [],
          lifestyle: [],
          errors: ['Unsupported file format. Please use .json or .csv files.'],
        });
        setImportStatus('error');
      }
    } catch {
      setImportResult({
        success: false,
        meals: [],
        recipes: [],
        lifestyle: [],
        errors: ['An unexpected error occurred during import'],
      });
      setImportStatus('error');
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleConfirmImport = () => {
    if (importResult?.meals && importResult.meals.length > 0) {
      onImportMeals(importResult.meals);
      setImportStatus('idle');
      setImportResult(null);
      onClose();
    }
  };

  const handleDownloadTemplate = () => {
    const template = generateCSVTemplate();
    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'nutriai-import-template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Utilities
          </DialogTitle>
          <DialogDescription>
            Export your data, import meals, and manage app settings
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="export">Export</TabsTrigger>
            <TabsTrigger value="import">Import</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
          </TabsList>

          {/* Export Tab */}
          <TabsContent value="export" className="space-y-4 mt-4">
            <div className="space-y-3">
              <span className="text-sm font-medium">Export Format</span>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant={exportFormat === 'json' ? 'default' : 'outline'}
                  onClick={() => setExportFormat('json')}
                  className="flex flex-col items-center gap-1 h-auto py-3"
                >
                  <FileJson className="h-5 w-5" />
                  <span className="text-xs">JSON</span>
                </Button>
                <Button
                  variant={exportFormat === 'csv' ? 'default' : 'outline'}
                  onClick={() => setExportFormat('csv')}
                  className="flex flex-col items-center gap-1 h-auto py-3"
                >
                  <FileSpreadsheet className="h-5 w-5" />
                  <span className="text-xs">CSV</span>
                </Button>
                <Button
                  variant={exportFormat === 'text' ? 'default' : 'outline'}
                  onClick={() => setExportFormat('text')}
                  className="flex flex-col items-center gap-1 h-auto py-3"
                >
                  <FileText className="h-5 w-5" />
                  <span className="text-xs">Text</span>
                </Button>
              </div>
            </div>

            <div className="bg-muted/50 rounded-lg p-3 space-y-2">
              <p className="text-sm font-medium">Export includes:</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  {meals.length} meal records
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  User settings
                </li>
              </ul>
            </div>

            <Button onClick={handleExport} className="w-full">
              <Download className="mr-2 h-4 w-4" />
              Export as {exportFormat.toUpperCase()}
            </Button>
          </TabsContent>

          {/* Import Tab */}
          <TabsContent value="import" className="space-y-4 mt-4">
            <div
              className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center cursor-pointer hover:border-muted-foreground/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm font-medium">Click to upload file</p>
              <p className="text-xs text-muted-foreground">Supports .json and .csv files</p>
              <input
                ref={fileInputRef}
                id="import-file"
                name="import-file"
                type="file"
                accept=".json,.csv"
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>

            <Button variant="outline" onClick={handleDownloadTemplate} className="w-full">
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Download CSV Template
            </Button>

            {/* Import Status */}
            {importStatus !== 'idle' && importResult && (
              <div
                className={`rounded-lg p-3 ${
                  importStatus === 'success'
                    ? 'bg-green-50 border border-green-200'
                    : importStatus === 'error'
                      ? 'bg-red-50 border border-red-200'
                      : 'bg-blue-50 border border-blue-200'
                }`}
              >
                {importStatus === 'importing' && (
                  <div className="flex items-center gap-2 text-blue-700">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Processing file...</span>
                  </div>
                )}

                {importStatus === 'success' && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-green-700">
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-sm font-medium">Import Preview</span>
                    </div>
                    <p className="text-sm text-green-600">
                      Found {importedMealsCount} meals ready to import
                    </p>
                  </div>
                )}

                {importStatus === 'error' && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-red-700">
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-sm font-medium">Import Failed</span>
                    </div>
                    {importResult.errors.map((error, index) => (
                      <p key={index} className="text-sm text-red-600">
                        {error}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Online/Offline Status */}
            <div
              className={`flex items-center gap-2 rounded-lg p-3 ${
                isOnline ? 'bg-green-50' : 'bg-yellow-50'
              }`}
            >
              {isOnline ? (
                <>
                  <Wifi className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-700">Online - Data sync available</span>
                </>
              ) : (
                <>
                  <WifiOff className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm text-yellow-700">
                    Offline - Data saved locally only
                  </span>
                </>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={onClose}>
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
              <Button
                onClick={handleConfirmImport}
                disabled={importStatus !== 'success'}
              >
                Import {importedMealsCount} Meals
              </Button>
            </DialogFooter>
          </TabsContent>

          {/* Appearance Tab */}
          <TabsContent value="appearance" className="space-y-4 mt-4">
            <div className="space-y-3">
              <span className="text-sm font-medium">Theme</span>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant={theme === 'light' ? 'default' : 'outline'}
                  onClick={() => setTheme('light')}
                  className="flex flex-col items-center gap-1 h-auto py-3"
                >
                  <Sun className="h-5 w-5" />
                  <span className="text-xs">Light</span>
                </Button>
                <Button
                  variant={theme === 'dark' ? 'default' : 'outline'}
                  onClick={() => setTheme('dark')}
                  className="flex flex-col items-center gap-1 h-auto py-3"
                >
                  <Moon className="h-5 w-5" />
                  <span className="text-xs">Dark</span>
                </Button>
                <Button
                  variant={theme === 'system' ? 'default' : 'outline'}
                  onClick={() => setTheme('system')}
                  className="flex flex-col items-center gap-1 h-auto py-3"
                >
                  <RefreshCw className="h-5 w-5" />
                  <span className="text-xs">System</span>
                </Button>
              </div>
            </div>

            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-sm text-muted-foreground">
                Current theme: <strong>{resolvedTheme}</strong>
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
