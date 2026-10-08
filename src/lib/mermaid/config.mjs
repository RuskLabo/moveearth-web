/**
 * The Mermaid theme, shared by the site build and the in-game PNG export
 * (tools/render-ingame-mermaid.mjs) so a diagram looks the same in both.
 */
export const mermaidConfig = {
  theme: 'base',
  themeVariables: {
    darkMode: true,
    background: '#16211a',
    primaryColor: '#203126',
    primaryTextColor: '#eef5e7',
    primaryBorderColor: '#75a84b',
    secondaryColor: '#1b2a20',
    tertiaryColor: '#16211a',
    lineColor: '#8b9784',
    textColor: '#eef5e7',
    mainBkg: '#203126',
    nodeBorder: '#75a84b',
    clusterBkg: '#16211a',
    clusterBorder: '#4e5a48',
    edgeLabelBackground: '#101713',
    fontFamily: "'Zen Kaku Gothic New', sans-serif",
  },
};
