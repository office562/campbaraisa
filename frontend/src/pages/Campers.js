import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { 
  Plus, 
  Search, 
  Filter, 
  GraduationCap,
  Trash2,
  Phone,
  Mail,
  MessageSquare,
  X
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const GRADES = ['11th', '12th', '1st yr Bais Medrash', '2nd yr Bais Medrash'];

const YESHIVAS = [
  'Bais Yosef - Rabbi Nekritz',
  'Mesivta Ahavas Hatorah - Lakewood - Rabbi Lazewnik',
  'Mesivta Ahavas Hatorah - Monsey - Rabbi Klugman',
  'Mesivta Beth Shraga - Monsey',
  'Mesivta Darchei Noam - Lakewood - Rabbi Kranz',
  'Mesivta Eitz Chaim - South Fallsburg',
  'Mesivta Ga\'on Yaakov - Lakewood - Rabbi Chaim Cohen',
  'Mesivta Keren Hatorah - Lakewood',
  'Mesivta Keren Orah - Lakewood - Rabbi Blum',
  'Mesivta Knesses Bais Levi - Lakewood - Rabbi Krupenia',
  'Mesivta Mishnas Hatalmud - Rabbi Schwebel',
  'Mesivta Nachlas Hatorah - Rabbi Grossman',
  'Mesivta Nachlas Yisroel - Lakewood - Rabbi Ungarischer',
  'Mesivta Naos Yakov - Rabbi S.F. Schustal',
  'Mesivta Ner Moshe - Lakewood - Rabbi Sukenik',
  'Mesivta Nezer Hatorah - Lakewood - Rabbi Brus',
  'Mesivta Of Baltimore - Rabbi Shlanger',
  'Mesivta Of Carteret - Rabbi Roth',
  'Mesivta Of Greater Boston',
  'Mesivta Of Lakewood - Rabbi Burstyn',
  'Mesivta Of Long Beach',
  'Mesivta Of North Jersey - Rabbi Eider',
  'Mesivta Ohr Chaim Meir - Lakewood - Rabbi Friedman',
  'Mesivta Ohr Naftali - New Windsor',
  'Mesivta Ohr Yisroel - Lakewood - Rabbi Greenfeld',
  'Mesivta Orchos Hatorah - Rabbi Beren',
  'Mesivta Pe\'er Yisroel - R\' Katz',
  'Mesivta Rabbi Tzvi Aryeh Zemel - Rabbi Rubin',
  'Mesivta Reishis Chochma of Montreal',
  'Mesivta Shalom Shachna - Brooklyn',
  'Mesivta Tiferes Lipa - Lakewood',
  'Mesivta Tiferes Shmuel - Lakewood - Rabbi Landau',
  'Mesivta Torah Temima - Lakewood',
  'Mesivta Toras Chaim - Lakewood - Rabbi Slomowitz',
  'Mesivta Toras Maier - Passaic',
  'Mesivta Zichron Baruch Of Clifton - Rabbi Halberstadt',
  'Nachlei Torah - Lakewood',
  'Ner Yisroel - Baltimore',
  'Ner Yisroel - Toronto',
  'Netzach Hatorah - R\' Fischer',
  'Noam Hatalmud - Rabbi Kanarek',
  'Ohr Hameir Seminary - Peekskill',
  'Ohr Shraga Veretsky - Brooklyn',
  'Rabbi Jacob Josef School - Edison',
  'Talmudical Yeshiva Of Philadelphia',
  'Telshe Yeshiva - Chicago',
  'Telshe Yeshiva - Cleveland',
  'Tiferes Boruch - Springfield',
  'Torah Temimah - Brooklyn',
  'Yeshiva & Mesivta Torah Temima - Brooklyn',
  'Yeshiva Ateret Torah - Brooklyn',
  'Yeshiva Bais Ahron - Lakewood - Rabbi Schulgasser',
  'Yeshiva Bais Binyomin - Stamford',
  'Yeshiva Bais Hachinuch - Lakewood - Rabbi Gray',
  'Yeshiva Beth Moshe - Scranton',
  'Yeshiva Birchas Chaim - Lakewood - Rabbi Stein',
  'Yeshiva Chayei Olam - Lakewood - Rabbi Bromberg',
  'Yeshiva Chemdas Hatorah - Lakewood - Rabbi Pruzansky',
  'Yeshiva Gedola Of Bayonne',
  'Yeshiva Gedola Of Dexter Park - Rabbi Rubin',
  'Yeshiva Gedola Of LA',
  'Yeshiva Gedola Of Monmouth - Rabbi Wasserman',
  'Yeshiva Gedola of Montreal',
  'Yeshiva Gedola Of Woodlake - Ohr Zecharia - Lakewood - Rabbi Uren Reich',
  'Yeshiva Gedola Zichron Moshe - South Fallsburg',
  'Yeshiva Mekor Hachaim - Lakewood - Rabbi Sherwinter',
  'Yeshiva Meon Hatorah Of Roosevelt',
  'Yeshiva Nefesh Hachaim - Lakewood - Rabbi Hirth',
  'Yeshiva Of Telshe Alumni - Riverdale',
  'Yeshiva Ohr Olam - Lakewood - Rabbi Berkowitz',
  'Yeshiva Ohr Simcha',
  'Yeshiva Ohr Yissochor - Lakewood - Rabbi Hackerman',
  'Yeshiva Shaarei Chaim - Far Rockaway',
  'Yeshiva Shaar Hatalmud - Lakewood - Rabbi Mintz',
  'Yeshiva Sharei Orah - Lakewood - Rabbi Daniel Cohen',
  'Yeshiva Toras Yisroel - Lakewood - Rabbi Stern & Rabbi Klein',
  'Yeshiva V\'Yolepol - Brooklyn',
  'Yeshiva Yisodei Hatorah - Lakewood - Rabbi Treff',
  'Yeshiva Zecher Aryeh - Rabbi Smith',
  'Yeshiva Zichron Shmaryahu - Toronto - Rabbi Brotsky',
  'Yeshivas Chaim Berlin - Brooklyn',
  'Yeshivas Emek Hatorah - Lakewood - Rabbi Weinberger',
  'Yeshivas Lekach Torah - Lakewood - Rabbi Eichorn',
  'Yeshivas Meor Hatalmud - Lakewood - Rabbi Witty',
  'Yeshivas Mir - Brooklyn',
  'Yeshivas Nachlas Tzvi - Toronto - Rabbi Kaplan',
  'Yeshivas Novominsk - Kol Yehuda - Brooklyn',
  'Yeshivas Shaar Hatorah - Queens',
  'Yeshivas Tiferes Tzvi - Lakewood - Rabbi Pepper',
  'Yeshivas Toras Moshe - Lakewood - Rabbi Berkowitz & Rabbi Pinter',
  'Yeshivas Yearos Devash - Lakewood - Rabbi Brody',
  'Yeshivat Ohel Torah',
  'Yeshivat Sheerit Ezra - Lakewood',
  'Yesodei Hatorah - Toronto',
  'Other'
];

const statusColors = {
  'Applied': 'bg-blue-100 text-blue-800',
  'Accepted': 'bg-green-100 text-green-800',
  'Check/Unknown': 'bg-yellow-100 text-yellow-800',
  'Invoice Sent': 'bg-purple-100 text-purple-800',
  'Payment Plan - Request': 'bg-orange-100 text-orange-800',
  'Payment Plan Running': 'bg-teal-100 text-teal-800',
  'Sending Check': 'bg-indigo-100 text-indigo-800',
  'Partial Paid': 'bg-amber-100 text-amber-800',
  'Partial Paid & Committed': 'bg-lime-100 text-lime-800',
  'Paid in Full': 'bg-emerald-100 text-emerald-800',
};

function Campers() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [campers, setCampers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [gradeFilter, setGradeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Photo zoom state
  const [zoomedPhoto, setZoomedPhoto] = useState(null);
  
  // Dialog states
  const [showAddCamper, setShowAddCamper] = useState(false);
  const [newCamper, setNewCamper] = useState({
    // Camper info
    first_name: '', last_name: '', address: '', city: '', state: '', zip_code: '',
    date_of_birth: '', yeshiva: '', yeshiva_other: '', grade: '', menahel: '',
    rebbe_name: '', rebbe_phone: '', previous_yeshiva: '', camp_2024: '', camp_2023: '',
    allergies: '', medical_info: '', emergency_contact_name: '', emergency_contact_phone: '',
    emergency_contact_relationship: '',
    // Parent info (embedded)
    parent_email: '', father_first_name: '', father_last_name: '', father_cell: '',
    mother_first_name: '', mother_last_name: '', mother_cell: ''
  });

  async function fetchData() {
    try {
      const campersRes = await axios.get(API_URL + '/api/campers', { 
        headers: { Authorization: 'Bearer ' + token }
      });
      setCampers(campersRes.data);
    } catch (error) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }

  useEffect(function() {
    fetchData();
  }, [token]);

  async function handleAddCamper(e) {
    e.preventDefault();
    try {
      const response = await axios.post(API_URL + '/api/campers', newCamper, {
        headers: { Authorization: 'Bearer ' + token }
      });
      setCampers([...campers, response.data]);
      setShowAddCamper(false);
      setNewCamper({
        first_name: '', last_name: '', address: '', city: '', state: '', zip_code: '',
        date_of_birth: '', yeshiva: '', yeshiva_other: '', grade: '', menahel: '',
        rebbe_name: '', rebbe_phone: '', previous_yeshiva: '', camp_2024: '', camp_2023: '',
        allergies: '', medical_info: '', emergency_contact_name: '', emergency_contact_phone: '',
        emergency_contact_relationship: '',
        parent_email: '', father_first_name: '', father_last_name: '', father_cell: '',
        mother_first_name: '', mother_last_name: '', mother_cell: ''
      });
      toast.success('Camper added successfully');
    } catch (error) {
      toast.error('Failed to add camper');
    }
  }

  async function handleDeleteCamper(camperId, camperName) {
    if (!window.confirm(`Move ${camperName} to trash?`)) return;
    try {
      await axios.delete(API_URL + '/api/campers/' + camperId, {
        headers: { Authorization: 'Bearer ' + token }
      });
      setCampers(campers.filter(c => c.id !== camperId));
      toast.success('Camper moved to trash');
    } catch (error) {
      toast.error('Failed to delete camper');
    }
  }

  function getParentName(camper) {
    // Parent info is now embedded in camper
    const firstName = camper.father_first_name || '';
    const lastName = camper.father_last_name || '';
    if (firstName || lastName) {
      return (firstName + ' ' + lastName).trim();
    }
    // Fallback to mother's name
    const motherFirst = camper.mother_first_name || '';
    const motherLast = camper.mother_last_name || '';
    if (motherFirst || motherLast) {
      return (motherFirst + ' ' + motherLast).trim();
    }
    return 'No parent info';
  }

  // Contact action handlers
  function handleCall(e, phone) {
    e.stopPropagation();
    if (phone) {
      window.location.href = 'tel:' + phone;
    } else {
      toast.error('No phone number available');
    }
  }

  function handleText(e, phone) {
    e.stopPropagation();
    if (phone) {
      window.location.href = 'sms:' + phone;
    } else {
      toast.error('No phone number available');
    }
  }

  function handleEmail(e, email) {
    e.stopPropagation();
    if (email) {
      window.location.href = 'mailto:' + email;
    } else {
      toast.error('No email available');
    }
  }

  function handlePhotoClick(e, photoUrl, camperName) {
    e.stopPropagation();
    if (photoUrl) {
      setZoomedPhoto({ url: photoUrl, name: camperName });
    }
  }

  const filteredCampers = campers.filter(function(camper) {
    const matchesSearch = 
      camper.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      camper.last_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesGrade = gradeFilter === 'all' || camper.grade === gradeFilter;
    const matchesStatus = statusFilter === 'all' || camper.status === statusFilter;
    
    return matchesSearch && matchesGrade && matchesStatus;
  });

  const grades = [];
  const yeshivasUsed = [];
  for (let i = 0; i < campers.length; i++) {
    if (campers[i].grade && grades.indexOf(campers[i].grade) === -1) {
      grades.push(campers[i].grade);
    }
    if (campers[i].yeshiva && yeshivasUsed.indexOf(campers[i].yeshiva) === -1) {
      yeshivasUsed.push(campers[i].yeshiva);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E85D04]"></div>
      </div>
    );
  }

  return (
    <div data-testid="campers-page">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-heading text-4xl font-bold text-[#2D241E] tracking-tight">
            Campers
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage camper registrations and details
          </p>
        </div>
        <div className="flex gap-3">
          <Dialog open={showAddCamper} onOpenChange={setShowAddCamper}>
            <DialogTrigger asChild>
              <Button className="btn-camp-primary" data-testid="add-camper-btn">
                <Plus className="w-4 h-4 mr-2" />
                Add Camper
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="font-heading text-2xl">Add New Camper</DialogTitle>
                <DialogDescription>Enter camper and parent information</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddCamper} className="space-y-6">
                {/* Parent/Guardian Info */}
                <div className="border-b pb-4">
                  <p className="font-medium mb-3 text-[#E85D04]">Parent/Guardian Information</p>
                  <div>
                    <Label>Parent Email *</Label>
                    <Input
                      type="email"
                      value={newCamper.parent_email}
                      onChange={function(e) { setNewCamper({...newCamper, parent_email: e.target.value}); }}
                      required
                      data-testid="camper-parent-email"
                    />
                  </div>
                  <div className="mt-4">
                    <p className="text-sm text-muted-foreground mb-2">Father&apos;s Information</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>First Name *</Label>
                        <Input
                          value={newCamper.father_first_name}
                          onChange={function(e) { setNewCamper({...newCamper, father_first_name: e.target.value}); }}
                          required
                          data-testid="camper-father-first"
                        />
                      </div>
                      <div>
                        <Label>Last Name *</Label>
                        <Input
                          value={newCamper.father_last_name}
                          onChange={function(e) { setNewCamper({...newCamper, father_last_name: e.target.value}); }}
                          required
                          data-testid="camper-father-last"
                        />
                      </div>
                    </div>
                    <div className="mt-2">
                      <Label>Father&apos;s Cell *</Label>
                      <Input
                        value={newCamper.father_cell}
                        onChange={function(e) { setNewCamper({...newCamper, father_cell: e.target.value}); }}
                        required
                        data-testid="camper-father-cell"
                      />
                    </div>
                  </div>
                  <div className="mt-4">
                    <p className="text-sm text-muted-foreground mb-2">Mother&apos;s Information (Optional)</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>First Name</Label>
                        <Input
                          value={newCamper.mother_first_name}
                          onChange={function(e) { setNewCamper({...newCamper, mother_first_name: e.target.value}); }}
                        />
                      </div>
                      <div>
                        <Label>Last Name</Label>
                        <Input
                          value={newCamper.mother_last_name}
                          onChange={function(e) { setNewCamper({...newCamper, mother_last_name: e.target.value}); }}
                        />
                      </div>
                    </div>
                    <div className="mt-2">
                      <Label>Mother&apos;s Cell</Label>
                      <Input
                        value={newCamper.mother_cell}
                        onChange={function(e) { setNewCamper({...newCamper, mother_cell: e.target.value}); }}
                      />
                    </div>
                  </div>
                </div>

                {/* Basic Info */}
                <div className="border-t pt-4">
                  <p className="font-medium mb-3 text-[#E85D04]">Camper Information</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>First Name *</Label>
                      <Input
                        value={newCamper.first_name}
                        onChange={function(e) { setNewCamper({...newCamper, first_name: e.target.value}); }}
                        required
                        data-testid="camper-first-name"
                      />
                    </div>
                    <div>
                      <Label>Last Name *</Label>
                      <Input
                        value={newCamper.last_name}
                        onChange={function(e) { setNewCamper({...newCamper, last_name: e.target.value}); }}
                        required
                        data-testid="camper-last-name"
                      />
                    </div>
                  </div>
                  <div className="mt-3">
                    <Label>Address</Label>
                    <Input
                      value={newCamper.address}
                      onChange={function(e) { setNewCamper({...newCamper, address: e.target.value}); }}
                      placeholder="Street Address"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4 mt-3">
                    <div>
                      <Label>City</Label>
                      <Input
                        value={newCamper.city}
                        onChange={function(e) { setNewCamper({...newCamper, city: e.target.value}); }}
                      />
                    </div>
                    <div>
                      <Label>State</Label>
                      <Input
                        value={newCamper.state}
                        onChange={function(e) { setNewCamper({...newCamper, state: e.target.value}); }}
                      />
                    </div>
                    <div>
                      <Label>Zip Code</Label>
                      <Input
                        value={newCamper.zip_code}
                        onChange={function(e) { setNewCamper({...newCamper, zip_code: e.target.value}); }}
                      />
                    </div>
                  </div>
                  <div className="mt-3">
                    <Label>Birthdate</Label>
                    <Input
                      type="date"
                      value={newCamper.date_of_birth}
                      onChange={function(e) { setNewCamper({...newCamper, date_of_birth: e.target.value}); }}
                    />
                  </div>
                </div>

                {/* Yeshiva Info */}
                <div className="border-t pt-4">
                  <p className="font-medium mb-3">Yeshiva Information</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Yeshiva *</Label>
                      <Select
                        value={newCamper.yeshiva}
                        onValueChange={function(value) { setNewCamper({...newCamper, yeshiva: value}); }}
                      >
                        <SelectTrigger data-testid="camper-yeshiva-select">
                          <SelectValue placeholder="Select yeshiva" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px]">
                          {YESHIVAS.map(function(yeshiva) {
                            return <SelectItem key={yeshiva} value={yeshiva}>{yeshiva}</SelectItem>;
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Current Grade *</Label>
                      <Select
                        value={newCamper.grade}
                        onValueChange={function(value) { setNewCamper({...newCamper, grade: value}); }}
                      >
                        <SelectTrigger data-testid="camper-grade-select">
                          <SelectValue placeholder="Select grade" />
                        </SelectTrigger>
                        <SelectContent>
                          {GRADES.map(function(grade) {
                            return <SelectItem key={grade} value={grade}>{grade}</SelectItem>;
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {newCamper.yeshiva === 'Other' && (
                    <div className="mt-3">
                      <Label>Name of Yeshiva (if Other)</Label>
                      <Input
                        value={newCamper.yeshiva_other}
                        onChange={function(e) { setNewCamper({...newCamper, yeshiva_other: e.target.value}); }}
                        placeholder="Enter yeshiva name"
                      />
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4 mt-3">
                    <div>
                      <Label>Menahel</Label>
                      <Input
                        value={newCamper.menahel}
                        onChange={function(e) { setNewCamper({...newCamper, menahel: e.target.value}); }}
                      />
                    </div>
                    <div>
                      <Label>Rebbe Name</Label>
                      <Input
                        value={newCamper.rebbe_name}
                        onChange={function(e) { setNewCamper({...newCamper, rebbe_name: e.target.value}); }}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-3">
                    <div>
                      <Label>Rebbe&apos;s Phone</Label>
                      <Input
                        value={newCamper.rebbe_phone}
                        onChange={function(e) { setNewCamper({...newCamper, rebbe_phone: e.target.value}); }}
                      />
                    </div>
                    <div>
                      <Label>Previous Yeshiva</Label>
                      <Input
                        value={newCamper.previous_yeshiva}
                        onChange={function(e) { setNewCamper({...newCamper, previous_yeshiva: e.target.value}); }}
                      />
                    </div>
                  </div>
                </div>

                {/* Camp History */}
                <div className="border-t pt-4">
                  <p className="font-medium mb-3">Camp History</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Camp Attended Summer 2024</Label>
                      <Input
                        value={newCamper.camp_2024}
                        onChange={function(e) { setNewCamper({...newCamper, camp_2024: e.target.value}); }}
                      />
                    </div>
                    <div>
                      <Label>Camp Attended Summer 2023</Label>
                      <Input
                        value={newCamper.camp_2023}
                        onChange={function(e) { setNewCamper({...newCamper, camp_2023: e.target.value}); }}
                      />
                    </div>
                  </div>
                </div>

                {/* Emergency Contact */}
                <div className="border-t pt-4">
                  <p className="font-medium mb-3">Emergency Contact</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Name</Label>
                      <Input
                        value={newCamper.emergency_contact_name}
                        onChange={function(e) { setNewCamper({...newCamper, emergency_contact_name: e.target.value}); }}
                      />
                    </div>
                    <div>
                      <Label>Phone</Label>
                      <Input
                        value={newCamper.emergency_contact_phone}
                        onChange={function(e) { setNewCamper({...newCamper, emergency_contact_phone: e.target.value}); }}
                      />
                    </div>
                  </div>
                  <div className="mt-3">
                    <Label>Relationship to Camper</Label>
                    <Input
                      value={newCamper.emergency_contact_relationship}
                      onChange={function(e) { setNewCamper({...newCamper, emergency_contact_relationship: e.target.value}); }}
                    />
                  </div>
                </div>

                {/* Medical Info */}
                <div className="border-t pt-4">
                  <p className="font-medium mb-3">Medical Information</p>
                  <div>
                    <Label>Allergy/Medical Information</Label>
                    <Textarea
                      value={newCamper.medical_info}
                      onChange={function(e) { setNewCamper({...newCamper, medical_info: e.target.value}); }}
                      placeholder="List any allergies or medical conditions..."
                      rows={3}
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button type="submit" className="btn-camp-primary" data-testid="save-camper-btn">
                    Save Camper
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <Card className="card-camp mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name..."
                value={searchTerm}
                onChange={function(e) { setSearchTerm(e.target.value); }}
                className="pl-10"
                data-testid="camper-search"
              />
            </div>
            <Select value={gradeFilter} onValueChange={setGradeFilter}>
              <SelectTrigger className="w-[180px]" data-testid="grade-filter">
                <GraduationCap className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Grade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Grades</SelectItem>
                {GRADES.map(function(grade) {
                  return <SelectItem key={grade} value={grade}>{grade}</SelectItem>;
                })}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]" data-testid="status-filter">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {Object.keys(statusColors).map(function(status) {
                  return <SelectItem key={status} value={status}>{status}</SelectItem>;
                })}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="card-camp">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead>Yeshiva</TableHead>
                <TableHead>Parent</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCampers.length > 0 ? (
                filteredCampers.map(function(camper) {
                  return (
                    <TableRow 
                      key={camper.id} 
                      className="cursor-pointer hover:bg-[#E85D04]/5 transition-colors"
                      onClick={function() { navigate('/campers/' + camper.id); }}
                      data-testid={'camper-row-' + camper.id}
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          {camper.photo_url ? (
                            <img src={camper.photo_url} alt="" className="w-8 h-8 rounded-lg object-cover" />
                          ) : (
                            <div className="w-8 h-8 rounded-lg bg-[#E85D04]/10 flex items-center justify-center">
                              <span className="text-[#E85D04] font-bold text-sm">
                                {camper.first_name.charAt(0)}
                              </span>
                            </div>
                          )}
                          <span className="hover:text-[#E85D04] transition-colors">
                            {camper.first_name} {camper.last_name}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{camper.grade || '-'}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{camper.yeshiva || '-'}</TableCell>
                      <TableCell>{getParentName(camper)}</TableCell>
                      <TableCell>
                        <Badge className={statusColors[camper.status] || 'bg-gray-100 text-gray-800'}>
                          {camper.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={function(e) { 
                            e.stopPropagation(); 
                            handleDeleteCamper(camper.id, camper.first_name + ' ' + camper.last_name); 
                          }}
                          data-testid={`delete-camper-${camper.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No campers found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg p-4 border">
          <p className="text-2xl font-bold text-[#E85D04]">{campers.length}</p>
          <p className="text-sm text-muted-foreground">Total Campers</p>
        </div>
        <div className="bg-white rounded-lg p-4 border">
          <p className="text-2xl font-bold text-[#2A9D8F]">{grades.length}</p>
          <p className="text-sm text-muted-foreground">Grades Represented</p>
        </div>
        <div className="bg-white rounded-lg p-4 border">
          <p className="text-2xl font-bold text-[#F4A261]">{yeshivasUsed.length}</p>
          <p className="text-sm text-muted-foreground">Yeshivas</p>
        </div>
      </div>
    </div>
  );
}

export default Campers;
