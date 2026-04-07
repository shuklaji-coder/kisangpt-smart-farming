import React, { useEffect, useState } from 'react';
import { Box, Paper, Typography, Grid, Card, CardActionArea, CardContent, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';

interface QuizPackMeta { id: string; title: string; description: string; language: string; importId: string }

const QuizList: React.FC = () => {
  const navigate = useNavigate();
  const [packs, setPacks] = useState<QuizPackMeta[]>([]);

  useEffect(() => {
    import('../../data/quiz/manifest.json')
      .then((m: any) => setPacks(m.packs || []))
      .catch(() => setPacks([]));
  }, []);

  return (
    <Box sx={{ p: { xs: 1, md: 3 } }}>
      <Paper sx={{ p: 3, mb: 2 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>🧠 कृषि क्विज़</Typography>
        <Typography variant="body2" color="text.secondary">सीखें और परखें—सरल सवाल, तुरंत परिणाम।</Typography>
      </Paper>

      <Grid container spacing={2}>
        {packs.map((p) => (
          <Grid item xs={12} sm={6} md={4} key={p.id}>
            <Card elevation={3}>
              <CardActionArea onClick={() => navigate(`/quiz/play?pack=${p.importId}`)}>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>{p.title}</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>{p.description}</Typography>
                  <Button size="small">शुरू करें</Button>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default QuizList;
