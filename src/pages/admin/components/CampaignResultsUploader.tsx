import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";
import { AlertCircleIcon, CheckCircleIcon, FileTextIcon, UploadIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import Papa from "papaparse";

type Campaign = {
  id: string;
  track_name: string;
  artist_name: string;
}

type CampaignResultsUploaderProps = {
  campaigns: Campaign[];
  isLoading: boolean;
}

export function CampaignResultsUploader({ 
  campaigns, 
  isLoading 
}: CampaignResultsUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>("");
  const [csvData, setCsvData] = useState<any[]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [uploadStep, setUploadStep] = useState<"select" | "preview" | "processing" | "complete" | "error">("select");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setErrorMessage("");
    }
  };

  const handleCampaignChange = (value: string) => {
    setSelectedCampaignId(value);
    setErrorMessage("");
  };

  const resetForm = () => {
    setFile(null);
    setSelectedCampaignId("");
    setCsvData([]);
    setCsvHeaders([]);
    setUploadStep("select");
    setErrorMessage("");
    setUploadProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const previewCsv = () => {
    if (!file || !selectedCampaignId) {
      setErrorMessage("Please select both a campaign and a CSV file.");
      return;
    }

    Papa.parse(file, {
      header: true,
      preview: 5, // Preview first 5 rows
      complete: (results) => {
        if (results.errors.length > 0) {
          setErrorMessage("Error parsing CSV file: " + results.errors[0].message);
          return;
        }

        if (results.data.length === 0) {
          setErrorMessage("The CSV file appears to be empty.");
          return;
        }

        // Check if the CSV has the required headers
        const data = results.data as Record<string, string>[];
        const headers = Object.keys(data[0]);
        
        const requiredHeaders = ["playlist_name", "playlist_url"];
        const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));

        if (missingHeaders.length > 0) {
          setErrorMessage(`CSV is missing required headers: ${missingHeaders.join(", ")}`);
          return;
        }

        setCsvHeaders(headers);
        setCsvData(data);
        setUploadStep("preview");
      },
      error: (error) => {
        setErrorMessage("Error reading CSV file: " + error.message);
      }
    });
  };

  const uploadFile = async () => {
    if (!file || !selectedCampaignId) return;

    try {
      setUploadStep("processing");
      setUploadProgress(10);

      // 1. Upload the file to Supabase Storage
      const campaign = campaigns.find(c => c.id === selectedCampaignId);
      const fileExt = file.name.split('.').pop();
      const fileName = `${selectedCampaignId}_${Date.now()}.${fileExt}`;
      const filePath = `${selectedCampaignId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("campaign-result-files")
        .upload(filePath, file);

      if (uploadError) throw new Error(`Error uploading file: ${uploadError.message}`);
      
      setUploadProgress(60);

      // 2. Create a record in the campaign_result_files table
      const { data: user } = await supabase.auth.getUser();
      const { error: recordError } = await supabase
        .from("campaign_result_files")
        .insert({
          promotion_id: selectedCampaignId,
          file_path: filePath,
          uploaded_by: user.user?.id,
          processed: false
        });

      if (recordError) throw new Error(`Error creating file record: ${recordError.message}`);
      
      setUploadProgress(80);

      // 3. Process the file by calling the API
      const response = await fetch("/api/admin/process-campaign-results", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          campaignId: selectedCampaignId,
          filePath,
        }),
      });

      setUploadProgress(100);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error processing file");
      }

      toast({
        title: "Results uploaded successfully",
        description: `Results for ${campaign?.track_name} have been processed.`,
      });

      setUploadStep("complete");
    } catch (error) {
      console.error("Upload error:", error);
      setErrorMessage(error instanceof Error ? error.message : "An unknown error occurred");
      setUploadStep("error");
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl">Upload Campaign Results</CardTitle>
      </CardHeader>
      <CardContent>
        {uploadStep === "select" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="campaign" className="text-sm font-medium">
                Select Campaign
              </label>
              <Select onValueChange={handleCampaignChange} value={selectedCampaignId}>
                <SelectTrigger id="campaign" className="w-full">
                  <SelectValue placeholder="Select a campaign" />
                </SelectTrigger>
                <SelectContent>
                  {isLoading ? (
                    <SelectItem value="loading" disabled>
                      Loading campaigns...
                    </SelectItem>
                  ) : campaigns?.length === 0 ? (
                    <SelectItem value="none" disabled>
                      No active campaigns found
                    </SelectItem>
                  ) : (
                    campaigns?.map((campaign) => (
                      <SelectItem key={campaign.id} value={campaign.id}>
                        {campaign.track_name} - {campaign.artist_name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label htmlFor="csv-file" className="text-sm font-medium">
                Upload CSV File
              </label>
              <div className="flex items-center gap-2">
                <Input
                  ref={fileInputRef}
                  id="csv-file"
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <FileTextIcon className="mr-2 h-4 w-4" />
                  Browse
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                CSV must include playlist_name, playlist_url, and optionally playlist_followers, feedback, date_added
              </p>
            </div>

            {errorMessage && (
              <Alert variant="destructive">
                <AlertCircleIcon className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}

            <div className="flex justify-end gap-2">
              <Button onClick={previewCsv} disabled={!file || !selectedCampaignId}>
                Preview Data
              </Button>
            </div>
          </div>
        )}

        {uploadStep === "preview" && (
          <div className="space-y-4">
            <Alert>
              <AlertTitle>Preview of the first 5 rows</AlertTitle>
              <AlertDescription>
                Please verify the data before uploading. The system will process this data to update campaign metrics.
              </AlertDescription>
            </Alert>

            <div className="border rounded-md overflow-auto max-h-64">
              <Table>
                <TableHeader>
                  <TableRow>
                    {csvHeaders.map((header) => (
                      <TableHead key={header}>{header}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {csvData.map((row, i) => (
                    <TableRow key={i}>
                      {csvHeaders.map((header) => (
                        <TableCell key={`${i}-${header}`}>{row[header]}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setUploadStep("select")}>
                Back
              </Button>
              <Button onClick={uploadFile}>
                <UploadIcon className="mr-2 h-4 w-4" />
                Upload and Process
              </Button>
            </div>
          </div>
        )}

        {uploadStep === "processing" && (
          <div className="space-y-4 py-8">
            <div className="flex flex-col items-center justify-center">
              <div className="relative h-4 w-full bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300 ease-in-out"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p className="mt-4 text-center">
                Processing campaign results... {uploadProgress}%
              </p>
              <p className="text-sm text-muted-foreground mt-2 text-center">
                This may take a minute as we upload, parse the CSV, and update campaign metrics.
              </p>
            </div>
          </div>
        )}

        {uploadStep === "complete" && (
          <div className="space-y-4 py-8">
            <div className="flex flex-col items-center justify-center">
              <div className="rounded-full bg-green-100 p-3">
                <CheckCircleIcon className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="mt-4 text-lg font-medium">Processing Complete</h3>
              <p className="text-sm text-muted-foreground mt-2 text-center">
                Campaign results have been successfully processed and metrics have been updated.
              </p>
              <Button className="mt-6" onClick={resetForm}>
                Upload Another File
              </Button>
            </div>
          </div>
        )}

        {uploadStep === "error" && (
          <div className="space-y-4 py-8">
            <Alert variant="destructive">
              <AlertCircleIcon className="h-4 w-4" />
              <AlertTitle>Processing Error</AlertTitle>
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={resetForm}>
                Start Over
              </Button>
              <Button onClick={() => setUploadStep("select")}>
                Try Again
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
