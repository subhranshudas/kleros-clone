import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import App from './App';
import Admin from './pages/Admin';
import Client from './pages/Client';
import Worker from './pages/Worker';
import Voter from './pages/Voter';
import NotFound from './pages/NotFound';

const Wrapper = () => {
  const lightTheme = createTheme({ palette: { mode: 'light' } });

  return (
    <ThemeProvider theme={lightTheme}>
       <BrowserRouter>
        <Routes>
          <Route path="/" element={<App />}>
            <Route path="admin" element={<Admin />} />
            <Route path="client" element={<Client />} />
            <Route path="worker" element={<Worker />} />
            <Route path="voter" element={<Voter />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

ReactDOM.render(
  <React.StrictMode>
    <Wrapper />
  </React.StrictMode>,
  document.getElementById('root')
);
