import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Grid,
  TextField,
  MenuItem,
  Button,
  Chip,
  Alert,
  Checkbox,
  FormControlLabel,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  AccountBalance,
  AssignmentTurnedIn,
  CloudUpload,
  CheckCircle,
  RadioButtonUnchecked,
  PictureAsPdf,
  Send,
} from '@mui/icons-material';
import loanService from '../services/loanService';

const steps = ['KYC', 'Farm Details', 'Financials', 'Documents', 'Review'];

interface LoanDraft {
  kyc: {
    name: string;
    aadhaar: string;
    mobile: string;
    email: string;
    address: string;
    state: string;
    district: string;
  };
  farm: {
    sizeAcre: number;
    ownership: 'own' | 'lease';
    landRecordId: string;
    irrigation: 'canal' | 'borewell' | 'rainfed';
    crops: string[];
  };
  finance: {
    type: 'kcc' | 'crop_input' | 'equipment';
    bank: string;
    amount: number;
    tenureMonths: number;
    repayment: 'monthly' | 'quarterly' | 'seasonal';
    incomeAnnual: number;
    existingLoan: boolean;
  };
  docs: {
    aadhaar?: File | null;
    land?: File | null;
    passbook?: File | null;
    photo?: File | null;
    signature?: File | null;
    accept: boolean;
  };
}

const defaultDraft: LoanDraft = {
  kyc: { name: '', aadhaar: '', mobile: '', email: '', address: '', state: '', district: '' },
  farm: { sizeAcre: 1, ownership: 'own', landRecordId: '', irrigation: 'rainfed', crops: [] },
  finance: { type: 'kcc', bank: '', amount: 50000, tenureMonths: 12, repayment: 'seasonal', incomeAnnual: 200000, existingLoan: false },
  docs: { accept: false }
};

const states = ['Uttar Pradesh', 'Bihar', 'Madhya Pradesh', 'Rajasthan', 'Maharashtra', 'Punjab', 'Haryana'];
const cropsList = ['Wheat', 'Rice', 'Maize', 'Soybean', 'Cotton', 'Mustard', 'Vegetables'];

