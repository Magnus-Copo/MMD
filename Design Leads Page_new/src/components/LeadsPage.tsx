import { useState } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  MoreVertical,
  Phone,
  Mail,
  Building2,
  TrendingUp,
  Clock,
  CheckCircle2,
  ArrowUpRight,
  Calendar,
  Users,
  Target,
  AlertCircle,
  MessageSquare,
  ExternalLink,
  Edit,
  Trash2,
  PhoneCall,
  Send,
  FileText,
  Activity,
  BarChart3,
  Bell,
  X,
  Check,
  AlertTriangle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Card } from './ui/card';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter 
} from './ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from './ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from './ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Checkbox } from './ui/checkbox';
import { Progress } from './ui/progress';
import { Separator } from './ui/separator';
import { ScrollArea } from './ui/scroll-area';
import { toast } from 'sonner@2.0.3';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface Activity {
  id: string;
  type: 'call' | 'whatsapp' | 'email' | 'meeting' | 'note';
  summary: string;
  outcome: string;
  date: string;
  time: string;
  createdBy: string;
  nextFollowUp?: string;
}

interface Lead {
  id: string;
  sourcePlatform: string;
  companyName: string;
  sector: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  contactLinkedIn: string;
  confidence: number;
  status: 'new' | 'contacted' | 'follow-up' | 'converted' | 'lost';
  notes: string;
  createdDate: string;
  followUpDate: string;
  lastActivity: string;
  assignedTo: string;
  createdBy: string;
  activities: Activity[];
  isOverdue: boolean;
  daysSinceCreated: number;
}

const mockLeads: Lead[] = [
  {
    id: 'L-001',
    sourcePlatform: 'LinkedIn',
    companyName: 'TechCorp Solutions',
    sector: 'IT - SaaS',
    contactName: 'Rahul Sharma',
    contactPhone: '+91 98765 43210',
    contactEmail: 'rahul.sharma@techcorp.com',
    contactLinkedIn: 'linkedin.com/in/rahulsharma',
    confidence: 85,
    status: 'follow-up',
    notes: 'Interested in hiring 5 developers. Next call scheduled.',
    createdDate: '2026-01-15',
    followUpDate: '2026-02-06',
    lastActivity: '2 days ago',
    assignedTo: 'Rashmi',
    createdBy: 'Admin',
    isOverdue: true,
    daysSinceCreated: 20,
    activities: [
      {
        id: 'A-001',
        type: 'call',
        summary: 'Initial discovery call',
        outcome: 'Positive - interested in 5 React developers',
        date: '2026-01-15',
        time: '14:30',
        createdBy: 'Rashmi',
        nextFollowUp: '2026-01-20'
      },
      {
        id: 'A-002',
        type: 'email',
        summary: 'Sent JD template and pricing',
        outcome: 'Awaiting response',
        date: '2026-01-20',
        time: '10:15',
        createdBy: 'Rashmi',
        nextFollowUp: '2026-02-06'
      }
    ]
  },
  {
    id: 'L-002',
    sourcePlatform: 'Company Website',
    companyName: 'Global Innovations Ltd',
    sector: 'IT - Enterprise',
    contactName: 'Priya Desai',
    contactPhone: '+91 98123 45678',
    contactEmail: 'priya.d@globalinno.com',
    contactLinkedIn: 'linkedin.com/in/priyadesai',
    confidence: 65,
    status: 'contacted',
    notes: 'Awaiting budget approval for Q1 hiring.',
    createdDate: '2026-01-20',
    followUpDate: '2026-02-10',
    lastActivity: '5 days ago',
    assignedTo: 'Manjunath',
    createdBy: 'Manjunath',
    isOverdue: false,
    daysSinceCreated: 15,
    activities: [
      {
        id: 'A-003',
        type: 'email',
        summary: 'Cold outreach email sent',
        outcome: 'Reply received - scheduled call',
        date: '2026-01-20',
        time: '09:00',
        createdBy: 'Manjunath',
        nextFollowUp: '2026-01-25'
      },
      {
        id: 'A-004',
        type: 'call',
        summary: 'Budget discussion call',
        outcome: 'Waiting for budget approval',
        date: '2026-01-25',
        time: '15:00',
        createdBy: 'Manjunath',
        nextFollowUp: '2026-02-10'
      }
    ]
  },
  {
    id: 'L-003',
    sourcePlatform: 'Referral',
    companyName: 'StartupHub India',
    sector: 'Startup - Fintech',
    contactName: 'Amit Patel',
    contactPhone: '+91 99887 76655',
    contactEmail: 'amit@startuphub.in',
    contactLinkedIn: 'linkedin.com/in/amitpatel',
    confidence: 92,
    status: 'converted',
    notes: 'Successfully converted to requirement MMD-RASHMI-20260125-001.',
    createdDate: '2026-01-10',
    followUpDate: '',
    lastActivity: '1 week ago',
    assignedTo: 'Rashmi',
    createdBy: 'Admin',
    isOverdue: false,
    daysSinceCreated: 25,
    activities: [
      {
        id: 'A-005',
        type: 'meeting',
        summary: 'In-person meeting at office',
        outcome: 'Excellent - ready to hire 10 candidates',
        date: '2026-01-12',
        time: '11:00',
        createdBy: 'Rashmi',
        nextFollowUp: '2026-01-15'
      },
      {
        id: 'A-006',
        type: 'call',
        summary: 'JD finalization call',
        outcome: 'Converted to active requirement',
        date: '2026-01-25',
        time: '16:30',
        createdBy: 'Rashmi'
      }
    ]
  },
  {
    id: 'L-004',
    sourcePlatform: 'Job Portal Scraping',
    companyName: 'Manufacturing Solutions Inc',
    sector: 'Core - Manufacturing',
    contactName: 'Suresh Kumar',
    contactPhone: '+91 97654 32109',
    contactEmail: 'suresh.k@mfgsol.com',
    contactLinkedIn: '',
    confidence: 45,
    status: 'new',
    notes: 'Found through automated scraping. Needs initial contact.',
    createdDate: '2026-02-03',
    followUpDate: '2026-02-05',
    lastActivity: '1 day ago',
    assignedTo: 'Scraping Team',
    createdBy: 'System',
    isOverdue: false,
    daysSinceCreated: 1,
    activities: []
  },
  {
    id: 'L-005',
    sourcePlatform: 'Event',
    companyName: 'Digital Marketing Pro',
    sector: 'IT - Marketing Tech',
    contactName: 'Sneha Iyer',
    contactPhone: '+91 98000 11223',
    contactEmail: 'sneha@digimktpro.com',
    contactLinkedIn: 'linkedin.com/in/snehaiyer',
    confidence: 78,
    status: 'follow-up',
    notes: 'Met at tech conference. Looking for content writers and designers.',
    createdDate: '2026-01-28',
    followUpDate: '2026-02-07',
    lastActivity: '3 days ago',
    assignedTo: 'Manjunath',
    createdBy: 'Manjunath',
    isOverdue: false,
    daysSinceCreated: 7,
    activities: [
      {
        id: 'A-007',
        type: 'meeting',
        summary: 'Met at TechSummit 2026',
        outcome: 'Great connection - need creative talent',
        date: '2026-01-28',
        time: '14:00',
        createdBy: 'Manjunath',
        nextFollowUp: '2026-02-01'
      },
      {
        id: 'A-008',
        type: 'whatsapp',
        summary: 'Shared portfolio samples',
        outcome: 'Positive feedback - will review and revert',
        date: '2026-02-01',
        time: '10:30',
        createdBy: 'Manjunath',
        nextFollowUp: '2026-02-07'
      }
    ]
  }
];

