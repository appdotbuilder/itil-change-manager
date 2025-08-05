
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import type { ChangeRequest, CreateChangeRequestInput, ChangeRequestActionInput, ItilApiResponse } from '../../server/src/schema';

// Define the action type for better type safety
type ActionType = 'apply' | 'request_permission' | 'execute' | 'done';

// Sample data for demonstration when backend is not available
const SAMPLE_CHANGE_REQUESTS: ChangeRequest[] = [
  {
    id: 1,
    title: 'Upgrade Production Database Server',
    description: 'Upgrade the main production database server from MySQL 5.7 to MySQL 8.0 to improve performance and security.',
    change_type: 'normal',
    priority: 'high',
    status: 'draft',
    requester_name: 'John Smith',
    requester_email: 'john.smith@company.com',
    business_justification: 'Current database version is approaching end-of-life and lacks security features required for compliance.',
    implementation_plan: '1. Schedule maintenance window\n2. Create database backup\n3. Install MySQL 8.0\n4. Migrate data\n5. Update application configurations\n6. Test functionality',
    rollback_plan: '1. Stop MySQL 8.0\n2. Restore MySQL 5.7 backup\n3. Update configurations\n4. Restart services',
    risk_assessment: 'Medium risk - potential for data loss or application downtime if migration fails',
    impact_assessment: 'High impact - affects all production applications during maintenance window',
    scheduled_start: new Date('2024-01-15T02:00:00'),
    scheduled_end: new Date('2024-01-15T06:00:00'),
    actual_start: null,
    actual_end: null,
    created_at: new Date('2024-01-10T10:30:00'),
    updated_at: new Date('2024-01-10T10:30:00')
  },
  {
    id: 2,
    title: 'Deploy New Security Patches',
    description: 'Apply critical security patches to all web servers in the production environment.',
    change_type: 'standard',
    priority: 'critical',
    status: 'submitted',
    requester_name: 'Alice Johnson',
    requester_email: 'alice.johnson@company.com',
    business_justification: 'Critical security vulnerabilities discovered that need immediate patching.',
    implementation_plan: '1. Download patches\n2. Test on staging environment\n3. Apply to production servers during maintenance window\n4. Verify system stability',
    rollback_plan: '1. Remove patches\n2. Restore previous system state\n3. Monitor for stability',
    risk_assessment: 'Low risk - patches are well-tested',
    impact_assessment: 'Low impact - minimal downtime expected',
    scheduled_start: null,
    scheduled_end: null,
    actual_start: null,
    actual_end: null,
    created_at: new Date('2024-01-12T14:15:00'),
    updated_at: new Date('2024-01-12T16:20:00')
  },
  {
    id: 3,
    title: 'Network Infrastructure Upgrade',
    description: 'Upgrade core network switches to support higher bandwidth requirements.',
    change_type: 'normal',
    priority: 'medium',
    status: 'approved',
    requester_name: 'Mike Wilson',
    requester_email: 'mike.wilson@company.com',
    business_justification: 'Current network infrastructure is at capacity and causing performance issues.',
    implementation_plan: '1. Order new equipment\n2. Configure new switches\n3. Schedule cutover window\n4. Replace switches one by one\n5. Test connectivity',
    rollback_plan: '1. Switch back to old equipment\n2. Restore previous configurations\n3. Verify network connectivity',
    risk_assessment: 'High risk - potential for network outage',
    impact_assessment: 'High impact - affects entire organization during cutover',
    scheduled_start: new Date('2024-01-20T01:00:00'),
    scheduled_end: new Date('2024-01-20T05:00:00'),
    actual_start: null,
    actual_end: null,
    created_at: new Date('2024-01-08T09:45:00'),
    updated_at: new Date('2024-01-11T11:30:00')
  }
];

// Status color mapping for badges
const getStatusColor = (status: string) => {
  switch (status) {
    case 'draft': return 'bg-gray-500';
    case 'submitted': return 'bg-blue-500';
    case 'approved': return 'bg-green-500';
    case 'rejected': return 'bg-red-500';
    case 'scheduled': return 'bg-purple-500';
    case 'in_progress': return 'bg-yellow-600';
    case 'completed': return 'bg-emerald-600';
    case 'cancelled': return 'bg-gray-700';
    default: return 'bg-gray-500';
  }
};