const LoanApplication: React.FC = () => {
  const theme = useTheme();
  const [activeStep, setActiveStep] = useState(0);
  const [draft, setDraft] = useState<LoanDraft>(() => {
    try {
      const raw = localStorage.getItem('loan_app_draft');
      return raw ? JSON.parse(raw) : defaultDraft;
    } catch { return defaultDraft; }
  });
  const [banks, setBanks] = useState<{ name: string; rate: string; product: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ applicationId: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const save = (next: Partial<LoanDraft>) => {
    const merged = { ...draft, ...next } as LoanDraft;
    setDraft(merged);
    try { localStorage.setItem('loan_app_draft', JSON.stringify(merged)); } catch {}
  };

  useEffect(() => {
    (async () => {
      try { setBanks(await loanService.fetchBanks()); } catch {}
    })();
  }, []);

  const canProceed = useMemo(() => {
    if (activeStep === 0) {
      const { name, aadhaar, mobile, state } = draft.kyc;
      return name && aadhaar.length >= 8 && mobile.length >= 10 && state;
    }
    if (activeStep === 1) {
      return draft.farm.sizeAcre > 0 && draft.farm.landRecordId.length >= 4;
    }
    if (activeStep === 2) {
      return !!draft.finance.bank && draft.finance.amount >= 10000;
    }
    if (activeStep === 3) {
      return !!draft.docs.accept; // documents optional for demo; accept terms required
    }
    return true;
  }, [activeStep, draft]);

  const handleSubmit = async () => {
    try {
      setSubmitting(true); setError(null);
      const payload = {
        ...draft,
        kyc: { ...draft.kyc, aadhaar: draft.kyc.aadhaar.replace(/\d(?=\d{4})/g, 'x') }, // mask Aadhaar except last 4
      };
      const res = await loanService.applyLoan(payload as any);
      setResult({ applicationId: res.applicationId });
      try { localStorage.removeItem('loan_app_draft'); } catch {}
    } catch (e: any) {
      setError(e?.message || 'Failed to submit');
    } finally { setSubmitting(false); }
  };

  const StepKYC = (
    <Grid container spacing={2}>
      <Grid item xs={12} md={6}><TextField label="Full Name" fullWidth value={draft.kyc.name} onChange={(e)=>save({ kyc:{...draft.kyc, name:e.target.value } })} /></Grid>
      <Grid item xs={12} md={6}><TextField label="Aadhaar (last 4 visible)" fullWidth value={draft.kyc.aadhaar} onChange={(e)=>save({ kyc:{...draft.kyc, aadhaar:e.target.value } })} /></Grid>
      <Grid item xs={12} md={6}><TextField label="Mobile" fullWidth value={draft.kyc.mobile} onChange={(e)=>save({ kyc:{...draft.kyc, mobile:e.target.value } })} /></Grid>
      <Grid item xs={12} md={6}><TextField label="Email (optional)" fullWidth value={draft.kyc.email} onChange={(e)=>save({ kyc:{...draft.kyc, email:e.target.value } })} /></Grid>
      <Grid item xs={12}><TextField label="Address" fullWidth value={draft.kyc.address} onChange={(e)=>save({ kyc:{...draft.kyc, address:e.target.value } })} /></Grid>
      <Grid item xs={12} md={6}><TextField label="State" select fullWidth value={draft.kyc.state} onChange={(e)=>save({ kyc:{...draft.kyc, state:e.target.value } })}>{states.map(s=><MenuItem key={s} value={s}>{s}</MenuItem>)}</TextField></Grid>
      <Grid item xs={12} md={6}><TextField label="District" fullWidth value={draft.kyc.district} onChange={(e)=>save({ kyc:{...draft.kyc, district:e.target.value } })} /></Grid>
      <Grid item xs={12}><Alert severity="info">Your Aadhaar will be masked before submission. Do not share OTP in screenshots/messages.</Alert></Grid>
    </Grid>
  );

  const StepFarm = (
    <Grid container spacing={2}>
      <Grid item xs={12} md={4}><TextField type="number" label="Farm size (acre)" fullWidth value={draft.farm.sizeAcre} onChange={(e)=>save({ farm:{...draft.farm, sizeAcre:Number(e.target.value) } })} /></Grid>
      <Grid item xs={12} md={4}><TextField select label="Ownership" fullWidth value={draft.farm.ownership} onChange={(e)=>save({ farm:{...draft.farm, ownership:e.target.value as any } })}><MenuItem value="own">Own</MenuItem><MenuItem value="lease">Lease</MenuItem></TextField></Grid>
      <Grid item xs={12} md={4}><TextField label="Land Record ID (Khasra/Khatauni)" fullWidth value={draft.farm.landRecordId} onChange={(e)=>save({ farm:{...draft.farm, landRecordId:e.target.value } })} /></Grid>
      <Grid item xs={12} md={4}><TextField select label="Irrigation" fullWidth value={draft.farm.irrigation} onChange={(e)=>save({ farm:{...draft.farm, irrigation:e.target.value as any } })}><MenuItem value="rainfed">Rainfed</MenuItem><MenuItem value="canal">Canal</MenuItem><MenuItem value="borewell">Borewell</MenuItem></TextField></Grid>
      <Grid item xs={12} md={8}><TextField select label="Crops (this season)" fullWidth SelectProps={{ multiple:true }} value={draft.farm.crops} onChange={(e)=>save({ farm:{...draft.farm, crops: e.target.value as any } })}>{cropsList.map(c=><MenuItem key={c} value={c}>{c}</MenuItem>)}</TextField></Grid>
      <Grid item xs={12}><Alert severity="info">If your land is leased, upload lease document in the Documents step.</Alert></Grid>
    </Grid>
  );

  const StepFinance = (
    <Grid container spacing={2}>
      <Grid item xs={12} md={4}><TextField select label="Loan Type" fullWidth value={draft.finance.type} onChange={(e)=>save({ finance:{...draft.finance, type:e.target.value as any } })}><MenuItem value="kcc">Kisan Credit Card (KCC)</MenuItem><MenuItem value="crop_input">Crop Input</MenuItem><MenuItem value="equipment">Equipment</MenuItem></TextField></Grid>
      <Grid item xs={12} md={4}><TextField label="Loan Amount (₹)" type="number" fullWidth value={draft.finance.amount} onChange={(e)=>save({ finance:{...draft.finance, amount:Number(e.target.value) } })} /></Grid>
      <Grid item xs={12} md={4}><TextField label="Tenure (months)" type="number" fullWidth value={draft.finance.tenureMonths} onChange={(e)=>save({ finance:{...draft.finance, tenureMonths:Number(e.target.value) } })} /></Grid>
      <Grid item xs={12} md={4}><TextField select label="Repayment" fullWidth value={draft.finance.repayment} onChange={(e)=>save({ finance:{...draft.finance, repayment:e.target.value as any } })}><MenuItem value="seasonal">Seasonal</MenuItem><MenuItem value="quarterly">Quarterly</MenuItem><MenuItem value="monthly">Monthly</MenuItem></TextField></Grid>
      <Grid item xs={12} md={4}><TextField label="Annual Income (₹)" type="number" fullWidth value={draft.finance.incomeAnnual} onChange={(e)=>save({ finance:{...draft.finance, incomeAnnual:Number(e.target.value) } })} /></Grid>
      <Grid item xs={12} md={4}><TextField select label="Bank" fullWidth value={draft.finance.bank} onChange={(e)=>save({ finance:{...draft.finance, bank:e.target.value } })}>{banks.map(b=><MenuItem key={b.name} value={b.name}>{b.name} — {b.rate}</MenuItem>)}</TextField></Grid>
      <Grid item xs={12}><FormControlLabel control={<Checkbox checked={draft.finance.existingLoan} onChange={(e)=>save({ finance:{...draft.finance, existingLoan:e.target.checked } })} />} label="Any existing agri loan?" /></Grid>
      <Grid item xs={12}><Alert severity="success">Tip: KCC generally offers flexible withdrawals with interest subvention for timely repayment.</Alert></Grid>
    </Grid>
  );

  const StepDocs = (
    <Grid container spacing={2}>
      <Grid item xs={12} md={6}><Button variant="outlined" component="label" startIcon={<CloudUpload />} fullWidth>Aadhaar (front/back)<input hidden type="file" onChange={(e)=>save({ docs:{...draft.docs, aadhaar: e.target.files?.[0] || null } })} /></Button></Grid>
      <Grid item xs={12} md={6}><Button variant="outlined" component="label" startIcon={<CloudUpload />} fullWidth>Land Record / Lease<input hidden type="file" onChange={(e)=>save({ docs:{...draft.docs, land: e.target.files?.[0] || null } })} /></Button></Grid>
      <Grid item xs={12} md={6}><Button variant="outlined" component="label" startIcon={<CloudUpload />} fullWidth>Bank Passbook<input hidden type="file" onChange={(e)=>save({ docs:{...draft.docs, passbook: e.target.files?.[0] || null } })} /></Button></Grid>
      <Grid item xs={12} md={3}><Button variant="outlined" component="label" startIcon={<CloudUpload />} fullWidth>Photo<input hidden type="file" accept="image/*" onChange={(e)=>save({ docs:{...draft.docs, photo: e.target.files?.[0] || null } })} /></Button></Grid>
      <Grid item xs={12} md={3}><Button variant="outlined" component="label" startIcon={<CloudUpload />} fullWidth>Signature<input hidden type="file" accept="image/*" onChange={(e)=>save({ docs:{...draft.docs, signature: e.target.files?.[0] || null } })} /></Button></Grid>
      <Grid item xs={12}><FormControlLabel control={<Checkbox checked={draft.docs.accept} onChange={(e)=>save({ docs:{...draft.docs, accept:e.target.checked } })} />} label="I confirm information is true to the best of my knowledge." /></Grid>
      <Grid item xs={12}><Alert severity="info">Documents are uploaded to the server only after you submit. For demo, uploads are mocked locally.</Alert></Grid>
    </Grid>
  );

  const StepReview = (
    <Box>
      <Typography variant="h6" sx={{ mb: 1 }}>Application Summary</Typography>
      <List>
        <ListItem><ListItemIcon><CheckCircle color="success"/></ListItemIcon><ListItemText primary={`Name: ${draft.kyc.name}`} /></ListItem>
        <ListItem><ListItemIcon><CheckCircle color="success"/></ListItemIcon><ListItemText primary={`Mobile: ${draft.kyc.mobile}`} /></ListItem>
        <ListItem><ListItemIcon><CheckCircle color="success"/></ListItemIcon><ListItemText primary={`State/District: ${draft.kyc.state}, ${draft.kyc.district}`} /></ListItem>
        <ListItem><ListItemIcon><CheckCircle color="success"/></ListItemIcon><ListItemText primary={`Farm: ${draft.farm.sizeAcre} acre, ${draft.farm.ownership}`} /></ListItem>
        <ListItem><ListItemIcon><CheckCircle color="success"/></ListItemIcon><ListItemText primary={`Crops: ${draft.farm.crops.join(', ')}`} /></ListItem>
        <ListItem><ListItemIcon><CheckCircle color="success"/></ListItemIcon><ListItemText primary={`Loan: ${draft.finance.type.toUpperCase()} • ₹${draft.finance.amount} • ${draft.finance.tenureMonths} months`} /></ListItem>
        <ListItem><ListItemIcon><CheckCircle color="success"/></ListItemIcon><ListItemText primary={`Bank: ${draft.finance.bank}`} /></ListItem>
      </List>
      <Alert severity="warning">Please verify details. After submit you’ll get an Application ID and a printable acknowledgement.</Alert>
    </Box>
  );

  if (result) {
    return (
      <Box sx={{ p: { xs: 1, md: 3 } }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>🎉 Application Submitted</Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>Your Application ID: <b>{result.applicationId}</b></Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>We’ve sent your request to the selected bank (or a demo handler). Our team/bank may call you on your registered mobile.</Typography>
          <Button startIcon={<PictureAsPdf />} variant="outlined" onClick={()=>window.print()}>Print/Save Acknowledgement</Button>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 1, md: 3 } }}>
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
          <AccountBalance sx={{ mr: 1 }} /> Apply for Agri Loan / KCC
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Fill this step-by-step form to submit your loan request. No OTP or sensitive data is shared here in demo.
        </Typography>
        <Stepper activeStep={activeStep} alternativeLabel>
          {steps.map((label) => (
            <Step key={label}><StepLabel>{label}</StepLabel></Step>
          ))}
        </Stepper>
      </Paper>

      <Paper elevation={2} sx={{ p: 3 }}>
        {error && (<Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>)}
        {activeStep === 0 && StepKYC}
        {activeStep === 1 && StepFarm}
        {activeStep === 2 && StepFinance}
        {activeStep === 3 && StepDocs}
        {activeStep === 4 && StepReview}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
          <Button disabled={activeStep === 0} onClick={()=>setActiveStep(s=>Math.max(0, s-1))}>Back</Button>
          {activeStep < steps.length - 1 ? (
            <Button variant="contained" disabled={!canProceed} onClick={()=>setActiveStep(s=>s+1)}>Next</Button>
          ) : (
            <Button variant="contained" color="primary" startIcon={<Send />} disabled={submitting || !canProceed} onClick={handleSubmit}>
              {submitting ? 'Submitting...' : 'Submit Application'}
            </Button>
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default LoanApplication;