export function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>(mockLeads);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isActivityDialogOpen, setIsActivityDialogOpen] = useState(false);
  const [isConvertDialogOpen, setIsConvertDialogOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterSector, setFilterSector] = useState<string>('all');
  const [filterSource, setFilterSource] = useState<string>('all');
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [showOverdueOnly, setShowOverdueOnly] = useState(false);
  const [expandedActivities, setExpandedActivities] = useState<{ [key: string]: boolean }>({});

  // Statistics calculations
  const stats = {
    total: leads.length,
    converted: leads.filter(l => l.status === 'converted').length,
    followUpsDue: leads.filter(l => 
      l.followUpDate && new Date(l.followUpDate) <= new Date()
    ).length,
    overdue: leads.filter(l => l.isOverdue).length,
    avgConfidence: Math.round(leads.reduce((acc, l) => acc + l.confidence, 0) / leads.length)
  };

  const conversionRate = ((stats.converted / stats.total) * 100).toFixed(1);

  // Source analytics
  const sourceData = [
    { name: 'LinkedIn', value: leads.filter(l => l.sourcePlatform === 'LinkedIn').length },
    { name: 'Website', value: leads.filter(l => l.sourcePlatform === 'Company Website').length },
    { name: 'Referral', value: leads.filter(l => l.sourcePlatform === 'Referral').length },
    { name: 'Scraping', value: leads.filter(l => l.sourcePlatform === 'Job Portal Scraping').length },
    { name: 'Event', value: leads.filter(l => l.sourcePlatform === 'Event').length },
  ].filter(item => item.value > 0);

  const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];

  // Status distribution data
  const statusData = [
    { status: 'New', count: leads.filter(l => l.status === 'new').length },
    { status: 'Contacted', count: leads.filter(l => l.status === 'contacted').length },
    { status: 'Follow-up', count: leads.filter(l => l.status === 'follow-up').length },
    { status: 'Converted', count: leads.filter(l => l.status === 'converted').length },
    { status: 'Lost', count: leads.filter(l => l.status === 'lost').length },
  ];

  // Filter leads
  const filteredLeads = leads.filter(lead => {
    const matchesSearch = 
      lead.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.contactName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.sector.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || lead.status === filterStatus;
    const matchesSector = filterSector === 'all' || lead.sector.includes(filterSector);
    const matchesSource = filterSource === 'all' || lead.sourcePlatform === filterSource;
    const matchesOverdue = !showOverdueOnly || lead.isOverdue;
    
    return matchesSearch && matchesStatus && matchesSector && matchesSource && matchesOverdue;
  });

  const getStatusBadge = (status: Lead['status']) => {
    const variants = {
      'new': { variant: 'default' as const, label: 'New', color: 'bg-blue-500' },
      'contacted': { variant: 'secondary' as const, label: 'Contacted', color: 'bg-purple-500' },
      'follow-up': { variant: 'outline' as const, label: 'Follow-up', color: 'bg-orange-500' },
      'converted': { variant: 'default' as const, label: 'Converted', color: 'bg-green-500' },
      'lost': { variant: 'destructive' as const, label: 'Lost', color: 'bg-red-500' }
    };
    
    const config = variants[status];
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <span className={`w-2 h-2 rounded-full ${config.color}`}></span>
        {config.label}
      </Badge>
    );
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 80) return <Badge className="bg-green-600">High ({confidence}%)</Badge>;
    if (confidence >= 60) return <Badge className="bg-yellow-600">Medium ({confidence}%)</Badge>;
    return <Badge variant="destructive">Low ({confidence}%)</Badge>;
  };

  const getActivityIcon = (type: Activity['type']) => {
    const icons = {
      call: <PhoneCall className="w-4 h-4" />,
      whatsapp: <MessageSquare className="w-4 h-4" />,
      email: <Mail className="w-4 h-4" />,
      meeting: <Users className="w-4 h-4" />,
      note: <FileText className="w-4 h-4" />
    };
    return icons[type];
  };

  const handleAddLead = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    // Duplicate check
    const existingCompany = leads.find(
      l => l.companyName.toLowerCase() === (formData.get('companyName') as string).toLowerCase()
    );
    
    if (existingCompany) {
      toast.error(`Lead for "${existingCompany.companyName}" already exists!`, {
        description: 'Please search for the existing lead or use a different company name.'
      });
      return;
    }

    const newLead: Lead = {
      id: `L-${String(leads.length + 1).padStart(3, '0')}`,
      sourcePlatform: formData.get('sourcePlatform') as string,
      companyName: formData.get('companyName') as string,
      sector: formData.get('sector') as string,
      contactName: formData.get('contactName') as string,
      contactPhone: formData.get('contactPhone') as string,
      contactEmail: formData.get('contactEmail') as string,
      contactLinkedIn: formData.get('contactLinkedIn') as string,
      confidence: parseInt(formData.get('confidence') as string),
      status: 'new',
      notes: formData.get('notes') as string,
      createdDate: new Date().toISOString().split('T')[0],
      followUpDate: formData.get('followUpDate') as string,
      lastActivity: 'Just now',
      assignedTo: formData.get('assignedTo') as string,
      createdBy: 'Current User',
      activities: [],
      isOverdue: false,
      daysSinceCreated: 0
    };

    setLeads([newLead, ...leads]);
    setIsAddDialogOpen(false);
    toast.success('Lead added successfully!', {
      description: `${newLead.companyName} has been added to your pipeline.`
    });
  };

  const handleEditLead = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedLead) return;

    const formData = new FormData(e.currentTarget);
    
    const updatedLead: Lead = {
      ...selectedLead,
      sourcePlatform: formData.get('sourcePlatform') as string,
      companyName: formData.get('companyName') as string,
      sector: formData.get('sector') as string,
      contactName: formData.get('contactName') as string,
      contactPhone: formData.get('contactPhone') as string,
      contactEmail: formData.get('contactEmail') as string,
      contactLinkedIn: formData.get('contactLinkedIn') as string,
      confidence: parseInt(formData.get('confidence') as string),
      notes: formData.get('notes') as string,
      followUpDate: formData.get('followUpDate') as string,
      assignedTo: formData.get('assignedTo') as string,
      status: formData.get('status') as Lead['status']
    };

    setLeads(leads.map(l => l.id === selectedLead.id ? updatedLead : l));
    setIsEditDialogOpen(false);
    toast.success('Lead updated successfully!');
  };

  const handleAddActivity = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedLead) return;

    const formData = new FormData(e.currentTarget);
    
    const newActivity: Activity = {
      id: `A-${String(Math.random()).substring(2, 8)}`,
      type: formData.get('activityType') as Activity['type'],
      summary: formData.get('summary') as string,
      outcome: formData.get('outcome') as string,
      date: formData.get('activityDate') as string,
      time: formData.get('activityTime') as string,
      createdBy: 'Current User',
      nextFollowUp: formData.get('nextFollowUp') as string || undefined
    };

    const updatedLead = {
      ...selectedLead,
      activities: [newActivity, ...selectedLead.activities],
      lastActivity: 'Just now',
      followUpDate: newActivity.nextFollowUp || selectedLead.followUpDate,
      status: selectedLead.status === 'new' ? 'contacted' as const : selectedLead.status
    };

    setLeads(leads.map(l => l.id === selectedLead.id ? updatedLead : l));
    setSelectedLead(updatedLead);
    setIsActivityDialogOpen(false);
    toast.success('Activity logged successfully!');
  };

  const handleConvertLead = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedLead) return;

    const formData = new FormData(e.currentTarget);
    const approvalNotes = formData.get('approvalNotes') as string;

    // Update lead to converted status
    const updatedLead = {
      ...selectedLead,
      status: 'converted' as const,
      notes: `${selectedLead.notes}\n\nConverted to Company Master - ${approvalNotes}`
    };

    setLeads(leads.map(l => l.id === selectedLead.id ? updatedLead : l));
    setIsConvertDialogOpen(false);
    setIsViewDialogOpen(false);
    
    toast.success('Lead converted successfully!', {
      description: `${selectedLead.companyName} is now being processed for Company Master creation.`
    });
  };

  const handleDeleteLead = (leadId: string) => {
    const lead = leads.find(l => l.id === leadId);
    if (!lead) return;

    if (confirm(`Are you sure you want to delete lead "${lead.companyName}"? This action cannot be undone.`)) {
      setLeads(leads.filter(l => l.id !== leadId));
      toast.success('Lead deleted successfully');
    }
  };

  const handleBulkExport = () => {
    const leadsToExport = selectedLeads.length > 0 
      ? leads.filter(l => selectedLeads.includes(l.id))
      : filteredLeads;

    const csvData = [
      ['Lead ID', 'Company', 'Contact Name', 'Phone', 'Email', 'Sector', 'Source', 'Confidence', 'Status', 'Created Date', 'Follow-up Date', 'Assigned To'],
      ...leadsToExport.map(l => [
        l.id,
        l.companyName,
        l.contactName,
        l.contactPhone,
        l.contactEmail,
        l.sector,
        l.sourcePlatform,
        `${l.confidence}%`,
        l.status,
        l.createdDate,
        l.followUpDate,
        l.assignedTo
      ])
    ];

    const csv = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();

    toast.success('Leads exported successfully!', {
      description: `${leadsToExport.length} leads exported to CSV`
    });
  };

  const handleQuickCall = (phone: string) => {
    window.open(`tel:${phone}`);
    toast.info('Opening dialer...');
  };

  const handleQuickEmail = (email: string) => {
    window.open(`mailto:${email}`);
    toast.info('Opening email client...');
  };

  const toggleSelectAll = () => {
    if (selectedLeads.length === filteredLeads.length) {
      setSelectedLeads([]);
    } else {
      setSelectedLeads(filteredLeads.map(l => l.id));
    }
  };

  const toggleSelectLead = (leadId: string) => {
    setSelectedLeads(prev => 
      prev.includes(leadId) 
        ? prev.filter(id => id !== leadId)
        : [...prev, leadId]
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Leads Management</h1>
              <p className="text-gray-600 mt-1">Track and convert potential hiring opportunities • Module 9</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={handleBulkExport} className="gap-2">
                <Download className="w-4 h-4" />
                Export {selectedLeads.length > 0 && `(${selectedLeads.length})`}
              </Button>
              <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2 bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4" />
                Add New Lead
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Overdue Alerts Banner */}
      {stats.overdue > 0 && (
        <div className="bg-orange-50 border-b border-orange-200">
          <div className="px-8 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              <div>
                <p className="font-medium text-orange-900">
                  {stats.overdue} lead{stats.overdue > 1 ? 's' : ''} overdue for follow-up
                </p>
                <p className="text-sm text-orange-700">These require immediate attention</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowOverdueOnly(!showOverdueOnly)}
              className="border-orange-300"
            >
              {showOverdueOnly ? 'Show All' : 'Show Overdue Only'}
            </Button>
          </div>
        </div>
      )}

      <div className="px-8 py-6">
        <Tabs defaultValue="pipeline" className="space-y-6">
          <TabsList className="bg-white border">
            <TabsTrigger value="pipeline" className="gap-2">
              <Target className="w-4 h-4" />
              Pipeline
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          {/* Pipeline Tab */}
          <TabsContent value="pipeline" className="space-y-6">
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-700">Total Leads</p>
                    <p className="text-3xl font-bold text-blue-900 mt-2">{stats.total}</p>
                    <p className="text-xs text-blue-600 mt-1">Active pipeline</p>
                  </div>
                  <div className="p-3 bg-blue-600 rounded-lg">
                    <Target className="w-6 h-6 text-white" />
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-700">Conversion Rate</p>
                    <p className="text-3xl font-bold text-green-900 mt-2">{conversionRate}%</p>
                    <p className="text-xs text-green-600 mt-1">{stats.converted} converted</p>
                  </div>
                  <div className="p-3 bg-green-600 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-orange-700">Follow-ups Due</p>
                    <p className="text-3xl font-bold text-orange-900 mt-2">{stats.followUpsDue}</p>
                    <p className="text-xs text-orange-600 mt-1">Requires attention</p>
                  </div>
                  <div className="p-3 bg-orange-600 rounded-lg">
                    <Clock className="w-6 h-6 text-white" />
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-gradient-to-br from-red-50 to-red-100 border-red-200">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-red-700">Overdue</p>
                    <p className="text-3xl font-bold text-red-900 mt-2">{stats.overdue}</p>
                    <p className="text-xs text-red-600 mt-1">Immediate action</p>
                  </div>
                  <div className="p-3 bg-red-600 rounded-lg">
                    <AlertCircle className="w-6 h-6 text-white" />
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-700">Avg Confidence</p>
                    <p className="text-3xl font-bold text-purple-900 mt-2">{stats.avgConfidence}%</p>
                    <p className="text-xs text-purple-600 mt-1">Lead quality</p>
                  </div>
                  <div className="p-3 bg-purple-600 rounded-lg">
                    <CheckCircle2 className="w-6 h-6 text-white" />
                  </div>
                </div>
              </Card>
            </div>

            {/* Filters and Search */}
            <Card className="p-6">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input 
                      placeholder="Search by company, contact, or sector..." 
                      className="pl-10"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
                
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-full lg:w-[160px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="contacted">Contacted</SelectItem>
                    <SelectItem value="follow-up">Follow-up</SelectItem>
                    <SelectItem value="converted">Converted</SelectItem>
                    <SelectItem value="lost">Lost</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterSector} onValueChange={setFilterSector}>
                  <SelectTrigger className="w-full lg:w-[160px]">
                    <SelectValue placeholder="Sector" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sectors</SelectItem>
                    <SelectItem value="IT">IT</SelectItem>
                    <SelectItem value="Startup">Startup</SelectItem>
                    <SelectItem value="Core">Core</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterSource} onValueChange={setFilterSource}>
                  <SelectTrigger className="w-full lg:w-[180px]">
                    <SelectValue placeholder="Source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sources</SelectItem>
                    <SelectItem value="LinkedIn">LinkedIn</SelectItem>
                    <SelectItem value="Company Website">Website</SelectItem>
                    <SelectItem value="Referral">Referral</SelectItem>
                    <SelectItem value="Job Portal Scraping">Scraping</SelectItem>
                    <SelectItem value="Event">Event</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {selectedLeads.length > 0 && (
                <div className="mt-4 pt-4 border-t flex items-center justify-between">
                  <p className="text-sm text-gray-600">
                    {selectedLeads.length} lead{selectedLeads.length > 1 ? 's' : ''} selected
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setSelectedLeads([])}>
                      Clear Selection
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleBulkExport}>
                      <Download className="w-4 h-4 mr-2" />
                      Export Selected
                    </Button>
                  </div>
                </div>
              )}
            </Card>

            {/* Leads Table */}
            <Card>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="w-12">
                        <Checkbox 
                          checked={selectedLeads.length === filteredLeads.length && filteredLeads.length > 0}
                          onCheckedChange={toggleSelectAll}
                        />
                      </TableHead>
                      <TableHead className="font-semibold">Lead ID</TableHead>
                      <TableHead className="font-semibold">Company</TableHead>
                      <TableHead className="font-semibold">Contact</TableHead>
                      <TableHead className="font-semibold">Source</TableHead>
                      <TableHead className="font-semibold">Confidence</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                      <TableHead className="font-semibold">Follow-up</TableHead>
                      <TableHead className="font-semibold">Owner</TableHead>
                      <TableHead className="font-semibold text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLeads.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={10} className="text-center py-12">
                          <div className="flex flex-col items-center gap-2 text-gray-500">
                            <AlertCircle className="w-12 h-12" />
                            <p className="font-medium">No leads found</p>
                            <p className="text-sm">Try adjusting your filters or add a new lead</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredLeads.map((lead) => (
                        <TableRow 
                          key={lead.id} 
                          className={`hover:bg-gray-50 ${lead.isOverdue ? 'bg-orange-50' : ''}`}
                        >
                          <TableCell>
                            <Checkbox 
                              checked={selectedLeads.includes(lead.id)}
                              onCheckedChange={() => toggleSelectLead(lead.id)}
                            />
                          </TableCell>
                          <TableCell className="font-medium text-blue-600">
                            <div className="flex items-center gap-2">
                              {lead.id}
                              {lead.isOverdue && (
                                <Bell className="w-3 h-3 text-orange-600 animate-pulse" />
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium text-gray-900">{lead.companyName}</p>
                              <p className="text-sm text-gray-500">{lead.sector}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <p className="font-medium text-gray-900">{lead.contactName}</p>
                              <div className="flex items-center gap-2">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-6 px-2 text-xs"
                                  onClick={() => handleQuickCall(lead.contactPhone)}
                                >
                                  <Phone className="w-3 h-3 mr-1" />
                                  Call
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-6 px-2 text-xs"
                                  onClick={() => handleQuickEmail(lead.contactEmail)}
                                >
                                  <Mail className="w-3 h-3 mr-1" />
                                  Email
                                </Button>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{lead.sourcePlatform}</Badge>
                          </TableCell>
                          <TableCell>{getConfidenceBadge(lead.confidence)}</TableCell>
                          <TableCell>{getStatusBadge(lead.status)}</TableCell>
                          <TableCell>
                            {lead.followUpDate ? (
                              <div className={`flex items-center gap-2 ${lead.isOverdue ? 'text-orange-700 font-medium' : ''}`}>
                                <Calendar className="w-4 h-4" />
                                <span className="text-sm">{lead.followUpDate}</span>
                              </div>
                            ) : (
                              <span className="text-sm text-gray-400">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4 text-gray-400" />
                              <span className="text-sm">{lead.assignedTo}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedLead(lead);
                                  setIsViewDialogOpen(true);
                                }}
                              >
                                View
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreVertical className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem 
                                    onClick={() => {
                                      setSelectedLead(lead);
                                      setIsEditDialogOpen(true);
                                    }}
                                  >
                                    <Edit className="w-4 h-4 mr-2" />
                                    Edit Lead
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setSelectedLead(lead);
                                      setIsActivityDialogOpen(true);
                                    }}
                                  >
                                    <Activity className="w-4 h-4 mr-2" />
                                    Log Activity
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  {lead.status !== 'converted' && (
                                    <DropdownMenuItem 
                                      onClick={() => {
                                        setSelectedLead(lead);
                                        setIsConvertDialogOpen(true);
                                      }}
                                      className="text-green-600"
                                    >
                                      <ArrowUpRight className="w-4 h-4 mr-2" />
                                      Convert to Company
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    onClick={() => handleDeleteLead(lead.id)}
                                    className="text-red-600"
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete Lead
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Status Distribution */}
              <Card className="p-6">
                <h3 className="font-semibold mb-4">Lead Status Distribution</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={statusData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="status" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>

              {/* Source Distribution */}
              <Card className="p-6">
                <h3 className="font-semibold mb-4">Leads by Source Platform</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={sourceData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {sourceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Card>

              {/* Conversion Funnel */}
              <Card className="p-6">
                <h3 className="font-semibold mb-4">Conversion Funnel</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">Total Leads</span>
                      <span className="text-sm font-bold">{stats.total}</span>
                    </div>
                    <Progress value={100} className="h-3" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">Contacted</span>
                      <span className="text-sm font-bold">
                        {leads.filter(l => ['contacted', 'follow-up', 'converted'].includes(l.status)).length}
                      </span>
                    </div>
                    <Progress 
                      value={(leads.filter(l => ['contacted', 'follow-up', 'converted'].includes(l.status)).length / stats.total) * 100} 
                      className="h-3" 
                    />
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">In Follow-up</span>
                      <span className="text-sm font-bold">
                        {leads.filter(l => ['follow-up', 'converted'].includes(l.status)).length}
                      </span>
                    </div>
                    <Progress 
                      value={(leads.filter(l => ['follow-up', 'converted'].includes(l.status)).length / stats.total) * 100} 
                      className="h-3" 
                    />
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium text-green-700">Converted</span>
                      <span className="text-sm font-bold text-green-700">{stats.converted}</span>
                    </div>
                    <Progress 
                      value={(stats.converted / stats.total) * 100} 
                      className="h-3 bg-green-200" 
                    />
                  </div>
                </div>
              </Card>

              {/* Performance Metrics */}
              <Card className="p-6">
                <h3 className="font-semibold mb-4">Performance Metrics</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                    <div>
                      <p className="text-sm text-blue-700">Avg Days to Contact</p>
                      <p className="text-2xl font-bold text-blue-900">2.4</p>
                    </div>
                    <Clock className="w-8 h-8 text-blue-600" />
                  </div>
                  <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                    <div>
                      <p className="text-sm text-green-700">Avg Days to Convert</p>
                      <p className="text-2xl font-bold text-green-900">12.8</p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-green-600" />
                  </div>
                  <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                    <div>
                      <p className="text-sm text-purple-700">Active Follow-ups</p>
                      <p className="text-2xl font-bold text-purple-900">
                        {leads.filter(l => l.status === 'follow-up').length}
                      </p>
                    </div>
                    <Activity className="w-8 h-8 text-purple-600" />
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Add Lead Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Lead</DialogTitle>
            <DialogDescription>
              Enter lead details to track potential hiring opportunities. All fields marked with * are mandatory.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleAddLead} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sourcePlatform">Source Platform *</Label>
                <Select name="sourcePlatform" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LinkedIn">LinkedIn</SelectItem>
                    <SelectItem value="Company Website">Company Website</SelectItem>
                    <SelectItem value="Job Portal Scraping">Job Portal Scraping</SelectItem>
                    <SelectItem value="Referral">Referral</SelectItem>
                    <SelectItem value="Event">Event</SelectItem>
                    <SelectItem value="Cold Outreach">Cold Outreach</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name *</Label>
                <Input 
                  id="companyName" 
                  name="companyName" 
                  placeholder="Enter company name" 
                  required 
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sector">Sector *</Label>
                <Select name="sector" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select sector" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="IT - SaaS">IT - SaaS</SelectItem>
                    <SelectItem value="IT - Enterprise">IT - Enterprise</SelectItem>
                    <SelectItem value="IT - Marketing Tech">IT - Marketing Tech</SelectItem>
                    <SelectItem value="Startup - Fintech">Startup - Fintech</SelectItem>
                    <SelectItem value="Startup - Edtech">Startup - Edtech</SelectItem>
                    <SelectItem value="Core - Manufacturing">Core - Manufacturing</SelectItem>
                    <SelectItem value="Core - Automotive">Core - Automotive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confidence">Confidence % *</Label>
                <Input 
                  id="confidence" 
                  name="confidence" 
                  type="number" 
                  min="0" 
                  max="100" 
                  placeholder="0-100" 
                  required 
                />
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="font-semibold mb-4">Contact Information</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contactName">Contact Name *</Label>
                  <Input 
                    id="contactName" 
                    name="contactName" 
                    placeholder="Full name" 
                    required 
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactPhone">Phone *</Label>
                  <Input 
                    id="contactPhone" 
                    name="contactPhone" 
                    placeholder="+91 XXXXX XXXXX" 
                    required 
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactEmail">Email *</Label>
                  <Input 
                    id="contactEmail" 
                    name="contactEmail" 
                    type="email" 
                    placeholder="email@company.com" 
                    required 
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactLinkedIn">LinkedIn Profile</Label>
                  <Input 
                    id="contactLinkedIn" 
                    name="contactLinkedIn" 
                    placeholder="linkedin.com/in/..." 
                  />
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="font-semibold mb-4">Tracking Details</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="followUpDate">Follow-up Date *</Label>
                  <Input 
                    id="followUpDate" 
                    name="followUpDate" 
                    type="date" 
                    required 
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="assignedTo">Assigned To *</Label>
                  <Select name="assignedTo" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select coordinator" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Rashmi">Rashmi</SelectItem>
                      <SelectItem value="Manjunath">Manjunath</SelectItem>
                      <SelectItem value="Scraping Team">Scraping Team</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2 mt-4">
                <Label htmlFor="notes">Notes</Label>
                <Textarea 
                  id="notes" 
                  name="notes" 
                  placeholder="Add any relevant notes about this lead..." 
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                Add Lead
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Lead Dialog */}
      {selectedLead && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Lead - {selectedLead.id}</DialogTitle>
              <DialogDescription>
                Update lead information
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleEditLead} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-sourcePlatform">Source Platform *</Label>
                  <Select name="sourcePlatform" defaultValue={selectedLead.sourcePlatform} required>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LinkedIn">LinkedIn</SelectItem>
                      <SelectItem value="Company Website">Company Website</SelectItem>
                      <SelectItem value="Job Portal Scraping">Job Portal Scraping</SelectItem>
                      <SelectItem value="Referral">Referral</SelectItem>
                      <SelectItem value="Event">Event</SelectItem>
                      <SelectItem value="Cold Outreach">Cold Outreach</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-companyName">Company Name *</Label>
                  <Input 
                    id="edit-companyName" 
                    name="companyName" 
                    defaultValue={selectedLead.companyName}
                    required 
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-sector">Sector *</Label>
                  <Select name="sector" defaultValue={selectedLead.sector} required>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="IT - SaaS">IT - SaaS</SelectItem>
                      <SelectItem value="IT - Enterprise">IT - Enterprise</SelectItem>
                      <SelectItem value="IT - Marketing Tech">IT - Marketing Tech</SelectItem>
                      <SelectItem value="Startup - Fintech">Startup - Fintech</SelectItem>
                      <SelectItem value="Startup - Edtech">Startup - Edtech</SelectItem>
                      <SelectItem value="Core - Manufacturing">Core - Manufacturing</SelectItem>
                      <SelectItem value="Core - Automotive">Core - Automotive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-confidence">Confidence % *</Label>
                  <Input 
                    id="edit-confidence" 
                    name="confidence" 
                    type="number" 
                    min="0" 
                    max="100" 
                    defaultValue={selectedLead.confidence}
                    required 
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-status">Status *</Label>
                  <Select name="status" defaultValue={selectedLead.status} required>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="contacted">Contacted</SelectItem>
                      <SelectItem value="follow-up">Follow-up</SelectItem>
                      <SelectItem value="converted">Converted</SelectItem>
                      <SelectItem value="lost">Lost</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-assignedTo">Assigned To *</Label>
                  <Select name="assignedTo" defaultValue={selectedLead.assignedTo} required>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Rashmi">Rashmi</SelectItem>
                      <SelectItem value="Manjunath">Manjunath</SelectItem>
                      <SelectItem value="Scraping Team">Scraping Team</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-semibold mb-4">Contact Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-contactName">Contact Name *</Label>
                    <Input 
                      id="edit-contactName" 
                      name="contactName" 
                      defaultValue={selectedLead.contactName}
                      required 
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-contactPhone">Phone *</Label>
                    <Input 
                      id="edit-contactPhone" 
                      name="contactPhone" 
                      defaultValue={selectedLead.contactPhone}
                      required 
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-contactEmail">Email *</Label>
                    <Input 
                      id="edit-contactEmail" 
                      name="contactEmail" 
                      type="email" 
                      defaultValue={selectedLead.contactEmail}
                      required 
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-contactLinkedIn">LinkedIn Profile</Label>
                    <Input 
                      id="edit-contactLinkedIn" 
                      name="contactLinkedIn" 
                      defaultValue={selectedLead.contactLinkedIn}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="edit-followUpDate">Follow-up Date</Label>
                <Input 
                  id="edit-followUpDate" 
                  name="followUpDate" 
                  type="date" 
                  defaultValue={selectedLead.followUpDate}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-notes">Notes</Label>
                <Textarea 
                  id="edit-notes" 
                  name="notes" 
                  defaultValue={selectedLead.notes}
                  rows={3}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  Save Changes
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* View Lead Details Dialog */}
      {selectedLead && (
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh]">
            <DialogHeader>
              <div className="flex items-start justify-between">
                <div>
                  <DialogTitle className="text-2xl">{selectedLead.companyName}</DialogTitle>
                  <DialogDescription className="mt-1">
                    Lead ID: {selectedLead.id} • Created {selectedLead.createdDate} by {selectedLead.createdBy}
                  </DialogDescription>
                </div>
                {getStatusBadge(selectedLead.status)}
              </div>
            </DialogHeader>
            
            <ScrollArea className="max-h-[calc(90vh-200px)]">
              <div className="space-y-6 pr-4">
                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-4">
                  <Card className="p-4">
                    <p className="text-sm text-gray-500">Confidence</p>
                    <p className="text-2xl font-bold mt-1">{selectedLead.confidence}%</p>
                  </Card>
                  <Card className="p-4">
                    <p className="text-sm text-gray-500">Days in Pipeline</p>
                    <p className="text-2xl font-bold mt-1">{selectedLead.daysSinceCreated}</p>
                  </Card>
                  <Card className="p-4">
                    <p className="text-sm text-gray-500">Activities</p>
                    <p className="text-2xl font-bold mt-1">{selectedLead.activities.length}</p>
                  </Card>
                </div>

                {/* Company & Contact Info */}
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      Company Details
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-gray-500">Sector:</span>
                        <p className="font-medium">{selectedLead.sector}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Source:</span>
                        <p className="font-medium">{selectedLead.sourcePlatform}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Assigned To:</span>
                        <p className="font-medium">{selectedLead.assignedTo}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Contact Information
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-gray-400" />
                        <span className="font-medium">{selectedLead.contactName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <a href={`tel:${selectedLead.contactPhone}`} className="hover:underline">
                          {selectedLead.contactPhone}
                        </a>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <a href={`mailto:${selectedLead.contactEmail}`} className="hover:underline">
                          {selectedLead.contactEmail}
                        </a>
                      </div>
                      {selectedLead.contactLinkedIn && (
                        <div className="flex items-center gap-2">
                          <ExternalLink className="w-4 h-4 text-gray-400" />
                          <a 
                            href={`https://${selectedLead.contactLinkedIn}`} 
                            className="text-blue-600 hover:underline text-sm"
                            target="_blank" 
                            rel="noopener noreferrer"
                          >
                            LinkedIn Profile
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Follow-up */}
                {selectedLead.followUpDate && (
                  <div className={`p-4 rounded-lg ${selectedLead.isOverdue ? 'bg-orange-50 border border-orange-200' : 'bg-blue-50 border border-blue-200'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Calendar className={`w-5 h-5 ${selectedLead.isOverdue ? 'text-orange-600' : 'text-blue-600'}`} />
                        <div>
                          <p className={`font-medium ${selectedLead.isOverdue ? 'text-orange-900' : 'text-blue-900'}`}>
                            {selectedLead.isOverdue ? 'Follow-up Overdue' : 'Next Follow-up'}
                          </p>
                          <p className={`text-sm ${selectedLead.isOverdue ? 'text-orange-700' : 'text-blue-700'}`}>
                            {selectedLead.followUpDate}
                          </p>
                        </div>
                      </div>
                      {selectedLead.isOverdue && (
                        <AlertTriangle className="w-5 h-5 text-orange-600" />
                      )}
                    </div>
                  </div>
                )}

                {/* Notes */}
                {selectedLead.notes && (
                  <div>
                    <h4 className="font-semibold mb-2">Notes</h4>
                    <p className="text-sm text-gray-700 bg-gray-50 p-4 rounded-lg whitespace-pre-line">
                      {selectedLead.notes}
                    </p>
                  </div>
                )}

                <Separator />

                {/* Activity Timeline */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Activity className="w-4 h-4" />
                      Activity Timeline ({selectedLead.activities.length})
                    </h4>
                    <Button 
                      size="sm"
                      onClick={() => {
                        setIsActivityDialogOpen(true);
                      }}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Log Activity
                    </Button>
                  </div>

                  {selectedLead.activities.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                      <FileText className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">No activities logged yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedLead.activities.map((activity) => (
                        <Card key={activity.id} className="p-4">
                          <div className="flex items-start gap-3">
                            <div className="p-2 bg-blue-50 rounded-lg">
                              {getActivityIcon(activity.type)}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-start justify-between">
                                <div>
                                  <p className="font-medium capitalize">{activity.type}</p>
                                  <p className="text-sm text-gray-600 mt-1">{activity.summary}</p>
                                </div>
                                <Badge variant="outline" className="text-xs">
                                  {activity.date} {activity.time}
                                </Badge>
                              </div>
                              <div className="mt-2 text-sm">
                                <span className="text-gray-500">Outcome:</span>
                                <span className="ml-2 text-gray-900">{activity.outcome}</span>
                              </div>
                              {activity.nextFollowUp && (
                                <div className="mt-2 flex items-center gap-2 text-sm text-blue-600">
                                  <Calendar className="w-3 h-3" />
                                  <span>Next follow-up: {activity.nextFollowUp}</span>
                                </div>
                              )}
                              <p className="text-xs text-gray-400 mt-2">By {activity.createdBy}</p>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </ScrollArea>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                Close
              </Button>
              <Button 
                variant="outline"
                onClick={() => {
                  setIsViewDialogOpen(false);
                  setIsEditDialogOpen(true);
                }}
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Lead
              </Button>
              {selectedLead.status !== 'converted' && (
                <Button 
                  onClick={() => {
                    setIsViewDialogOpen(false);
                    setIsConvertDialogOpen(true);
                  }}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <ArrowUpRight className="w-4 h-4 mr-2" />
                  Convert to Company
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Add Activity Dialog */}
      {selectedLead && (
        <Dialog open={isActivityDialogOpen} onOpenChange={setIsActivityDialogOpen}>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>Log Activity - {selectedLead.companyName}</DialogTitle>
              <DialogDescription>
                Record communication and set next follow-up
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleAddActivity} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="activityType">Activity Type *</Label>
                  <Select name="activityType" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="call">Call</SelectItem>
                      <SelectItem value="whatsapp">WhatsApp</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="meeting">Meeting</SelectItem>
                      <SelectItem value="note">Note</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="activityDate">Date *</Label>
                  <Input 
                    id="activityDate" 
                    name="activityDate" 
                    type="date" 
                    defaultValue={new Date().toISOString().split('T')[0]}
                    required 
                  />
                </div>

                <div className="space-y-2 col-span-2">
                  <Label htmlFor="activityTime">Time *</Label>
                  <Input 
                    id="activityTime" 
                    name="activityTime" 
                    type="time" 
                    defaultValue={new Date().toTimeString().slice(0, 5)}
                    required 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="summary">Summary *</Label>
                <Textarea 
                  id="summary" 
                  name="summary" 
                  placeholder="Brief description of the activity..."
                  rows={2}
                  required 
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="outcome">Outcome *</Label>
                <Textarea 
                  id="outcome" 
                  name="outcome" 
                  placeholder="What was the result? What are next steps?"
                  rows={2}
                  required 
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nextFollowUp">Next Follow-up Date</Label>
                <Input 
                  id="nextFollowUp" 
                  name="nextFollowUp" 
                  type="date" 
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsActivityDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  Log Activity
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Convert Lead Dialog */}
      {selectedLead && (
        <Dialog open={isConvertDialogOpen} onOpenChange={setIsConvertDialogOpen}>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>Convert Lead to Company Master</DialogTitle>
              <DialogDescription>
                This will create a new company record and mark this lead as converted
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleConvertLead} className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">Lead Information</h4>
                <div className="space-y-1 text-sm">
                  <p><span className="text-blue-700">Company:</span> <span className="font-medium">{selectedLead.companyName}</span></p>
                  <p><span className="text-blue-700">Sector:</span> <span className="font-medium">{selectedLead.sector}</span></p>
                  <p><span className="text-blue-700">Contact:</span> <span className="font-medium">{selectedLead.contactName}</span></p>
                  <p><span className="text-blue-700">Confidence:</span> <span className="font-medium">{selectedLead.confidence}%</span></p>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex gap-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-yellow-900">Important: Next Steps</p>
                    <ul className="list-disc list-inside text-yellow-700 mt-2 space-y-1">
                      <li>Company record will be created in Company Master (Module 3)</li>
                      <li>MOU process must be initiated</li>
                      <li>Cannot proceed to hiring without MOU status</li>
                      <li>This action requires admin approval</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="approvalNotes">Conversion Notes *</Label>
                <Textarea 
                  id="approvalNotes" 
                  name="approvalNotes" 
                  placeholder="Why is this lead ready for conversion? Add any relevant details..."
                  rows={3}
                  required 
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsConvertDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-green-600 hover:bg-green-700">
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Convert Lead
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
