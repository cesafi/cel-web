'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Upload, FileImage, Check, Save, Loader2, AlertTriangle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

// Actions & Services
import { extractValorantStatsFromImage } from '@/actions/valorant-ocr';
import { extractMlbbStatsFromImage } from '@/actions/mlbb-ocr';
import { PostGameStatsService } from '@/services/game-stats';

// Types
import { Game } from '@/lib/types/matches';
import { ValorantScreenshotData } from '@/lib/types/stats-valorant';
import { MlbbScreenshotData } from '@/lib/types/stats-mlbb';

// Sub-components (Inline for now to keep context together)
import { ValorantStatsVerificationForm } from './valorant-verification-form';
import { MlbbStatsVerificationForm } from './mlbb-verification-form';

interface PostGameStatsUploaderProps {
  gameId: number;
  esportId: number; 
  matchId: number;
  team1Id: string;
  team2Id: string;
  onSuccess?: () => void;
}

const ES_ID_MLBB = 1; // Assuming 1 based on previous context, verify later
const ES_ID_VALORANT = 2; // Assuming 2 based on previous context

export function PostGameStatsUploader({ 
    gameId, esportId, matchId, team1Id, team2Id, onSuccess 
}: PostGameStatsUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [step, setStep] = useState<'upload' | 'processing' | 'verify'>('upload');
  
  // Staging Data
  const [valorantData, setValorantData] = useState<ValorantScreenshotData | null>(null);
  const [mlbbData, setMlbbData] = useState<MlbbScreenshotData | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedutils = e.target.files[0];
      setFile(selectedutils);
      setPreview(URL.createObjectURL(selectedutils));
    }
  };

  const processImageMutation = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error("No file selected");
      const formData = new FormData();
      formData.append('image', file);

      if (esportId === ES_ID_VALORANT) {
         const res = await extractValorantStatsFromImage(formData);
         if (!res.success) throw new Error(res.error);
         return { type: 'valorant', data: res.data };
      } else {
         const res = await extractMlbbStatsFromImage(formData);
         if (!res.success) throw new Error(res.error);
         return { type: 'mlbb', data: res.data };
      }
    },
    onMutate: () => setStep('processing'),
    onSuccess: (result) => {
        if (result.type === 'valorant') setValorantData(result.data as ValorantScreenshotData);
        if (result.type === 'mlbb') setMlbbData(result.data as MlbbScreenshotData);
        setStep('verify');
        toast.success("Stats extracted successfully. Please verify.");
    },
    onError: (err) => {
        setStep('upload');
        toast.error(`Extraction failed: ${err.message}`);
    }
  });

  const saveStatsMutation = useMutation({
    mutationFn: async (verifiedData: any) => {
        // Here we map the verified data to the DB schema
        if (esportId === ES_ID_VALORANT) {
            // Transform UI data to DB Insert Type
             // ... Logic handled in sub-component or here
             // For now we assume verifyForm returns the DB-ready array
             return await PostGameStatsService.saveValorantStats(gameId, verifiedData);
        } else {
             return await PostGameStatsService.saveMlbbStats(gameId, verifiedData);
        }
    },
    onSuccess: () => {
        toast.success("Game stats saved successfully!");
        if (onSuccess) onSuccess();
    },
    onError: (err) => {
        toast.error("Failed to save stats to database.");
    }
  });

  return (
    <div className="space-y-6">
        
        {/* Upload Step */}
        {step === 'upload' && (
            <Card>
                <CardHeader>
                    <CardTitle>Upload Post-Game Screenshot</CardTitle>
                    <CardDescription>
                        Upload the final scoreboard screenshot. AI will extract kills, deaths, and other stats.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid w-full items-center gap-1.5">
                        <Label htmlFor="image-upload">Scoreboard Image</Label>
                        <Input id="image-upload" type="file" accept="image/*" onChange={handleFileChange} />
                    </div>

                    {preview && (
                        <div className="relative aspect-video w-full rounded-lg overflow-hidden border">
                            <img src={preview} alt="Preview" className="object-cover w-full h-full" />
                        </div>
                    )}

                    <div className="flex justify-end">
                        <Button 
                            onClick={() => processImageMutation.mutate()} 
                            disabled={!file || processImageMutation.isPending}
                        >
                            {processImageMutation.isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <Upload className="mr-2 h-4 w-4" />
                                    Process Stats
                                </>
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        )}

        {/* Verification Step */}
        {step === 'verify' && (
            <div className="space-y-4">
                 <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold">Verify Extracted Data</h3>
                    <Button variant="outline" size="sm" onClick={() => setStep('upload')}>
                        <FileImage className="mr-2 h-4 w-4" />
                        Re-upload
                    </Button>
                 </div>

                 {esportId === ES_ID_VALORANT && valorantData ? (
                     <ValorantStatsVerificationForm 
                        initialData={valorantData} 
                        gameId={gameId}
                        team1Id={team1Id} // Pass IDs for mapping names to team_ids
                        team2Id={team2Id}
                        onSave={(data) => saveStatsMutation.mutate(data)}
                        isSaving={saveStatsMutation.isPending}
                     />
                 ) : null}

                 {/* TODO: Add MLBB Form */}
                 {esportId !== ES_ID_VALORANT && mlbbData ? (
                     <MlbbStatsVerificationForm 
                        initialData={mlbbData}
                        gameId={gameId}
                        team1Id={team1Id}
                        team2Id={team2Id}
                        onSave={(data) => saveStatsMutation.mutate(data)}
                        isSaving={saveStatsMutation.isPending}
                     />
                 ) : null}
            </div>
        )}
    </div>
  );
}