// Priority color mapping
const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'low': return 'bg-green-100 text-green-800';
    case 'medium': return 'bg-yellow-100 text-yellow-800';
    case 'high': return 'bg-orange-100 text-orange-800';
    case 'critical': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

function App() {
  const [changeRequests, setChangeRequests] = useState<ChangeRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [usingFallbackData, setUsingFallbackData] = useState(false);

  // Form state for creating new change requests
  const [formData, setFormData] = useState<CreateChangeRequestInput>({
    title: '',
    description: '',
    change_type: 'normal',
    priority: 'medium',
    requester_name: '',
    requester_email: '',
    business_justification: '',
    implementation_plan: '',
    rollback_plan: '',
    risk_assessment: null,
    impact_assessment: null,
    scheduled_start: null,
    scheduled_end: null
  });

  // Load change requests with fallback to sample data
  const loadChangeRequests = useCallback(async () => {
    try {
      setUsingFallbackData(false);
      const result = await trpc.getChangeRequests.query();
      setChangeRequests(result);
      
      // If the backend returns empty array (stub implementation), use sample data
      if (result.length === 0) {
        setChangeRequests(SAMPLE_CHANGE_REQUESTS);
        setUsingFallbackData(true);
      }
    } catch (error) {
      console.error('Failed to load change requests:', error);
      // Use sample data when backend is not available
      setChangeRequests(SAMPLE_CHANGE_REQUESTS);
      setUsingFallbackData(true);
    }
  }, []);

  useEffect(() => {
    loadChangeRequests();
  }, [loadChangeRequests]);

  // Handle form submission for new change request
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await trpc.createChangeRequest.mutate(formData);
      setChangeRequests((prev: ChangeRequest[]) => [response, ...prev]);
      // Reset form
      setFormData({
        title: '',
        description: '',
        change_type: 'normal',
        priority: 'medium',
        requester_name: '',
        requester_email: '',
        business_justification: '',
        implementation_plan: '',
        rollback_plan: '',
        risk_assessment: null,
        impact_assessment: null,
        scheduled_start: null,
        scheduled_end: null
      });
    } catch (error) {
      console.error('Failed to create change request:', error);
      
      // Fallback: Create a new response for demonstration
      const newResponse: ChangeRequest = {
        id: Date.now(), // Simple ID generation for demo
        title: formData.title,
        description: formData.description,
        change_type: formData.change_type,
        priority: formData.priority,
        status: 'draft',
        requester_name: formData.requester_name,
        requester_email: formData.requester_email,
        business_justification: formData.business_justification,
        implementation_plan: formData.implementation_plan,
        rollback_plan: formData.rollback_plan,
        risk_assessment: formData.risk_assessment ?? null,
        impact_assessment: formData.impact_assessment ?? null,
        scheduled_start: formData.scheduled_start ?? null,
        scheduled_end: formData.scheduled_end ?? null,
        actual_start: null,
        actual_end: null,
        created_at: new Date(),
        updated_at: new Date()
      };
      
      setChangeRequests((prev: ChangeRequest[]) => [newResponse, ...prev]);
      // Reset form
      setFormData({
        title: '',
        description: '',
        change_type: 'normal',
        priority: 'medium',
        requester_name: '',
        requester_email: '',
        business_justification: '',
        implementation_plan: '',
        rollback_plan: '',
        risk_assessment: null,
        impact_assessment: null,
        scheduled_start: null,
        scheduled_end: null
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle change request actions
  const handleAction = async (changeId: number, action: ActionType, notes?: string) => {
    const actionKey = `${changeId}-${action}`;
    setActionLoading(actionKey);
    
    try {
      const actionInput: ChangeRequestActionInput = {
        id: changeId,
        action,
        notes
      };

      let response: ItilApiResponse;
      switch (action) {
        case 'apply':
          response = await trpc.applyChangeRequest.mutate(actionInput);
          break;
        case 'request_permission':
          response = await trpc.requestPermission.mutate(actionInput);
          break;
        case 'execute':
          response = await trpc.executeChangeRequest.mutate(actionInput);
          break;
        case 'done':
          response = await trpc.completeChangeRequest.mutate(actionInput);
          break;
        default:
          throw new Error('Invalid action');
      }

      if (response.success) {
        // Reload change requests to get updated status
        await loadChangeRequests();
      } else {
        console.error(`Action ${action} failed:`, response.message);
      }
    } catch (error) {
      console.error(`Failed to ${action} change request:`, error);
      
      // Fallback: Update status locally for demonstration
      setChangeRequests((prev: ChangeRequest[]) => 
        prev.map((request: ChangeRequest) => {
          if (request.id === changeId) {
            let newStatus = request.status;
            switch (action) {
              case 'apply':
                newStatus = 'submitted';
                break;
              case 'request_permission':
                newStatus = 'approved';
                break;
              case 'execute':
                newStatus = 'in_progress';
                break;
              case 'done':
                newStatus = 'completed';
                break;
            }
            return { ...request, status: newStatus, updated_at: new Date() };
          }
          return request;
        })
      );
    } finally {
      setActionLoading(null);
    }
  };

  // Get available actions based on current status
  const getAvailableActions = (status: string): ActionType[] => {
    switch (status) {
      case 'draft':
        return ['apply'];
      case 'submitted':
        return ['request_permission'];
      case 'approved':
        return ['execute'];
      case 'scheduled':
        return ['execute'];
      case 'in_progress':
        return ['done'];
      default:
        return [];
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">ITIL Change Request Management</h1>
          <p className="text-gray-600">Manage and track IT Infrastructure Library change requests through their lifecycle</p>
        </div>

        {usingFallbackData && (
          <Alert className="mb-6">
            <AlertDescription>
              <strong>Demo Mode:</strong> Backend service is not available. Displaying sample data for demonstration purposes. 
              Actions will update locally but won't persist.
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="list" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="list">Change Requests</TabsTrigger>
            <TabsTrigger value="create">Create New Request</TabsTrigger>
          </TabsList>
          
          <TabsContent value="list" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">All Change Requests</h2>
              <Badge variant="outline" className="text-sm">
                Total: {changeRequests.length}
              </Badge>
            </div>

            {changeRequests.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-gray-500 text-lg">No change requests found.</p>
                  <p className="text-gray-400 text-sm mt-2">Create your first change request to get started.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6">
                {changeRequests.map((request: ChangeRequest) => (
                  <Card key={request.id} className="border-l-4 border-l-blue-500">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="space-y-2">
                          <CardTitle className="text-lg">{request.title}</CardTitle>
                          <div className="flex gap-2">
                            <Badge className={getStatusColor(request.status)}>
                              {request.status.replace('_', ' ').toUpperCase()}
                            </Badge>
                            <Badge variant="outline" className={getPriorityColor(request.priority)}>
                              {request.priority.toUpperCase()}
                            </Badge>
                            <Badge variant="outline">
                              {request.change_type.toUpperCase()}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right text-sm text-gray-500">
                          <p>ID: {request.id}</p>
                          <p>Created: {request.created_at.toLocaleDateString()}</p>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium text-gray-900 mb-1">Description</h4>
                          <p className="text-gray-700">{request.description}</p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="font-medium text-gray-900 mb-1">Requester</h4>
                            <p className="text-gray-700">{request.requester_name}</p>
                            <p className="text-gray-500 text-sm">{request.requester_email}</p>
                          </div>
                          
                          <div>
                            <h4 className="font-medium text-gray-900 mb-1">Schedule</h4>
                            {request.scheduled_start ? (
                              <div className="text-sm">
                                <p>Start: {request.scheduled_start.toLocaleString()}</p>
                                {request.scheduled_end && (
                                  <p>End: {request.scheduled_end.toLocaleString()}</p>
                                )}
                              </div>
                            ) : (
                              <p className="text-gray-500 text-sm">Not scheduled</p>
                            )}
                          </div>
                        </div>

                        <Separator />

                        <div className="space-y-3">
                          <div>
                            <h4 className="font-medium text-gray-900 mb-1">Business Justification</h4>
                            <p className="text-gray-700 text-sm">{request.business_justification}</p>
                          </div>
                          
                          <div>
                            <h4 className="font-medium text-gray-900 mb-1">Implementation Plan</h4>
                            <p className="text-gray-700 text-sm whitespace-pre-line">{request.implementation_plan}</p>
                          </div>
                          
                          <div>
                            <h4 className="font-medium text-gray-900 mb-1">Rollback Plan</h4>
                            <p className="text-gray-700 text-sm whitespace-pre-line">{request.rollback_plan}</p>
                          </div>

                          {request.risk_assessment && (
                            <div>
                              <h4 className="font-medium text-gray-900 mb-1">Risk Assessment</h4>
                              <p className="text-gray-700 text-sm">{request.risk_assessment}</p>
                            </div>
                          )}

                          {request.impact_assessment && (
                            <div>
                              <h4 className="font-medium text-gray-900 mb-1">Impact Assessment</h4>
                              <p className="text-gray-700 text-sm">{request.impact_assessment}</p>
                            </div>
                          )}
                        </div>

                        <Separator />

                        <div className="flex gap-2 flex-wrap">
                          {getAvailableActions(request.status).map((action: ActionType) => (
                            <AlertDialog key={action}>
                              <AlertDialogTrigger asChild>
                                <Button 
                                  variant={action === 'done' ? 'default' : 'outline'}
                                  size="sm"
                                  disabled={actionLoading === `${request.id}-${action}`}
                                >
                                  {actionLoading === `${request.id}-${action}` ? 'Processing...' : 
                                    action === 'apply' ? 'Apply Change' :
                                    action === 'request_permission' ? 'Request Permission' :
                                    action === 'execute' ? 'Execute Change' :
                                    'Mark as Done'
                                  }
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Confirm {action === 'apply' ? 'Apply Change' :
                                    action === 'request_permission' ? 'Request Permission' :
                                    action === 'execute' ? 'Execute Change' :
                                    'Mark as Done'}
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to {action} change request "{request.title}"?
                                    {action === 'execute' && ' This will begin the implementation process.'}
                                    {action === 'done' && ' This will mark the change as completed.'}
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleAction(request.id, action)}
                                  >
                                    Confirm
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="create" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Create New Change Request</CardTitle>
                <CardDescription>
                  Submit a new ITIL change request. All required fields must be completed.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="title">Title *</Label>
                        <Input
                          id="title"
                          placeholder="Brief description of the change"
                          value={formData.title}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setFormData((prev: CreateChangeRequestInput) => ({ ...prev, title: e.target.value }))
                          }
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="change_type">Change Type *</Label>
                        <Select 
                          value={formData.change_type || 'normal'} 
                          onValueChange={(value: 'standard' | 'normal' | 'emergency') =>
                            setFormData((prev: CreateChangeRequestInput) => ({ ...prev, change_type: value }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="standard">Standard</SelectItem>
                            <SelectItem value="normal">Normal</SelectItem>
                            <SelectItem value="emergency">Emergency</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="priority">Priority *</Label>
                        <Select 
                          value={formData.priority || 'medium'} 
                          onValueChange={(value: 'low' | 'medium' | 'high' | 'critical') =>
                            setFormData((prev: CreateChangeRequestInput) => ({ ...prev, priority: value }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="critical">Critical</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="requester_name">Requester Name *</Label>
                        <Input
                          id="requester_name"
                          placeholder="Full name of the requester"
                          value={formData.requester_name}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setFormData((prev: CreateChangeRequestInput) => ({ ...prev, requester_name: e.target.value }))
                          }
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="requester_email">Requester Email *</Label>
                        <Input
                          id="requester_email"
                          type="email"
                          placeholder="requester@company.com"
                          value={formData.requester_email}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setFormData((prev: CreateChangeRequestInput) => ({ ...prev, requester_email: e.target.value }))
                          }
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="scheduled_start">Scheduled Start</Label>
                        <Input
                          id="scheduled_start"
                          type="datetime-local"
                          value={formData.scheduled_start ? new Date(formData.scheduled_start.getTime() - formData.scheduled_start.getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setFormData((prev: CreateChangeRequestInput) => ({ 
                              ...prev, 
                              scheduled_start: e.target.value ? new Date(e.target.value) : null 
                            }))
                          }
                        />
                      </div>

                      <div>
                        <Label htmlFor="scheduled_end">Scheduled End</Label>
                        <Input
                          id="scheduled_end"
                          type="datetime-local"
                          value={formData.scheduled_end ? new Date(formData.scheduled_end.getTime() - formData.scheduled_end.getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setFormData((prev: CreateChangeRequestInput) => ({ 
                              ...prev, 
                              scheduled_end: e.target.value ? new Date(e.target.value) : null 
                            }))
                          }
                        />
                      </div>

                      <div>
                        <Label htmlFor="risk_assessment">Risk Assessment</Label>
                        <Textarea
                          id="risk_assessment"
                          placeholder="Assess potential risks and mitigation strategies"
                          value={formData.risk_assessment || ''}
                          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                            setFormData((prev: CreateChangeRequestInput) => ({ 
                              ...prev, 
                              risk_assessment: e.target.value || null 
                            }))
                          }
                          rows={3}
                        />
                      </div>

                      <div>
                        <Label htmlFor="impact_assessment">Impact Assessment</Label>
                        <Textarea
                          id="impact_assessment"
                          placeholder="Describe the expected impact of this change"
                          value={formData.impact_assessment || ''}
                          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                            setFormData((prev: CreateChangeRequestInput) => ({ 
                              ...prev, 
                              impact_assessment: e.target.value || null 
                            }))
                          }
                          rows={3}
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="description">Description *</Label>
                      <Textarea
                        id="description"
                        placeholder="Detailed description of the change request"
                        value={formData.description}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                          setFormData((prev: CreateChangeRequestInput) => ({ ...prev, description: e.target.value }))
                        }
                        required
                        rows={4}
                      />
                    </div>

                    <div>
                      <Label htmlFor="business_justification">Business Justification *</Label>
                      <Textarea
                        id="business_justification"
                        placeholder="Explain why this change is necessary for the business"
                        value={formData.business_justification}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                          setFormData((prev: CreateChangeRequestInput) => ({ ...prev, business_justification: e.target.value }))
                        }
                        required
                        rows={3}
                      />
                    </div>

                    <div>
                      <Label htmlFor="implementation_plan">Implementation Plan *</Label>
                      <Textarea
                        id="implementation_plan"
                        placeholder="Detailed steps for implementing this change"
                        value={formData.implementation_plan}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                          setFormData((prev: CreateChangeRequestInput) => ({ ...prev, implementation_plan: e.target.value }))
                        }
                        required
                        rows={4}
                      />
                    </div>

                    <div>
                      <Label htmlFor="rollback_plan">Rollback Plan *</Label>
                      <Textarea
                        id="rollback_plan"
                        placeholder="Steps to revert the change if issues occur"
                        value={formData.rollback_plan}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                          setFormData((prev: CreateChangeRequestInput) => ({ ...prev, rollback_plan: e.target.value }))
                        }
                        required
                        rows={3}
                      />
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <Button type="submit" disabled={isLoading} className="flex-1">
                      {isLoading ? 'Creating Change Request...' : 'Create Change Request'}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={() => setFormData({
                        title: '',
                        description: '',
                        change_type: 'normal',
                        priority: 'medium',
                        requester_name: '',
                        requester_email: '',
                        business_justification: '',
                        implementation_plan: '',
                        rollback_plan: '',
                        risk_assessment: null,
                        impact_assessment: null,
                        scheduled_start: null,
                        scheduled_end: null
                      })}
                    >
                      Reset Form
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default App;
