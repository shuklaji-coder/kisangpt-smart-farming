import React, { useMemo, useRef, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Avatar,
  Paper,
  useTheme,
  Divider,
  Chip,
  TextField,
  MenuItem,
  Button,
  Slider,
  Checkbox,
  FormControlLabel,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Star,
  Today,
  DateRange,
  Event,
  EmojiEvents,
  AutoAwesome,
  ExpandMore
} from '@mui/icons-material';
import { useTranslation, TFunction } from 'react-i18next';
import { motion } from 'framer-motion';

// helper for exporting a section as PNG
async function exportSectionAsPng(node: HTMLElement, filename: string) {
  const w: any = window as any;
  if (!w.html2canvas) {
    await new Promise<void>((resolve) => {
      const s = document.createElement('script');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
      s.async = true;
      s.onload = () => resolve();
      document.body.appendChild(s);
    });
  }
  const canvas = await (window as any).html2canvas(node, { backgroundColor: '#ffffff', scale: 2 });
  const link = document.createElement('a');
  link.href = canvas.toDataURL('image/png');
  link.download = `${filename}.png`;
  link.click();
}

const DreamVisualization: React.FC = () => {
const { t } = (useTranslation as any)();
  const theme = useTheme();

  // Advanced Builder state
  const [farmSize, setFarmSize] = useState(2);
  const [targetIncome, setTargetIncome] = useState(150000);
  const [investment, setInvestment] = useState(50000);
  const [risk, setRisk] = useState<'low'|'medium'|'high'>('medium');
  const [focusCrop, setFocusCrop] = useState('wheat');
  const [months, setMonths] = useState(6);
  const [plan, setPlan] = useState<any | null>(null);
  const exportRef = useRef<HTMLDivElement>(null);

  // Tasks checklist persisted in localStorage
  const [tasks, setTasks] = useState<{ label: string; done: boolean }[]>(() => {
    try { return JSON.parse(localStorage.getItem('dream_tasks') || '[]'); } catch { return []; }
  });
  const saveTasks = (t: any) => { setTasks(t); try { localStorage.setItem('dream_tasks', JSON.stringify(t)); } catch {} };

  // Alternate scenario for quick compare
  const [alt, setAlt] = useState({ crop: 'rice', size: 2, invest: 60000, income: 180000, months: 7, risk: 'medium' as 'low'|'medium'|'high' });

  const costBreakdown = useMemo(() => {
    const seed = Math.max(8000, Math.round(investment * 0.25));
    const fert = Math.max(10000, Math.round(investment * 0.3));
    const irrigation = Math.round(investment * 0.2);
    const labor = Math.round(investment * 0.15);
    const misc = Math.max(3000, investment - (seed + fert + irrigation + labor));
    return { seed, fert, irrigation, labor, misc };
  }, [investment]);

  const expectedROI = useMemo(() => {
    const base = (targetIncome - investment) / Math.max(1, investment);
    const riskAdj = risk === 'low' ? 0.85 : risk === 'high' ? 1.15 : 1.0;
    return Math.max(0.1, +(base * riskAdj).toFixed(2));
  }, [targetIncome, investment, risk]);

  const generateTimeline = () => {
    const start = new Date();
    const steps = [
      { label: 'Soil Test & Prep', emoji: 'ðŸ§ª', offset: 0 },
      { label: 'Seed Purchase', emoji: 'ðŸŒ±', offset: 0.25 },
      { label: 'Sowing', emoji: 'ðŸšœ', offset: 0.5 },
      { label: 'Irrigation & Fertilizers', emoji: 'ðŸ’§', offset: 0.7 },
      { label: 'Weed/Pest Mgmt', emoji: 'ðŸª²', offset: 0.8 },
      { label: 'Harvest & Market', emoji: 'ðŸ“¦', offset: 1.0 },
    ];
    const items = steps.map(s => {
      const d = new Date(start);
      d.setMonth(d.getMonth() + Math.max(1, Math.round(months * s.offset)));
      return { ...s, date: d.toLocaleDateString('hi-IN', { day:'2-digit', month:'short' }) };
    });
    setPlan({ items });
    // seed tasks
    const t = items.map((it:any) => ({ label: `${it.emoji} ${it.label}`, done: false }));
    saveTasks(t);
  };

  const altROI = useMemo(() => {
    const base = (alt.income - alt.invest) / Math.max(1, alt.invest);
    const r = alt.risk === 'low' ? 0.85 : alt.risk === 'high' ? 1.15 : 1;
    return Math.max(0.1, +(base * r).toFixed(2));
  }, [alt]);

  const exportICS = () => {
    if (!plan) return;
    const dt = (d: Date) => {
      const pad = (n:number) => String(n).padStart(2,'0');
      return `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}T090000`;
    };
    const lines = [
      'BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//KisanGPT//DreamPlan//EN'
    ];
    const start = new Date();
    plan.items.forEach((it:any) => {
      const ev = new Date(start);
      // heuristic: parse month offset roughly by index
      lines.push('BEGIN:VEVENT');
      lines.push(`SUMMARY:${it.emoji} ${it.label}`);
      lines.push(`DTSTART:${dt(ev)}`);
      lines.push('DURATION:PT1H');
      lines.push('END:VEVENT');
    });
    lines.push('END:VCALENDAR');
    const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'dream_plan.ics';
    link.click();
  };

  const speakSummary = () => {
    const s = `Focus crop ${focusCrop}. Investment ${investment} rupees. Target income ${targetIncome}. Expected ROI ${Math.round(expectedROI*100)} percent in ${months} months.`;
    const u = new SpeechSynthesisUtterance(s);
    window.speechSynthesis.speak(u);
  };

  const pathwaySteps = [
    {
      title: t('dreamVisualization.today'),
      task: t('dreamVisualization.todayTask'),
      icon: <Today />,
      color: '#4caf50',
      emoji: 'ðŸ˜Š',
      progress: 100,
      status: 'active',
    },
    {
      title: t('dreamVisualization.next30Days'),
      task: t('dreamVisualization.next30Task'),
      icon: <DateRange />,
      color: '#2196f3',
      emoji: 'ðŸš€',
      progress: 60,
      status: 'inProgress',
    },
    {
      title: t('dreamVisualization.oneYearGoal'),
      task: t('dreamVisualization.yearGoal'),
      icon: <Event />,
      color: '#ff9800',
      emoji: 'ðŸ†',
      progress: 25,
      status: 'future',
    },
  ];

  const achievements = [
    { icon: 'ðŸŒ¾', label: 'Crop Yield', value: '+15%' },
    { icon: 'ðŸ’°', label: 'Income', value: '+25%' },
    { icon: 'ðŸ†', label: 'Success Rate', value: '85%' },
    { icon: 'â¤ï¸', label: 'Happiness', value: '90%' },
  ];

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Paper
          elevation={3}
          sx={{
            background: 'radial-gradient(900px 420px at 15% 10%, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0) 60%), linear-gradient(130deg, #6a1b9a 0%, #8e24aa 45%, #ab47bc 85%)',
            color: 'white',
            p: 5,
            mb: 5,
            borderRadius: 4,
            textAlign: 'center',
            border: '1px solid rgba(255,255,255,0.2)',
            boxShadow: '0 18px 40px rgba(106,27,154,0.35)'
          }}
        >
          <AutoAwesome sx={{ fontSize: 48, mb: 1 }} />
          <Typography variant="h3" sx={{ fontWeight: 800, mb: 1, letterSpacing: 0.5, textShadow: '2px 2px 4px rgba(0,0,0,0.3)' }}>
            â­ {t('dreamVisualization.title')} â­
          </Typography>
          <Typography variant="h6" sx={{ opacity: 0.9, maxWidth: 820, mx: 'auto' }}>
            {t('dreamVisualization.subtitle')}
          </Typography>
        </Paper>
      </motion.div>

      {/* Advanced Plan Builder */}
      <Paper elevation={3} sx={{ p:3, mb:4, borderRadius:3, background: 'linear-gradient(135deg, #fff 0%, #fafafa 100%)' }}>
        <Typography variant="h5" sx={{ fontWeight:'bold', mb:2, display:'flex', alignItems:'center', gap:1 }}>
          <AutoAwesome fontSize="small" /> ðŸš€ Advanced Dream Builder
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={3}>
            <TextField fullWidth label="Focus Crop" select value={focusCrop} onChange={(e)=>setFocusCrop(e.target.value)}>
              {['wheat','rice','maize','cotton','mustard','sugarcane'].map(c => (
                <MenuItem key={c} value={c}>{c.toUpperCase()}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={6} md={3}>
            <TextField fullWidth type="number" label="Farm Size (ha)" value={farmSize} onChange={(e)=>setFarmSize(+e.target.value || 0)} />
          </Grid>
          <Grid item xs={6} md={3}>
            <TextField fullWidth type="number" label="Investment (â‚¹)" value={investment} onChange={(e)=>setInvestment(+e.target.value || 0)} />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField fullWidth type="number" label="Target Income (â‚¹)" value={targetIncome} onChange={(e)=>setTargetIncome(+e.target.value || 0)} />
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" sx={{ mb:0.5 }}>Timeline (months): {months}</Typography>
            <Slider value={months} onChange={(_,v)=>setMonths(v as number)} min={3} max={12} step={1} />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField fullWidth select label="Risk Preference" value={risk} onChange={(e)=>setRisk(e.target.value as any)}>
              <MenuItem value="low">Low</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="high">High</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} md={3} sx={{ display:'flex', alignItems:'end' }}>
            <Button variant="contained" color="primary" fullWidth onClick={generateTimeline}>Generate Advanced Plan</Button>
          </Grid>
        </Grid>

        {/* Overview */}
        <Grid container spacing={2} sx={{ mt:2 }}>
          <Grid item xs={12} md={6}>
            <Card elevation={1} sx={{ p:2, borderRadius:3, background: 'linear-gradient(180deg, #ffffff 0%, #f8f8f8 100%)' }}>
              <Typography variant="subtitle1" sx={{ fontWeight:700, mb:1 }}>ðŸ’¸ Cost Breakdown</Typography>
              <Grid container spacing={1}>
                {Object.entries(costBreakdown).map(([k,v]) => (
                  <Grid key={k} item xs={6}>
                    <Box sx={{ display:'flex', justifyContent:'space-between', bgcolor:'rgba(0,0,0,0.04)', p:1, borderRadius:1 }}>
                      <Typography variant="body2">{k.toUpperCase()}</Typography>
                      <Typography variant="body2" sx={{ fontWeight:700 }}>â‚¹{v.toLocaleString()}</Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card elevation={1} sx={{ p:2, borderRadius:3, background: 'linear-gradient(180deg, #ffffff 0%, #f8f8f8 100%)' }}>
              <Typography variant="subtitle1" sx={{ fontWeight:700, mb:1 }}>ðŸ“ˆ ROI Projection</Typography>
              <Typography variant="h4" sx={{ fontWeight:800, color: expectedROI>0.5 ? 'success.main':'warning.main' }}>{Math.round(expectedROI*100)}%</Typography>
              <Typography variant="body2" color="text.secondary">Projected ROI in {months} months for {focusCrop.toUpperCase()} on {farmSize} ha.</Typography>
            </Card>
          </Grid>
        </Grid>

        {plan && (
          <Box ref={exportRef} sx={{ mt:2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight:700, mb:1 }}>ðŸ—“ï¸ Timeline</Typography>
            <Box sx={{ display:'flex', flexWrap:'wrap', gap:1.5 }}>
              {plan.items.map((it:any,idx:number)=> (
                <Chip key={idx} label={`${it.emoji} ${it.label} â€¢ ${it.date}`} sx={{ bgcolor:'#e8f5e9', border:'1px solid #c8e6c9' }} />
              ))}
            </Box>
            {/* Tasks Checklist */}
            <Box sx={{ mt:2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight:700, mb:1 }}>âœ… Tasks</Typography>
              <Grid container spacing={1}>
                {tasks.map((t,i)=> (
                  <Grid key={i} item xs={12} md={6}>
                    <FormControlLabel control={<Checkbox checked={t.done} onChange={(e)=>{
                      const arr = [...tasks]; arr[i] = { ...arr[i], done: e.target.checked }; saveTasks(arr);
                    }} />} label={t.label} />
                  </Grid>
                ))}
              </Grid>
              <Box sx={{ mt:1 }}>
                <LinearProgress variant="determinate" value={tasks.length? (tasks.filter(x=>x.done).length / tasks.length) * 100 : 0} />
                <Typography variant="caption" color="text.secondary">{tasks.filter(x=>x.done).length}/{tasks.length} completed</Typography>
              </Box>
            </Box>

            {/* Actions */}
            <Box sx={{ mt:2, display:'flex', gap:1, justifyContent:'flex-end', flexWrap:'wrap' }}>
              <Button variant="outlined" onClick={speakSummary}>Speak Summary</Button>
              <Button variant="outlined" onClick={exportICS}>Export ICS</Button>
              <Button variant="contained" onClick={()=> exportRef.current && exportSectionAsPng(exportRef.current, 'advanced_plan') }>Export Plan PNG</Button>
            </Box>
          </Box>
        )}
      </Paper>

      {/* Scenario Compare */}
      <Accordion sx={{ mb:3, borderRadius:2, overflow:'hidden' }}>
        <AccordionSummary expandIcon={<ExpandMore />} sx={{ background: 'linear-gradient(135deg, #f3e5f5 0%, #ede7f6 100%)' }}>
          <Typography variant="h6" sx={{ fontWeight:700 }}>ðŸ”„ Compare Scenario (Alternate Plan)</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Card elevation={1} sx={{ p:2, borderRadius:3 }}>
                <Typography variant="subtitle1" sx={{ fontWeight:700, mb:1 }}>Current Plan</Typography>
                <Typography variant="body2">Crop: {focusCrop.toUpperCase()} â€¢ Size: {farmSize} ha â€¢ Inv: â‚¹{investment.toLocaleString()} â€¢ Target: â‚¹{targetIncome.toLocaleString()} â€¢ Months: {months}</Typography>
                <Typography variant="h5" sx={{ mt:1, color: expectedROI>0.5?'success.main':'warning.main', fontWeight:800 }}>{Math.round(expectedROI*100)}% ROI</Typography>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card elevation={1} sx={{ p:2, borderRadius:3 }}>
                <Typography variant="subtitle1" sx={{ fontWeight:700, mb:1 }}>Alternate Plan</Typography>
                <Grid container spacing={1}>
                  <Grid item xs={6}><TextField fullWidth size="small" label="Crop" value={alt.crop} onChange={(e)=>setAlt({ ...alt, crop:e.target.value })} /></Grid>
                  <Grid item xs={6}><TextField fullWidth size="small" type="number" label="Size" value={alt.size} onChange={(e)=>setAlt({ ...alt, size:+e.target.value })} /></Grid>
                  <Grid item xs={6}><TextField fullWidth size="small" type="number" label="Invest" value={alt.invest} onChange={(e)=>setAlt({ ...alt, invest:+e.target.value })} /></Grid>
                  <Grid item xs={6}><TextField fullWidth size="small" type="number" label="Target" value={alt.income} onChange={(e)=>setAlt({ ...alt, income:+e.target.value })} /></Grid>
                  <Grid item xs={6}><TextField fullWidth size="small" type="number" label="Months" value={alt.months} onChange={(e)=>setAlt({ ...alt, months:+e.target.value })} /></Grid>
                  <Grid item xs={6}><TextField fullWidth size="small" label="Risk" value={alt.risk} onChange={(e)=>setAlt({ ...alt, risk:e.target.value as any })} /></Grid>
                </Grid>
                <Typography variant="h5" sx={{ mt:1, color: altROI>0.5?'success.main':'warning.main', fontWeight:800 }}>{Math.round(altROI*100)}% ROI</Typography>
              </Card>
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* Success Pathway Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {pathwaySteps.map((step, index) => (
          <Grid item xs={12} md={4} key={index}>
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
            >
              <Card
                elevation={4}
                sx={{
                  borderRadius: 4,
                  height: '100%',
                  border: step.status === 'active' ? `3px solid ${step.color}` : 'none',
                  position: 'relative',
                  overflow: 'visible',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: theme.shadows[12],
                  },
                  transition: 'all 0.4s ease-in-out',
                }}
              >
                {/* Top Icon */}
                <Box
                  sx={{
                    position: 'absolute',
                    top: -20,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 1,
                  }}
                >
                  <Avatar
                    sx={{
                      bgcolor: step.color,
                      width: 60,
                      height: 60,
                      border: '4px solid white',
                      boxShadow: theme.shadows[4],
                    }}
                  >
                    {step.icon}
                  </Avatar>
                </Box>

                <CardContent sx={{ textAlign: 'center', pt: 5 }}>
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: 'bold',
                      mb: 2,
                      color: step.color,
                    }}
                  >
                    {step.title}
                  </Typography>
                  
                  <Typography
                    variant="h2"
                    sx={{ mb: 2 }}
                  >
                    {step.emoji}
                  </Typography>
                  
                  <Typography
                    variant="body1"
                    sx={{
                      mb: 3,
                      fontWeight: 500,
                      lineHeight: 1.6,
                      minHeight: 50,
                    }}
                  >
                    {step.task}
                  </Typography>

                  <Divider sx={{ mb: 2 }} />
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      Progress
                    </Typography>
                    <Chip
                      label={`${step.progress}%`}
                      size="small"
                      sx={{
                        bgcolor: step.color,
                        color: 'white',
                        fontWeight: 'bold',
                      }}
                    />
                  </Box>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        ))}
      </Grid>

      {/* Motivational Message */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.8 }}
      >
        <Paper
          elevation={3}
          sx={{
            background: 'linear-gradient(45deg, #4caf50 0%, #8bc34a 100%)',
            color: 'white',
            p: 4,
            mb: 4,
            borderRadius: 4,
            textAlign: 'center',
          }}
        >
          <Typography
            variant="h4"
            sx={{
              fontWeight: 'bold',
              mb: 2,
              fontFamily: 'serif',
            }}
          >
            "{t('dreamVisualization.motivationalText')}"
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Star key={star} sx={{ color: '#ffd700', fontSize: 30 }} />
            ))}
          </Box>
        </Paper>
      </motion.div>

      {/* Achievement Stats */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1.0 }}
      >
        <Typography
          variant="h5"
          sx={{
            mb: 3,
            textAlign: 'center',
            fontWeight: 'bold',
            color: theme.palette.primary.main,
          }}
        >
          ðŸŽ¯ Your Journey Achievements
        </Typography>
        
        <Grid container spacing={2}>
          {achievements.map((achievement, index) => (
            <Grid item xs={6} md={3} key={index}>
              <Card
                elevation={2}
                sx={{
                  textAlign: 'center',
                  p: 2,
                  borderRadius: 3,
                  '&:hover': {
                    transform: 'scale(1.05)',
                    boxShadow: theme.shadows[6],
                  },
                  transition: 'all 0.3s ease-in-out',
                }}
              >
                <Typography variant="h3" sx={{ mb: 1 }}>
                  {achievement.icon}
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                  {achievement.value}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {achievement.label}
                </Typography>
              </Card>
            </Grid>
          ))}
        </Grid>
      </motion.div>

      {/* Success Visualization */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 1.2 }}
      >
        <Paper
          elevation={2}
          sx={{
            mt: 4,
            p: 3,
            borderRadius: 4,
            background: 'linear-gradient(135deg, #e8f5e8 0%, #f1f8e9 50%, #e0f2f1 100%)',
          }}
        >
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <EmojiEvents sx={{ fontSize: 50, color: '#ff9800', mb: 1 }} />
            <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1 }}>
              Success Pathway Visualization
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Your personalized journey towards agricultural prosperity
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
            {['ðŸŒ± Plant', 'ðŸŒ¾ Grow', 'ðŸ“ˆ Prosper', 'ðŸ† Succeed', 'â¤ï¸ Happy'].map((step, index) => (
              <Chip
                key={index}
                label={step}
                variant="filled"
                sx={{
                  bgcolor: theme.palette.primary.light,
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: '1rem',
                  p: 2,
                }}
              />
            ))}
          </Box>
        </Paper>
      </motion.div>
    </Box>
  );
};

export default DreamVisualization;