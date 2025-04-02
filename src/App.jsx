import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom'; 
import Chat from './Chat';

function App() {
  return (
    <Router>
      <Chat />
    </Router>
  );
}

export default App;
