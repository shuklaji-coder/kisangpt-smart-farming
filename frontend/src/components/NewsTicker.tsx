import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Box, Chip, Typography } from '@mui/material';

export type TickerItem = {
  title: string;
  category?: string;
  urgent?: boolean;
  icon?: string; // emoji or small text
};

interface NewsTickerProps {
  items: TickerItem[];
  height?: number; // px
  speed?: number; // pixels per second
  accent?: 'urgent' | 'normal';
  label?: string; // e.g., "Farming News"
  refreshMs?: number; // refetch interval if onFetch provided
  onFetch?: () => Promise<TickerItem[]>; // optional live fetch
}

/**
 * A smooth, continuous, crypto-style news ticker.
 * - Duplicates content to create a seamless loop
 * - Optional onFetch for live updates
 */
const NewsTicker: React.FC<NewsTickerProps> = ({
  items,
  height = 40,
  speed = 100,
  accent = 'normal',
  label = 'Farming News',
  refreshMs,
  onFetch,
}) => {
  const [data, setData] = useState<TickerItem[]>(items);
  const laneRef = useRef<HTMLDivElement | null>(null);
  const [laneWidth, setLaneWidth] = useState(0);
  // scale chip sizes with height
  const chipH = Math.max(24, Math.min(40, Math.round(height * 0.6)));
  const chipFont = Math.min(16, Math.max(12, Math.round(chipH * 0.5)));
  const dotSize = Math.max(10, Math.round(height * 0.25));

  // Optional live refresh
  useEffect(() => {
    if (!onFetch || !refreshMs) return;
    let mounted = true;
    const fetchNow = async () => {
      try {
        const res = await onFetch();
        if (mounted && Array.isArray(res) && res.length) setData(res);
      } catch (_) {}
    };
    fetchNow();
    const id = setInterval(fetchNow, refreshMs);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, [onFetch, refreshMs]);

  // measure content width for animation duration
  useEffect(() => {
    const el = laneRef.current;
    if (!el) return;
    const update = () => setLaneWidth(el.scrollWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [data]);

  const duration = useMemo(() => {
    if (!laneWidth || speed <= 0) return 30; // default
    return Math.max(12, Math.round(laneWidth / speed));
  }, [laneWidth, speed]);

  const bg = accent === 'urgent'
    ? 'linear-gradient(90deg, #1c1412 0%, #141a17 100%)'
    : 'linear-gradient(90deg, #0e1a14 0%, #101a15 100%)';
  const fg = accent === 'urgent' ? '#fdba74' : '#a7f3d0';

  const laneStyles = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 16,
    paddingRight: 16,
  } as const;

  return (
    <Box sx={{
      overflow: 'hidden',
      borderRadius: 12,
      border: '1px solid rgba(255,255,255,0.09)',
      boxShadow: '0 2px 8px rgba(0,0,0,0.35)',
      background: bg,
      color: fg,
      height,
      display: 'flex',
      alignItems: 'center',
      gap: 1,
      px: 1,
    }}>
      {/* Live dot + label */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0, pl: 1 }}>
        <Box sx={{ width: dotSize, height: dotSize, borderRadius: '50%', bgcolor: '#e53935', animation: 'blink 1.5s infinite' }} />
        <Typography variant="body2" sx={{ fontWeight: 700 }}>
          {label}
        </Typography>
        <Chip label="LIVE" size="small" color="error" sx={{ height: 22, '& .MuiChip-label': { px: 0.5, fontWeight: 700 } }} />
      </Box>

      {/* Scrolling lane container */}
      <Box sx={{ flex: 1, overflow: 'hidden', pl: 1 }}>
        <Box
          ref={laneRef}
          sx={{
            display: 'inline-block',
            whiteSpace: 'nowrap',
            animation: `${duration}s linear 0s infinite tickerScroll`,
          }}
        >
          {/* content duplicated for seamless loop */}
          <Box component="span" sx={laneStyles}>
            {data.map((item, idx) => (
              <Chip
                key={`a-${idx}`}
                label={`${item.icon ? item.icon + ' ' : ''}${item.title}`}
                sx={{
height: chipH,
                  borderRadius: 999,
                  bgcolor: item.urgent ? 'rgba(248, 113, 113, 0.16)' : 'rgba(74, 222, 128, 0.14)',
                  color: item.urgent ? '#fca5a5' : '#a7f3d0',
                  border: '1px solid rgba(255,255,255,0.08)',
'& .MuiChip-label': { fontSize: chipFont, px: 1.2, fontWeight: 600 },
                }}
              />
            ))}
          </Box>
          <Box component="span" sx={laneStyles}>
            {data.map((item, idx) => (
              <Chip
                key={`b-${idx}`}
                label={`${item.icon ? item.icon + ' ' : ''}${item.title}`}
                sx={{
height: chipH,
                  borderRadius: 999,
                  bgcolor: item.urgent ? 'rgba(248, 113, 113, 0.16)' : 'rgba(74, 222, 128, 0.14)',
                  color: item.urgent ? '#fca5a5' : '#a7f3d0',
                  border: '1px solid rgba(255,255,255,0.08)',
                  '& .MuiChip-label': { fontSize: 13, px: 1.2, fontWeight: 600 },
                }}
              />
            ))}
          </Box>
        </Box>
      </Box>

      <style>{`
        @keyframes tickerScroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </Box>
  );
};

export default NewsTicker;
