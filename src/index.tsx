import React                from 'react';
import App                  from './App';
import ReactDOM             from 'react-dom/client';
import reportWebVitals      from './reportWebVitals';

import { store }            from './redux/store';
import { Provider }         from 'react-redux';

import './css/Normalize.css';
import './css/Main.css';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>
);

reportWebVitals();