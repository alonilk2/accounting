import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { Box } from '@mui/material';
import type { SxProps, Theme } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useUIStore } from '../stores';
import 'highlight.js/styles/github-dark.css';

interface MarkdownRendererProps {
  content: string;
  sx?: SxProps<Theme>;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, sx = {} }) => {
  const theme = useTheme();
  const { language } = useUIStore();
  const isHebrew = language === 'he';
  const isDark = theme.palette.mode === 'dark';

  return (
    <Box
      sx={{
        direction: isHebrew ? 'rtl' : 'ltr',
        textAlign: isHebrew ? 'right' : 'left',
        '& .hljs': {
          backgroundColor: 'transparent !important',
          color: 'text.primary',
        },
        // Headers
        '& h1': {
          fontSize: '2rem',
          fontWeight: 700,
          color: 'primary.main',
          marginBottom: theme.spacing(3),
          marginTop: theme.spacing(2),
          borderBottom: '2px solid',
          borderColor: 'primary.main',
          paddingBottom: theme.spacing(1),
        },
        '& h2': {
          fontSize: '1.5rem',
          fontWeight: 600,
          color: 'text.primary',
          marginBottom: theme.spacing(2),
          marginTop: theme.spacing(3),
          borderBottom: '1px solid',
          borderColor: 'divider',
          paddingBottom: theme.spacing(0.5),
        },
        '& h3': {
          fontSize: '1.25rem',
          fontWeight: 600,
          color: 'text.primary',
          marginBottom: theme.spacing(1.5),
          marginTop: theme.spacing(2.5),
        },
        '& h4, & h5, & h6': {
          fontWeight: 600,
          color: 'text.primary',
          marginBottom: theme.spacing(1),
          marginTop: theme.spacing(2),
        },
        // Paragraphs
        '& p': {
          fontSize: '1rem',
          lineHeight: 1.7,
          color: 'text.primary',
          marginBottom: theme.spacing(2),
        },
        // Lists
        '& ul, & ol': {
          marginBottom: theme.spacing(2),
          paddingLeft: isHebrew ? 0 : theme.spacing(3),
          paddingRight: isHebrew ? theme.spacing(3) : 0,
          '& li': {
            marginBottom: theme.spacing(0.5),
            color: 'text.primary',
            lineHeight: 1.6,
          },
          '& li::marker': {
            color: theme.palette.primary.main,
          },
        },
        '& ol li::marker': {
          fontWeight: 600,
        },
        // Code
        '& code': {
          fontFamily: 'Consolas, Monaco, "Courier New", monospace',
          fontSize: '0.85rem',
          backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
          padding: theme.spacing(0.25, 1),
          borderRadius: theme.spacing(0.5),
          border: '1px solid',
          borderColor: 'divider',
        },
        '& pre': {
          backgroundColor: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.02)',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: theme.spacing(2),
          padding: theme.spacing(2),
          marginBottom: theme.spacing(2),
          overflow: 'auto',
          direction: 'ltr',
          textAlign: 'left',
          '& code': {
            backgroundColor: 'transparent',
            border: 'none',
            padding: 0,
            fontSize: '0.9rem',
            lineHeight: 1.5,
          },
        },
        // Tables
        '& table': {
          width: '100%',
          borderCollapse: 'collapse',
          marginBottom: theme.spacing(3),
          backgroundColor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: theme.spacing(2),
          overflow: 'hidden',
          '& th, & td': {
            padding: theme.spacing(1.5),
            borderBottom: '1px solid',
            borderColor: 'divider',
            textAlign: isHebrew ? 'right' : 'left',
            color: 'text.primary',
          },
          '& th': {
            backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
            fontWeight: 600,
          },
        },
        // Blockquotes
        '& blockquote': {
          margin: 0,
          marginBottom: theme.spacing(2),
          padding: theme.spacing(2),
          borderLeft: isHebrew ? 'none' : '4px solid',
          borderRight: isHebrew ? '4px solid' : 'none',
          borderColor: 'primary.main',
          backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
          fontStyle: 'italic',
          borderRadius: theme.spacing(1),
          '& > *:last-child': {
            marginBottom: 0,
          },
        },
        // Horizontal rules
        '& hr': {
          border: 'none',
          borderTop: '1px solid',
          borderColor: 'divider',
          margin: theme.spacing(3, 0),
        },
        // Links
        '& a': {
          color: 'primary.main',
          textDecoration: 'none',
          borderBottom: '1px solid transparent',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            borderBottomColor: 'primary.main',
            color: 'primary.dark',
          },
        },
        // Strong/Bold
        '& strong': {
          fontWeight: 700,
          color: 'text.primary',
        },
        // Emphasis/Italic
        '& em': {
          fontStyle: 'italic',
          color: 'text.primary',
        },
        ...sx,
      }}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
      >
        {content}
      </ReactMarkdown>
    </Box>
  );
};

export default MarkdownRenderer;
