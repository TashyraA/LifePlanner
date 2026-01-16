import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '../components/AppSidebar';
import { 
  Download, 
  Upload, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle,
  Smartphone,
  Tablet,
  Monitor,
  Cloud,
  HardDrive,
  Calendar,
  DollarSign,
  Utensils,
  Dumbbell,
  LogIn,
  LogOut,
  User,
  Settings as SettingsIcon,
} from 'lucide-react';
import { 
  exportAllData, 
  importAllData, 
  downloadDataAsFile, 
  readFileAsData,
  getDataSummary,
  AppData 
} from '@/lib/dataSync';
import { useFirebaseAuth } from '@/contexts/FirebaseAuthContext';
import { useDataSync } from '@/hooks/useDataSync';
import { toast } from 'sonner';

const Settings = () => {
  const { user, loading: authLoading, signInWithGoogle, signOut } = useFirebaseAuth();
  const { forceSync, forceDownload, isLoading: syncLoading } = useDataSync();
  
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(
    localStorage.getItem('last_sync_date')
  );
  const [importPreview, setImportPreview] = useState<AppData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const dataSummary = getDataSummary();

  const handleSignIn = async () => {
    try {
      await signInWithGoogle();
      toast.success('Signed in successfully!', {
        description: 'Your data will now sync across devices.',
      });
    } catch (error) {
      toast.error('Sign in failed', {
        description: 'Could not sign in with Google. Please try again.',
      });
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Signed out');
    } catch (error) {
      toast.error('Sign out failed');
    }
  };

  const handleExport = () => {
    setIsExporting(true);
    try {
      const data = exportAllData();
      const date = new Date().toISOString().split('T')[0];
      downloadDataAsFile(data, `lifeplanner-backup-${date}.json`);
      localStorage.setItem('last_sync_date', new Date().toISOString());
      setLastSync(new Date().toISOString());
      toast.success('Data exported successfully!', {
        description: 'Transfer the file to your other device and import it there.',
      });
    } catch (error) {
      toast.error('Export failed', {
        description: 'There was an error exporting your data.',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const data = await readFileAsData(file);
      setImportPreview(data);
    } catch (error) {
      toast.error('Invalid file', {
        description: 'The selected file is not a valid LifePlanner backup.',
      });
    }
    
    // Reset the input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleImport = () => {
    if (!importPreview) return;

    setIsImporting(true);
    try {
      const result = importAllData(importPreview);
      if (result.success) {
        localStorage.setItem('last_sync_date', new Date().toISOString());
        setLastSync(new Date().toISOString());
        toast.success('Data imported successfully!', {
          description: 'Please refresh the page to see your imported data.',
        });
        setImportPreview(null);
        
        // Offer to refresh
        setTimeout(() => {
          if (confirm('Would you like to refresh the page now to load your imported data?')) {
            window.location.reload();
          }
        }, 500);
      } else {
        toast.error('Import partially failed', {
          description: result.errors.join(', '),
        });
      }
    } catch (error) {
      toast.error('Import failed', {
        description: 'There was an error importing your data.',
      });
    } finally {
      setIsImporting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString();
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-gradient-to-br from-coquette-brown-50 via-coquette-pink-50 to-white">
        <AppSidebar />
        <SidebarInset className="flex-1 w-full min-w-0">
          <header className="flex items-center sticky top-0 z-10 gap-4 border-b border-coquette-brown-200 bg-white/80 backdrop-blur-sm px-6 py-4">
            <SidebarTrigger />
            <div className="flex items-center gap-2 flex-1">
              <SettingsIcon className="h-6 w-6 text-coquette-pink-400" />
              <h1 className="text-2xl font-bold text-coquette-brown-600">Settings</h1>
            </div>
          </header>
          
          <main className="p-6 max-w-4xl mx-auto space-y-6">
            {/* Cloud Sync Section - NEW */}
            <Card className="border-coquette-pink-200 bg-gradient-to-br from-white to-coquette-pink-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-coquette-brown-600">
                  <Cloud className="h-5 w-5 text-coquette-pink-400" />
                  Cloud Sync (Recommended)
                </CardTitle>
                <CardDescription>
                  Sign in with Google to automatically sync your data across all your devices in real-time.
                  This is the easiest way to keep your iPad, phone, and computer in sync.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {authLoading ? (
                  <div className="flex items-center gap-2 text-coquette-brown-500">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Loading...
                  </div>
                ) : user ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                        {user.photoURL ? (
                          <img src={user.photoURL} alt="" className="h-10 w-10 rounded-full" />
                        ) : (
                          <User className="h-5 w-5 text-green-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-green-800">{user.displayName || 'Signed In'}</p>
                        <p className="text-sm text-green-600">{user.email}</p>
                      </div>
                      <Badge className="bg-green-100 text-green-700 border-green-200">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Syncing
                      </Badge>
                    </div>
                    
                    <div className="flex gap-2 flex-wrap">
                      <Button 
                        onClick={forceSync} 
                        variant="outline" 
                        className="border-coquette-brown-200"
                        disabled={syncLoading}
                      >
                        <Upload className={`h-4 w-4 mr-2`} />
                        Upload to Cloud
                      </Button>
                      <Button 
                        onClick={forceDownload} 
                        variant="outline" 
                        className="border-coquette-brown-200"
                        disabled={syncLoading}
                      >
                        <Download className={`h-4 w-4 mr-2`} />
                        Download from Cloud
                      </Button>
                      <Button 
                        onClick={handleSignOut} 
                        variant="outline" 
                        className="border-red-200 text-red-600 hover:bg-red-50"
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Sign Out
                      </Button>
                    </div>
                    
                    <p className="text-sm text-coquette-brown-500">
                      📤 <strong>Upload to Cloud</strong> - Push this device's data to the cloud<br/>
                      📥 <strong>Download from Cloud</strong> - Pull data from cloud to this device
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Button 
                      onClick={handleSignIn} 
                      className="w-full bg-coquette-pink-300 hover:bg-coquette-pink-400 text-coquette-brown-600"
                      size="lg"
                    >
                      <LogIn className="h-5 w-5 mr-2" />
                      Sign in with Google
                    </Button>
                    <p className="text-sm text-coquette-brown-500 text-center">
                      Sign in once and your data will automatically appear on all your devices.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Separator />

            {/* Manual Device Sync Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HardDrive className="h-5 w-5" />
                  Manual Backup & Transfer
                </CardTitle>
                <CardDescription>
                  Export your data as a file and import it on another device manually.
                  Use this as a backup or if you prefer not to use cloud sync.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Supported Devices */}
                <div>
                  <Label className="text-sm text-muted-foreground mb-3 block">Supported Devices</Label>
                  <div className="flex gap-4">
              <div className="flex items-center gap-2 text-sm">
                <Monitor className="h-4 w-4 text-blue-500" />
                <span>Computer</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Tablet className="h-4 w-4 text-green-500" />
                <span>iPad</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Smartphone className="h-4 w-4 text-purple-500" />
                <span>Phone</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Current Data Summary */}
          <div>
            <Label className="text-sm text-muted-foreground mb-3 block">Current Data on This Device</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                <Calendar className="h-4 w-4 text-blue-500" />
                <div>
                  <p className="text-sm font-medium">{dataSummary.planner.events} Events</p>
                  <p className="text-xs text-muted-foreground">{dataSummary.planner.habits} Habits</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                <DollarSign className="h-4 w-4 text-green-500" />
                <div>
                  <p className="text-sm font-medium">{dataSummary.finance.incomes} Incomes</p>
                  <p className="text-xs text-muted-foreground">{dataSummary.finance.expenses} Expenses</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                <Utensils className="h-4 w-4 text-orange-500" />
                <div>
                  <p className="text-sm font-medium">{dataSummary.meals.meals} Meals</p>
                  <p className="text-xs text-muted-foreground">{dataSummary.meals.recipes} Recipes</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                <Dumbbell className="h-4 w-4 text-red-500" />
                <div>
                  <p className="text-sm font-medium">{dataSummary.fitness.workouts} Workouts</p>
                  <p className="text-xs text-muted-foreground">{dataSummary.fitness.weightEntries} Weight Logs</p>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Export Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label>Export Data</Label>
                <p className="text-sm text-muted-foreground">
                  Download all your LifePlanner data as a backup file
                </p>
              </div>
              <Button onClick={handleExport} disabled={isExporting}>
                {isExporting ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                Export Backup
              </Button>
            </div>
            {lastSync && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                Last exported: {formatDate(lastSync)}
              </div>
            )}
          </div>

          <Separator />

          {/* Import Section */}
          <div className="space-y-3">
            <div>
              <Label>Import Data</Label>
              <p className="text-sm text-muted-foreground mb-3">
                Load data from another device's backup file
              </p>
              <Input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileSelect}
                className="cursor-pointer"
              />
            </div>

            {/* Import Preview */}
            {importPreview && (
              <Card className="border-dashed">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <HardDrive className="h-4 w-4" />
                    Backup Preview
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap gap-2 text-sm">
                    <Badge variant="outline">
                      Version: {importPreview.version}
                    </Badge>
                    <Badge variant="outline">
                      Created: {formatDate(importPreview.exportDate)}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {importPreview.planner && (
                      <Badge className="bg-blue-500/10 text-blue-500">Planner Data</Badge>
                    )}
                    {importPreview.finance && (
                      <Badge className="bg-green-500/10 text-green-500">Finance Data</Badge>
                    )}
                    {importPreview.meals && (
                      <Badge className="bg-orange-500/10 text-orange-500">Meal Data</Badge>
                    )}
                    {importPreview.fitness && (
                      <Badge className="bg-red-500/10 text-red-500">Fitness Data</Badge>
                    )}
                    {importPreview.budget && (
                      <Badge className="bg-purple-500/10 text-purple-500">Budget Data</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 p-3 bg-yellow-500/10 rounded-lg text-sm">
                    <AlertCircle className="h-4 w-4 text-yellow-500" />
                    <span>This will overwrite your current data on this device.</span>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleImport} disabled={isImporting}>
                      {isImporting ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4 mr-2" />
                      )}
                      Import & Replace Data
                    </Button>
                    <Button variant="outline" onClick={() => setImportPreview(null)}>
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </CardContent>
      </Card>

      {/* How It Works */}
      <Card>
        <CardHeader>
          <CardTitle>How Device Sync Works</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
            <li>
              <strong className="text-foreground">Export</strong> your data from this device using the "Export Backup" button above
            </li>
            <li>
              <strong className="text-foreground">Transfer</strong> the downloaded JSON file to your other device using:
              <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                <li>iCloud Drive, Google Drive, or Dropbox</li>
                <li>Email the file to yourself</li>
                <li>AirDrop (iPhone/iPad to Mac)</li>
                <li>USB cable transfer</li>
              </ul>
            </li>
            <li>
              <strong className="text-foreground">Import</strong> the file on your other device using the "Import Data" section
            </li>
            <li>
              <strong className="text-foreground">Refresh</strong> the page to see your synced data
            </li>
          </ol>
          <p className="mt-4 text-sm bg-muted/50 p-3 rounded-lg">
            💡 <strong>Tip:</strong> For automatic syncing, use the Cloud Sync option above. 
            It's much easier than manually transferring files!
          </p>
        </CardContent>
      </Card>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Settings;
