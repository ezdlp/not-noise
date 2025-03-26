import { useParams, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { HeadphonesIcon, ArrowLeftIcon, MusicIcon, UsersIcon } from 'lucide-react';
import { formatDistance, format } from 'date-fns';
import { Helmet } from 'react-helmet-async';

export default function CampaignDetail() {
  const { id } = useParams();
  const [campaign, setCampaign] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchCampaignDetails = async () => {
      try {
        setLoading(true);

        // Fetch the campaign from Supabase
        const { data, error } = await supabase
          .from('promotions')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;

        // Check if user owns this campaign
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        if (data.user_id !== user.id) {
          throw new Error('You do not have permission to view this campaign');
        }

        setCampaign(data);
      } catch (err: any) {
        console.error('Error fetching campaign:', err);
        setError(err.message || 'Failed to load campaign details');
      } finally {
        setLoading(false);
      }
    };

    fetchCampaignDetails();
  }, [id]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return "bg-yellow-100 text-yellow-800";
      case 'active': return "bg-green-100 text-green-800";
      case 'completed': return "bg-blue-100 text-blue-800";
      case 'cancelled': return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getProgress = (status: string) => {
    switch (status) {
      case 'pending': return 10;
      case 'active': return 50;
      case 'completed': return 100;
      case 'cancelled': return 100;
      default: return 0;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-10 px-4">
        <Helmet>
          <title>Campaign Loading... | Soundraiser</title>
        </Helmet>
        <div className="flex items-center mb-6">
          <Skeleton className="h-8 w-8 mr-2" />
          <Skeleton className="h-8 w-40" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-8 w-40 mb-2" />
                <Skeleton className="h-4 w-60" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-4" />
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          </div>
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-10 px-4">
        <Helmet>
          <title>Error | Soundraiser</title>
        </Helmet>
        <Card className="p-8 text-center">
          <div className="mb-4 text-red-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium mb-2">Error Loading Campaign</h3>
          <p className="text-muted-foreground mb-6">{error}</p>
          <Link to="/dashboard">
            <Button>Return to Dashboard</Button>
          </Link>
        </Card>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="container mx-auto py-10 px-4">
        <Helmet>
          <title>Campaign Not Found | Soundraiser</title>
        </Helmet>
        <Card className="p-8 text-center">
          <HeadphonesIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Campaign Not Found</h3>
          <p className="text-muted-foreground mb-6">The campaign you're looking for doesn't exist or has been removed.</p>
          <Link to="/dashboard">
            <Button>Return to Dashboard</Button>
          </Link>
        </Card>
      </div>
    );
  }

  // Format campaign data
  const progress = getProgress(campaign.status);
  const formattedDate = campaign.created_at 
    ? format(new Date(campaign.created_at), 'MMMM d, yyyy')
    : 'Unknown date';
  const timeAgo = campaign.created_at 
    ? formatDistance(new Date(campaign.created_at), new Date(), { addSuffix: true })
    : 'Unknown time';

  return (
    <div className="container mx-auto py-10 px-4">
      <Helmet>
        <title>{campaign.track_name} Campaign | Soundraiser</title>
      </Helmet>
      
      <div className="flex items-center mb-8">
        <Link to="/dashboard?tab=promotions">
          <Button variant="ghost" size="sm" className="gap-1">
            <ArrowLeftIcon className="h-4 w-4" />
            <span>Back to Campaigns</span>
          </Button>
        </Link>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between mb-2">
                <CardTitle className="text-2xl">{campaign.track_name}</CardTitle>
                <Badge 
                  className={getStatusColor(campaign.status)} 
                  variant="outline"
                >
                  {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                </Badge>
              </div>
              <CardDescription>
                <div className="flex items-center text-sm text-muted-foreground">
                  <span>{campaign.track_artist}</span>
                  <span className="mx-1">•</span>
                  <span className="capitalize">{campaign.genre}</span>
                  <span className="mx-1">•</span>
                  <span>{campaign.package_tier} Package</span>
                </div>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <div className="flex justify-between text-sm mb-2">
                  <span>Campaign Progress</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center mb-6">
                <div className="p-3 bg-muted/30 rounded-lg">
                  <div className="text-sm text-muted-foreground mb-1">Submissions</div>
                  <div className="text-xl font-semibold">{campaign.submission_count}</div>
                </div>
                <div className="p-3 bg-muted/30 rounded-lg">
                  <div className="text-sm text-muted-foreground mb-1">Est. Adds</div>
                  <div className="text-xl font-semibold">{campaign.estimated_additions}</div>
                </div>
                <div className="p-3 bg-muted/30 rounded-lg">
                  <div className="text-sm text-muted-foreground mb-1">Est. Streams</div>
                  <div className="text-xl font-semibold">{campaign.estimated_additions * 450}+</div>
                </div>
                <div className="p-3 bg-muted/30 rounded-lg">
                  <div className="text-sm text-muted-foreground mb-1">Cost</div>
                  <div className="text-xl font-semibold">${campaign.total_cost}</div>
                </div>
              </div>
              
              <div className="bg-muted/20 rounded-lg p-4">
                <h3 className="font-medium mb-3">Campaign Timeline</h3>
                <div className="space-y-4">
                  <div className="flex">
                    <div className="mr-3 relative">
                      <div className="h-6 w-6 bg-green-100 text-green-700 rounded-full flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="h-full w-0.5 bg-border absolute left-3 top-6 -translate-x-1/2"></div>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium">Campaign Created</h4>
                      <p className="text-xs text-muted-foreground">{formattedDate} ({timeAgo})</p>
                    </div>
                  </div>
                  
                  <div className="flex">
                    <div className="mr-3 relative">
                      <div className={`h-6 w-6 rounded-full flex items-center justify-center ${campaign.status !== 'pending' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                        {campaign.status !== 'pending' ? (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <span>2</span>
                        )}
                      </div>
                      <div className="h-full w-0.5 bg-border absolute left-3 top-6 -translate-x-1/2"></div>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium">Campaign Review</h4>
                      <p className="text-xs text-muted-foreground">Our team is reviewing your track</p>
                    </div>
                  </div>
                  
                  <div className="flex">
                    <div className="mr-3 relative">
                      <div className={`h-6 w-6 rounded-full flex items-center justify-center ${campaign.status === 'active' || campaign.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                        {campaign.status === 'active' || campaign.status === 'completed' ? (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <span>3</span>
                        )}
                      </div>
                      <div className="h-full w-0.5 bg-border absolute left-3 top-6 -translate-x-1/2"></div>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium">Promotion Active</h4>
                      <p className="text-xs text-muted-foreground">Your track is being pitched to curators</p>
                    </div>
                  </div>
                  
                  <div className="flex">
                    <div className="mr-3">
                      <div className={`h-6 w-6 rounded-full flex items-center justify-center ${campaign.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                        {campaign.status === 'completed' ? (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <span>4</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium">Campaign Complete</h4>
                      <p className="text-xs text-muted-foreground">Final report and results</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Campaign Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start">
                  <MusicIcon className="h-5 w-5 mr-3 text-muted-foreground" />
                  <div>
                    <h4 className="text-sm font-medium">Track Information</h4>
                    <p className="text-sm text-muted-foreground">{campaign.track_name} by {campaign.track_artist}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <HeadphonesIcon className="h-5 w-5 mr-3 text-muted-foreground" />
                  <div>
                    <h4 className="text-sm font-medium">Package</h4>
                    <p className="text-sm text-muted-foreground">{campaign.package_tier} - {campaign.submission_count} Submissions</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <UsersIcon className="h-5 w-5 mr-3 text-muted-foreground" />
                  <div>
                    <h4 className="text-sm font-medium">Target Audience</h4>
                    <p className="text-sm text-muted-foreground capitalize">{campaign.genre} music listeners</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Need Help?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">Have questions about your campaign? Our team is here to help.</p>
              <Button className="w-full">Contact Support</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 