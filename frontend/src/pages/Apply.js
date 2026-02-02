import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  GraduationCap, 
  AlertTriangle,
  CheckCircle,
  Tent,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const GRADES = ['11th', '12th', '1st yr Bais Medrash', '2nd yr Bais Medrash'];

const YESHIVAS = [
  'Bais Yosef - Rabbi Nekritz',
  'Bais Yosef - Rabbi Sorotzkin', 
  'Beth Medrash Govoha (BMG)',
  'Brisk',
  'Chaim Berlin',
  'Chofetz Chaim - RSA',
  'Darchei Torah',
  'Fallsburg',
  'Kaminetz',
  'Lakewood Mesivta',
  'Long Beach',
  'Mir',
  'Ner Yisroel',
  'Novominsk',
  'Ohr Yisroel',
  'Passaic',
  'Philadelphia',
  'Ponovezh',
  'Scranton',
  'South Fallsburg',
  'South Shore',
  'Telshe',
  'Torah Temimah',
  'Torah Vodaath',
  'Other'
];

function Apply() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  const [form, setForm] = useState({
    // Camper Info
    first_name: '',
    last_name: '',
    date_of_birth: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    
    // Parent Info
    parent_email: '',
    father_first_name: '',
    father_last_name: '',
    father_cell: '',
    mother_first_name: '',
    mother_last_name: '',
    mother_cell: '',
    
    // Yeshiva Info
    yeshiva: '',
    yeshiva_other: '',
    grade: '',
    menahel: '',
    rebbe_name: '',
    rebbe_phone: '',
    previous_yeshiva: '',
    
    // Camp History
    camp_2024: '',
    camp_2023: '',
    
    // Emergency Contact
    emergency_contact_name: '',
    emergency_contact_phone: '',
    emergency_contact_relationship: '',
    
    // Medical
    medical_info: '',
    allergies: ''
  });

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      await axios.post(API_URL + '/api/applications', form);
      setSubmitted(true);
      toast.success('Application submitted successfully!');
    } catch (error) {
      toast.error('Failed to submit application. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  function handleChange(field, value) {
    setForm({ ...form, [field]: value });
  }

  function nextStep() {
    setStep(step + 1);
    window.scrollTo(0, 0);
  }

  function prevStep() {
    setStep(step - 1);
    window.scrollTo(0, 0);
  }

  if (submitted) {
    return (
      <div 
        className="min-h-screen flex flex-col items-center justify-center p-4"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1605999211498-1a6cf07fc10d?crop=entropy&cs=srgb&fm=jpg&q=85)',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/30" />
        
        <Card className="relative z-10 max-w-lg w-full bg-white/95 backdrop-blur-sm">
          <CardContent className="pt-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="font-heading text-2xl font-bold text-[#2D241E] mb-2">
              Application Received!
            </h2>
            <p className="text-muted-foreground mb-6">
              Thank you for applying to Camp Baraisa. We will review your application and be in touch soon.
            </p>
            <p className="text-sm text-muted-foreground">
              Questions? Contact us at<br />
              <a href="tel:732-987-7156" className="text-[#E85D04] hover:underline">732-987-7156</a> or{' '}
              <a href="mailto:campbaraisa@gmail.com" className="text-[#E85D04] hover:underline">campbaraisa@gmail.com</a>
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen py-8 px-4"
      style={{
        backgroundImage: 'url(https://images.unsplash.com/photo-1605999211498-1a6cf07fc10d?crop=entropy&cs=srgb&fm=jpg&q=85)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      <div className="fixed inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/30 pointer-events-none" />
      
      <div className="relative z-10 max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <img 
            src="https://customer-assets.emergentagent.com/job_29a6f845-ffbd-497f-b701-7df33de74a66/artifacts/e2cf1yq8_IMG_4388.PNG" 
            alt="Camp Baraisa" 
            className="w-24 h-24 mx-auto object-contain mb-4"
          />
          <h1 className="font-heading text-4xl font-black text-white tracking-tight">
            Camp Baraisa
          </h1>
          <p className="text-white/80 text-lg mt-2">Summer 2026 Application</p>
        </div>

        {/* Progress */}
        <div className="flex justify-center gap-2 mb-6">
          {[1, 2, 3, 4].map(function(s) {
            return (
              <div 
                key={s}
                className={`w-12 h-1.5 rounded-full transition-colors ${s <= step ? 'bg-[#E85D04]' : 'bg-white/30'}`}
              />
            );
          })}
        </div>

        <Card className="bg-white/95 backdrop-blur-sm shadow-2xl border-0">
          <form onSubmit={handleSubmit}>
            {/* Step 1: Camper & Parent Info */}
            {step === 1 && (
              <>
                <CardHeader>
                  <CardTitle className="font-heading text-2xl flex items-center gap-2">
                    <User className="w-6 h-6 text-[#E85D04]" />
                    Camper & Parent Information
                  </CardTitle>
                  <CardDescription>Step 1 of 4</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Camper Info */}
                  <div>
                    <h3 className="font-medium text-[#E85D04] mb-3">Camper Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>First Name *</Label>
                        <Input
                          required
                          value={form.first_name}
                          onChange={function(e) { handleChange('first_name', e.target.value); }}
                          data-testid="camper-first-name"
                        />
                      </div>
                      <div>
                        <Label>Last Name *</Label>
                        <Input
                          required
                          value={form.last_name}
                          onChange={function(e) { handleChange('last_name', e.target.value); }}
                          data-testid="camper-last-name"
                        />
                      </div>
                    </div>
                    <div className="mt-3">
                      <Label>Date of Birth</Label>
                      <Input
                        type="date"
                        value={form.date_of_birth}
                        onChange={function(e) { handleChange('date_of_birth', e.target.value); }}
                      />
                    </div>
                  </div>

                  {/* Parent Info */}
                  <div className="border-t pt-4">
                    <h3 className="font-medium text-[#E85D04] mb-3">Parent/Guardian Information</h3>
                    <div>
                      <Label>Parent Email *</Label>
                      <Input
                        type="email"
                        required
                        value={form.parent_email}
                        onChange={function(e) { handleChange('parent_email', e.target.value); }}
                        data-testid="parent-email"
                      />
                    </div>
                    
                    <div className="mt-4">
                      <p className="text-sm text-muted-foreground mb-2">Father&apos;s Information</p>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>First Name *</Label>
                          <Input
                            required
                            value={form.father_first_name}
                            onChange={function(e) { handleChange('father_first_name', e.target.value); }}
                          />
                        </div>
                        <div>
                          <Label>Last Name *</Label>
                          <Input
                            required
                            value={form.father_last_name}
                            onChange={function(e) { handleChange('father_last_name', e.target.value); }}
                          />
                        </div>
                      </div>
                      <div className="mt-2">
                        <Label>Cell Phone *</Label>
                        <Input
                          required
                          value={form.father_cell}
                          onChange={function(e) { handleChange('father_cell', e.target.value); }}
                        />
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <p className="text-sm text-muted-foreground mb-2">Mother&apos;s Information (Optional)</p>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>First Name</Label>
                          <Input
                            value={form.mother_first_name}
                            onChange={function(e) { handleChange('mother_first_name', e.target.value); }}
                          />
                        </div>
                        <div>
                          <Label>Last Name</Label>
                          <Input
                            value={form.mother_last_name}
                            onChange={function(e) { handleChange('mother_last_name', e.target.value); }}
                          />
                        </div>
                      </div>
                      <div className="mt-2">
                        <Label>Cell Phone</Label>
                        <Input
                          value={form.mother_cell}
                          onChange={function(e) { handleChange('mother_cell', e.target.value); }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <Button type="button" onClick={nextStep} className="btn-camp-primary">
                      Next <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </>
            )}

            {/* Step 2: Address & Yeshiva */}
            {step === 2 && (
              <>
                <CardHeader>
                  <CardTitle className="font-heading text-2xl flex items-center gap-2">
                    <GraduationCap className="w-6 h-6 text-[#E85D04]" />
                    Address & Yeshiva
                  </CardTitle>
                  <CardDescription>Step 2 of 4</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Address */}
                  <div>
                    <h3 className="font-medium text-[#E85D04] mb-3">Home Address</h3>
                    <div>
                      <Label>Street Address</Label>
                      <Input
                        value={form.address}
                        onChange={function(e) { handleChange('address', e.target.value); }}
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-4 mt-3">
                      <div>
                        <Label>City</Label>
                        <Input
                          value={form.city}
                          onChange={function(e) { handleChange('city', e.target.value); }}
                        />
                      </div>
                      <div>
                        <Label>State</Label>
                        <Input
                          value={form.state}
                          onChange={function(e) { handleChange('state', e.target.value); }}
                        />
                      </div>
                      <div>
                        <Label>Zip Code</Label>
                        <Input
                          value={form.zip_code}
                          onChange={function(e) { handleChange('zip_code', e.target.value); }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Yeshiva Info */}
                  <div className="border-t pt-4">
                    <h3 className="font-medium text-[#E85D04] mb-3">Yeshiva Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Current Yeshiva *</Label>
                        <Select 
                          value={form.yeshiva}
                          onValueChange={function(value) { handleChange('yeshiva', value); }}
                        >
                          <SelectTrigger data-testid="yeshiva-select">
                            <SelectValue placeholder="Select yeshiva" />
                          </SelectTrigger>
                          <SelectContent>
                            {YESHIVAS.map(function(y) {
                              return <SelectItem key={y} value={y}>{y}</SelectItem>;
                            })}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Grade *</Label>
                        <Select 
                          value={form.grade}
                          onValueChange={function(value) { handleChange('grade', value); }}
                        >
                          <SelectTrigger data-testid="grade-select">
                            <SelectValue placeholder="Select grade" />
                          </SelectTrigger>
                          <SelectContent>
                            {GRADES.map(function(g) {
                              return <SelectItem key={g} value={g}>{g}</SelectItem>;
                            })}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    {form.yeshiva === 'Other' && (
                      <div className="mt-3">
                        <Label>Specify Yeshiva</Label>
                        <Input
                          value={form.yeshiva_other}
                          onChange={function(e) { handleChange('yeshiva_other', e.target.value); }}
                          placeholder="Enter yeshiva name"
                        />
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-4 mt-3">
                      <div>
                        <Label>Menahel</Label>
                        <Input
                          value={form.menahel}
                          onChange={function(e) { handleChange('menahel', e.target.value); }}
                        />
                      </div>
                      <div>
                        <Label>Rebbe Name</Label>
                        <Input
                          value={form.rebbe_name}
                          onChange={function(e) { handleChange('rebbe_name', e.target.value); }}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-3">
                      <div>
                        <Label>Rebbe&apos;s Phone</Label>
                        <Input
                          value={form.rebbe_phone}
                          onChange={function(e) { handleChange('rebbe_phone', e.target.value); }}
                        />
                      </div>
                      <div>
                        <Label>Previous Yeshiva</Label>
                        <Input
                          value={form.previous_yeshiva}
                          onChange={function(e) { handleChange('previous_yeshiva', e.target.value); }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between pt-4">
                    <Button type="button" variant="outline" onClick={prevStep}>
                      <ArrowLeft className="w-4 h-4 mr-2" /> Back
                    </Button>
                    <Button type="button" onClick={nextStep} className="btn-camp-primary">
                      Next <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </>
            )}

            {/* Step 3: Camp History & Emergency */}
            {step === 3 && (
              <>
                <CardHeader>
                  <CardTitle className="font-heading text-2xl flex items-center gap-2">
                    <Tent className="w-6 h-6 text-[#E85D04]" />
                    Camp History & Emergency Contact
                  </CardTitle>
                  <CardDescription>Step 3 of 4</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Camp History */}
                  <div>
                    <h3 className="font-medium text-[#E85D04] mb-3">Previous Camp Experience</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Camp Summer 2024</Label>
                        <Input
                          value={form.camp_2024}
                          onChange={function(e) { handleChange('camp_2024', e.target.value); }}
                          placeholder="Where did you go?"
                        />
                      </div>
                      <div>
                        <Label>Camp Summer 2023</Label>
                        <Input
                          value={form.camp_2023}
                          onChange={function(e) { handleChange('camp_2023', e.target.value); }}
                          placeholder="Where did you go?"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Emergency Contact */}
                  <div className="border-t pt-4">
                    <h3 className="font-medium text-[#E85D04] mb-3">Emergency Contact</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Please provide an emergency contact other than parents
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Contact Name *</Label>
                        <Input
                          required
                          value={form.emergency_contact_name}
                          onChange={function(e) { handleChange('emergency_contact_name', e.target.value); }}
                        />
                      </div>
                      <div>
                        <Label>Phone Number *</Label>
                        <Input
                          required
                          value={form.emergency_contact_phone}
                          onChange={function(e) { handleChange('emergency_contact_phone', e.target.value); }}
                        />
                      </div>
                    </div>
                    <div className="mt-3">
                      <Label>Relationship to Camper *</Label>
                      <Input
                        required
                        value={form.emergency_contact_relationship}
                        onChange={function(e) { handleChange('emergency_contact_relationship', e.target.value); }}
                        placeholder="e.g., Grandparent, Uncle, Family Friend"
                      />
                    </div>
                  </div>

                  <div className="flex justify-between pt-4">
                    <Button type="button" variant="outline" onClick={prevStep}>
                      <ArrowLeft className="w-4 h-4 mr-2" /> Back
                    </Button>
                    <Button type="button" onClick={nextStep} className="btn-camp-primary">
                      Next <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </>
            )}

            {/* Step 4: Medical Info & Submit */}
            {step === 4 && (
              <>
                <CardHeader>
                  <CardTitle className="font-heading text-2xl flex items-center gap-2">
                    <AlertTriangle className="w-6 h-6 text-[#E85D04]" />
                    Medical Information
                  </CardTitle>
                  <CardDescription>Step 4 of 4 - Final Step</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label>Allergies</Label>
                    <Textarea
                      value={form.allergies}
                      onChange={function(e) { handleChange('allergies', e.target.value); }}
                      placeholder="List any food or environmental allergies..."
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label>Medical Information / Special Needs</Label>
                    <Textarea
                      value={form.medical_info}
                      onChange={function(e) { handleChange('medical_info', e.target.value); }}
                      placeholder="Please list any medical conditions, medications, or special needs we should be aware of..."
                      rows={4}
                    />
                  </div>

                  <div className="border-t pt-4">
                    <p className="text-sm text-muted-foreground mb-4">
                      By submitting this application, you confirm that all information provided is accurate. 
                      Camp Baraisa will review your application and contact you regarding next steps.
                    </p>
                  </div>

                  <div className="flex justify-between pt-4">
                    <Button type="button" variant="outline" onClick={prevStep}>
                      <ArrowLeft className="w-4 h-4 mr-2" /> Back
                    </Button>
                    <Button 
                      type="submit" 
                      className="btn-camp-primary"
                      disabled={submitting}
                      data-testid="submit-application-btn"
                    >
                      {submitting ? 'Submitting...' : 'Submit Application'}
                    </Button>
                  </div>
                </CardContent>
              </>
            )}
          </form>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-white/80 text-sm">
          <p>Questions? Contact us:</p>
          <p className="mt-1">
            <Phone className="w-4 h-4 inline mr-1" />
            <a href="tel:732-987-7156" className="hover:text-white">732-987-7156</a>
            {' • '}
            <Mail className="w-4 h-4 inline mr-1" />
            <a href="mailto:campbaraisa@gmail.com" className="hover:text-white">campbaraisa@gmail.com</a>
          </p>
          <p className="mt-2">
            <MapPin className="w-4 h-4 inline mr-1" />
            Panguitch, Utah
          </p>
        </div>
      </div>
    </div>
  );
}

export default Apply;
