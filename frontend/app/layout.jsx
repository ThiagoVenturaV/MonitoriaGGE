import './globals.css';

export const metadata = {
  title: 'Monitoria de Matemática • Colégio GGE',
  description: 'Plataforma oficial de monitoria de matemática e auxílio aos vestibulandos do Colégio GGE.',
  icons: {
    icon: 'https://cdn.gge.com.br/web/wp-content/uploads/2023/09/logo-gge.png',
    shortcut: 'https://cdn.gge.com.br/web/wp-content/uploads/2023/09/logo-gge.png',
    apple: 'https://cdn.gge.com.br/web/wp-content/uploads/2023/09/logo-gge.png',
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="icon" type="image/png" href="https://cdn.gge.com.br/web/wp-content/uploads/2023/09/logo-gge.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
