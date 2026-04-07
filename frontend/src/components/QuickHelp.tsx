import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  MenuItem,
  Button,
  Grid,
  Alert,
  IconButton,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  HelpOutline,
  MyLocation,
  PhotoCamera,
  Send,
  Phone,
  WhatsApp,
  Share,
} from '@mui/icons-material';

const problemTypes = [
  'Disease / पत्तों पर दाग',
  'Pest / कीट समस्या',
  'Irrigation / सिंचाई',
  'Weather / मौसम',
  'Market Price / मंडी भाव',
  'Loan / KCC',
  'Other / अन्य',
];

const defaultMsg = (name: string, phone: string) =>
  `नमस्ते, मुझे खेती में मदद चाहिए।\nसमस्या: ${name}\nमोबाइल: ${phone || '—'}\nस्थान: (नीचे लोकेशन लिंक देखें)\nविवरण: `;

const QuickHelp: React.FC = () => {
  const theme = useTheme();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [problem, setProblem] = useState(problemTypes[0]);
  const [details, setDetails] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [photo, setPhoto] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const helpline = useMemo(
    () => (process.env.REACT_APP_HELPLINE_PHONE || '+919999999999').replace(/\s+/g, ''),
    []
  );

  const getLocation = () => {
    setError(null);
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser.');
      return;
    }
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        setLocationLoading(false);
      },
      (err) => {
        setError('Failed to fetch your location. Please allow location access.');
        setLocationLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const mapsLink = useMemo(() => {
    if (!coords) return '';
    return `https://maps.google.com/?q=${coords.lat},${coords.lon}`;
  }, [coords]);

  const composedText = useMemo(() => {
    const header = defaultMsg(problem, phone);
    const loc = coords ? `\nलोकेशन: ${mapsLink}` : '';
    return `${header}${details}${loc}`;
  }, [problem, phone, details, mapsLink, coords]);

  const openWhatsApp = () => {
    const text = encodeURIComponent(composedText);
    const url = `https://wa.me/${helpline}?text=${text}`;
    window.open(url, '_blank');
  };

  const callHelpline = () => {
    window.location.href = `tel:${helpline}`;
  };

  const shareNative = async () => {
    try {
      // Web Share API (Note: attaching files may not be supported on all devices)
      if ((navigator as any).share) {
        const opts: any = { title: 'Kisan Quick Help', text: composedText };
        if (photo) {
          try {
            const file = new File([await photo.arrayBuffer()], photo.name, { type: photo.type });
            opts.files = [file];
          } catch {}
        }
        await (navigator as any).share(opts);
      } else {
        setError('Share not supported on this device. Use WhatsApp or Call.');
      }
    } catch (e) {
      setError('Share failed.');
    }
  };

  return (
    <Box sx={{ p: { xs: 1, md: 3 } }}>
      <Paper elevation={3} sx={{ p: 3, mb: 2 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
          <HelpOutline sx={{ mr: 1 }} /> Quick Help / तुरंत सहायता
        </Typography>
        <Typography variant="body2" color="text.secondary">
          एक टैप में एक्सपर्ट को लोकेशन, समस्या और विवरण भेजें। WhatsApp, Call या Share विकल्प उपलब्ध है।
        </Typography>
      </Paper>

      <Paper elevation={2} sx={{ p: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        )}
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}><TextField label="आपका नाम / Name" fullWidth value={name} onChange={(e)=>setName(e.target.value)} /></Grid>
          <Grid item xs={12} md={6}><TextField label="मोबाइल / Mobile (optional)" fullWidth value={phone} onChange={(e)=>setPhone(e.target.value)} /></Grid>
          <Grid item xs={12} md={6}><TextField label="समस्या / Problem" select fullWidth value={problem} onChange={(e)=>setProblem(e.target.value)}>{problemTypes.map(p=> <MenuItem key={p} value={p}>{p}</MenuItem>)}</TextField></Grid>
          <Grid item xs={12}>
            <TextField label="विवरण / Details" fullWidth multiline minRows={3} value={details} onChange={(e)=>setDetails(e.target.value)} placeholder="क्या दिख रहा है? कब से? कौनसी फसल/कितना क्षेत्र?" />
          </Grid>
          <Grid item xs={12} md={8}>
            <Button variant="outlined" startIcon={<MyLocation />} onClick={getLocation} disabled={locationLoading}>
              {locationLoading ? 'लोकेशन मिल रही है…' : coords ? `लोकेशन सेट: ${coords.lat.toFixed(3)}, ${coords.lon.toFixed(3)}` : 'लोकेशन जोड़ें'}
            </Button>
            {coords && (
              <Button sx={{ ml: 1 }} href={mapsLink} target="_blank">Map देखें</Button>
            )}
          </Grid>
          <Grid item xs={12} md={4}>
            <Button variant="outlined" component="label" startIcon={<PhotoCamera />} fullWidth>
              फ़ोटो जोड़ें (optional)
              <input hidden type="file" accept="image/*" onChange={(e)=>setPhoto(e.target.files?.[0] || null)} />
            </Button>
            {photo && (
              <Typography variant="caption" color="text.secondary">Selected: {photo.name}</Typography>
            )}
          </Grid>
        </Grid>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mt: 3 }}>
          <Button variant="contained" color="success" startIcon={<WhatsApp />} onClick={openWhatsApp}>
            WhatsApp Expert
          </Button>
          <Button variant="outlined" color="primary" startIcon={<Phone />} onClick={callHelpline}>
            Call Helpline
          </Button>
          <Button variant="outlined" startIcon={<Share />} onClick={shareNative}>
            Share
          </Button>
        </Box>

        <Alert severity="info" sx={{ mt: 2 }}>
          नोट: वेब WhatsApp में फ़ोटो साथ में auto-attach नहीं हो पाता; Share बटन से फोटो + टेक्स्ट भेज सकते हैं (device support पर निर्भर)।
        </Alert>
      </Paper>
    </Box>
  );
};

export default QuickHelp;
